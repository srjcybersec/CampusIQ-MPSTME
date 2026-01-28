"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { VoiceWave } from "./voice-wave";

interface VoiceCommand {
  intent: string;
  action: string;
  parameters?: Record<string, any>;
  response?: string;
}

export function SNEHA() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [speakingAudioStream, setSpeakingAudioStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const { user } = useAuth();

  const [isSupported, setIsSupported] = useState(true);

  const finalTranscriptRef = useRef<string>("");
  
  // Phase 4: Conversation history for multi-turn conversations
  const conversationHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser");
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Capture full sentences
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = async () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
      finalTranscriptRef.current = "";
      
      // Get microphone stream for audio visualization
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      } catch (error) {
        console.warn("Could not access microphone for visualization:", error);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let newFinalTranscript = finalTranscriptRef.current;

      // Process all results from the beginning
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = newFinalTranscript;

      // Show both final and interim results
      const displayText = newFinalTranscript + interimTranscript;
      setTranscript(displayText.trim());

      // If we have final results, wait a bit then stop to capture everything
      if (newFinalTranscript.trim() && !interimTranscript) {
        // Wait for silence/no more input
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 1000); // 1 second of silence
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setResponse("Microphone permission denied. Please enable microphone access.");
      } else if (event.error === "no-speech") {
        setResponse("No speech detected. Please try again.");
      } else if (event.error === "aborted") {
        // User stopped or timeout - this is normal
        setIsListening(false);
      } else {
        setResponse("Sorry, I couldn't understand. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      const commandToProcess = finalTranscriptRef.current.trim();
      if (commandToProcess) {
        handleCommand(commandToProcess);
      }
      finalTranscriptRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      // Cleanup audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - recognition setup should only run once, handleCommand is stable

  // Handle voice command
  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setResponse("");

    // Add user command to conversation history
    conversationHistoryRef.current.push({
      role: "user",
      content: command,
    });

    try {
      const res = await fetch("/api/voice-assistant/understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          userId: user?.uid,
          currentPath: window.location.pathname,
          conversationHistory: conversationHistoryRef.current.slice(-5), // Last 5 messages for context
        }),
      });

      const data = await res.json();

      if (data.success) {
        await executeAction(data.command, command);
        if (data.response) {
          setResponse(data.response);
          // Add assistant response to conversation history
          conversationHistoryRef.current.push({
            role: "assistant",
            content: data.response,
          });
          speak(data.response);
        }
      } else {
        const errorMsg = data.error || "Sorry, I didn't understand that command.";
        setResponse(errorMsg);
        conversationHistoryRef.current.push({
          role: "assistant",
          content: errorMsg,
        });
        speak(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = "Sorry, I encountered an error. Please try again.";
      setResponse(errorMsg);
      conversationHistoryRef.current.push({
        role: "assistant",
        content: errorMsg,
      });
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute action based on command
  const executeAction = async (command: VoiceCommand, originalCommand?: string) => {
    switch (command.action) {
      case "navigate":
        if (command.parameters?.path) {
          router.push(command.parameters.path);
        }
        break;

      case "check_attendance":
        router.push("/academics?section=attendance");
        break;

      case "check_schedule":
        router.push("/schedule");
        break;

      case "check_results":
        router.push("/academics?section=results");
        break;

      case "open_pyqs":
        router.push("/resources/pyqs");
        break;

      case "open_notes":
        router.push("/resources/notes");
        break;

      case "open_assignments":
        router.push("/resources/assignments");
        break;

      case "open_srb":
        router.push("/academics?section=student-resource-book");
        break;

      case "open_policy":
        router.push("/academics?section=examination-policy");
        break;

      case "download_pyq":
        if (command.parameters?.pyqId) {
          window.open(`/api/pyqs/download?id=${command.parameters.pyqId}`, "_blank");
        } else if (command.parameters?.subject || command.parameters?.semester || command.parameters?.branch) {
          // Navigate to PYQs page with filters
          const params = new URLSearchParams();
          if (command.parameters.branch) params.set("branch", command.parameters.branch);
          if (command.parameters.semester) params.set("semester", command.parameters.semester);
          if (command.parameters.subject) params.set("subject", command.parameters.subject);
          router.push(`/resources/pyqs?${params.toString()}`);
        } else {
          router.push("/resources/pyqs");
        }
        break;

      case "query_srb":
        if (command.parameters?.question) {
          try {
            setIsProcessing(true);
            // Build conversation history for SRB context (filter SRB-related messages)
            const srbHistory = conversationHistoryRef.current
              .filter(msg => msg.content.toLowerCase().includes("srb") || msg.content.toLowerCase().includes("student resource"))
              .slice(-3)
              .map(msg => ({
                role: msg.role,
                content: msg.content,
              }));
            
            const res = await fetch("/api/student-resource-book/ask", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: command.parameters.question,
                conversationHistory: srbHistory, // Phase 4: Include conversation history
              }),
            });
            const data = await res.json();
            if (data.success && data.answer) {
              // Limit answer length for voice (max 500 chars)
              const shortAnswer = data.answer.length > 500 
                ? data.answer.substring(0, 500) + "..."
                : data.answer;
              setResponse(shortAnswer);
              // Update conversation history with full answer
              const lastIndex = conversationHistoryRef.current.length - 1;
              if (lastIndex >= 0 && conversationHistoryRef.current[lastIndex].role === "assistant") {
                conversationHistoryRef.current[lastIndex].content = data.answer;
              }
              speak(shortAnswer);
            } else {
              const errorMsg = data.error || "Sorry, I couldn't find an answer in the Student Resource Book.";
              setResponse(errorMsg);
              speak(errorMsg);
            }
          } catch (error: any) {
            const errorMsg = "Sorry, I encountered an error while searching the Student Resource Book.";
            setResponse(errorMsg);
            speak(errorMsg);
          } finally {
            setIsProcessing(false);
          }
        } else {
          router.push("/academics?section=student-resource-book");
        }
        break;

      case "query_policy":
        if (command.parameters?.question) {
          try {
            setIsProcessing(true);
            // Build conversation history for Policy context (filter policy-related messages)
            const policyHistory = conversationHistoryRef.current
              .filter(msg => msg.content.toLowerCase().includes("policy") || msg.content.toLowerCase().includes("examination"))
              .slice(-3)
              .map(msg => ({
                role: msg.role,
                content: msg.content,
              }));
            
            const res = await fetch("/api/academics/examination-policy/ask", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: command.parameters.question,
                conversationHistory: policyHistory, // Phase 4: Include conversation history
              }),
            });
            const data = await res.json();
            if (data.success && data.answer) {
              // Limit answer length for voice (max 500 chars)
              const shortAnswer = data.answer.length > 500 
                ? data.answer.substring(0, 500) + "..."
                : data.answer;
              setResponse(shortAnswer);
              // Update conversation history with full answer
              const lastIndex = conversationHistoryRef.current.length - 1;
              if (lastIndex >= 0 && conversationHistoryRef.current[lastIndex].role === "assistant") {
                conversationHistoryRef.current[lastIndex].content = data.answer;
              }
              speak(shortAnswer);
            } else {
              const errorMsg = data.error || "Sorry, I couldn't find an answer in the Examination Policy.";
              setResponse(errorMsg);
              speak(errorMsg);
            }
          } catch (error: any) {
            const errorMsg = "Sorry, I encountered an error while searching the Examination Policy.";
            setResponse(errorMsg);
            speak(errorMsg);
          } finally {
            setIsProcessing(false);
          }
        } else {
          router.push("/academics?section=examination-policy");
        }
        break;

      case "check_alerts":
        try {
          setIsProcessing(true);
          // Trigger proactive alerts check
          const res = await fetch(`/api/proactive-assistance/alerts?userId=${user?.uid}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (data.success && data.alerts && data.alerts.length > 0) {
            const alertCount = data.alerts.length;
            const highPriorityAlerts = data.alerts.filter((a: any) => a.priority === "high");
            
            let alertMessage = "";
            if (highPriorityAlerts.length > 0) {
              alertMessage = `You have ${highPriorityAlerts.length} high priority alert${highPriorityAlerts.length > 1 ? "s" : ""}. ${highPriorityAlerts[0].message}`;
            } else {
              alertMessage = `You have ${alertCount} alert${alertCount > 1 ? "s" : ""}. ${data.alerts[0].message}`;
            }
            
            setResponse(alertMessage);
            speak(alertMessage);
          } else {
            const noAlertsMsg = "You have no alerts or reminders at the moment. Everything looks good!";
            setResponse(noAlertsMsg);
            speak(noAlertsMsg);
          }
        } catch (error: any) {
          const errorMsg = "Sorry, I couldn't check your alerts right now.";
          setResponse(errorMsg);
          speak(errorMsg);
        } finally {
          setIsProcessing(false);
        }
        break;

      default:
        console.log("Unknown action:", command.action);
    }
  };

  // Text-to-Speech with female voice
  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const getFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Priority list of female voice names (common across browsers/OS)
      const femaleVoiceNames = [
        "Microsoft Zira", // Windows
        "Samantha", // macOS
        "Karen", // macOS
        "Victoria", // macOS
        "Google UK English Female", // Chrome
        "Google US English Female", // Chrome
        "Microsoft Zira Desktop", // Windows
      ];
      
      // Try exact matches first
      for (const name of femaleVoiceNames) {
        const voice = voices.find(v => v.name === name);
        if (voice) return voice;
      }
      
      // Try partial matches
      for (const name of femaleVoiceNames) {
        const voice = voices.find(v => 
          v.name.toLowerCase().includes(name.toLowerCase().split(" ")[1]?.toLowerCase() || "")
        );
        if (voice) return voice;
      }
      
      // Fallback: find any English female voice
      return voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.toLowerCase().includes("female") ||
           voice.name.toLowerCase().includes("zira") ||
           voice.name.toLowerCase().includes("samantha") ||
           voice.name.toLowerCase().includes("karen"))
      ) || voices.find((voice) => voice.lang.startsWith("en-US"));
    };

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set female voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const femaleVoice = getFemaleVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }
    
    // Sweet, friendly female voice settings
    utterance.rate = 0.92; // Slightly slower for clarity and sweetness
    utterance.pitch = 1.25; // Higher pitch for female voice (sweet girl type)
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Create a subtle wave animation for SNEHA's voice
      // (We can't easily capture TTS audio, so we'll use a smooth animation)
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      if (speakingAudioStream) {
        speakingAudioStream.getTracks().forEach(track => track.stop());
        setSpeakingAudioStream(null);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (speakingAudioStream) {
        speakingAudioStream.getTracks().forEach(track => track.stop());
        setSpeakingAudioStream(null);
      }
    };

    // Load voices if not already loaded
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const femaleVoice = getFemaleVoice();
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setResponse("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Firefox.");
      setIsOpen(true);
      return;
    }
    
    if (!recognitionRef.current) {
      setResponse("Speech recognition is not available. Please check your browser settings.");
      setIsOpen(true);
      return;
    }

    try {
      // Reset state
      setTranscript("");
      setResponse("");
      finalTranscriptRef.current = "";
      
      recognitionRef.current.start();
      setIsOpen(true);
    } catch (error: any) {
      if (error.message?.includes("already started")) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      } else {
        setResponse("Could not start listening. Please check microphone permissions.");
      }
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }
    setIsListening(false);
    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  }, [audioStream]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle assistant
  const toggleAssistant = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative">
          <Button
            onClick={toggleAssistant}
            className={`w-16 h-16 rounded-full shadow-2xl ${
              isListening
                ? "bg-gradient-to-r from-red-500 to-pink-600"
                : "bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8]"
            } hover:scale-110 transition-transform relative overflow-hidden`}
            size="lg"
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <VoiceWave isActive={true} color="#ffffff" bars={3} />
                </div>
              </>
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/30"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Voice Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-3rem)]"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Card variant="glass" className="shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">SNEHA</h3>
                      <p className="text-[10px] text-[#6b6b6b]">Your AI Voice Assistant</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      stopListening();
                      stopSpeaking();
                    }}
                    className="text-[#D4D4D8] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* SNEHA Description */}
                {!isListening && !isProcessing && !transcript && !response && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-[#7C7CFF]/10 to-[#38BDF8]/10 rounded-lg border border-[#7C7CFF]/20">
                    <p className="text-xs text-[#D4D4D8] leading-relaxed">
                      <span className="font-semibold text-white">SNEHA</span> (Smart Navigation & Educational Helper Assistant) is your intelligent voice companion. 
                      I can help you navigate the app, check your attendance, view schedules, download PYQs, and much more. 
                      Just speak naturally and I&apos;ll understand!
                    </p>
                  </div>
                )}

                {/* Status Indicator with Wave Animation */}
                <div className="mb-4">
                  {isListening && (
                    <motion.div
                      className="flex items-center gap-3 text-sm text-[#D4D4D8]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <VoiceWave isActive={true} color="#ef4444" bars={5} audioStream={audioStream} />
                      <span>Listening...</span>
                    </motion.div>
                  )}
                  {isProcessing && (
                    <div className="flex items-center gap-3 text-sm text-[#D4D4D8]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <motion.div
                      className="flex items-center gap-3 text-sm text-[#D4D4D8]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <VoiceWave isActive={true} color="#7C7CFF" bars={5} audioStream={speakingAudioStream} />
                      <span>SNEHA speaking...</span>
                    </motion.div>
                  )}
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="mb-3 p-3 bg-[#161616] rounded-lg border border-[#222222]">
                    <p className="text-xs text-[#6b6b6b] mb-1">You said:</p>
                    <p className="text-sm text-white">{transcript}</p>
                  </div>
                )}

                {/* Response */}
                {response && (
                  <div className="p-3 bg-gradient-to-r from-[#7C7CFF]/20 to-[#38BDF8]/20 rounded-lg border border-[#7C7CFF]/30">
                    <p className="text-xs text-[#6b6b6b] mb-1">SNEHA:</p>
                    <p className="text-sm text-white">{response}</p>
                  </div>
                )}

                {/* Instructions */}
                {!transcript && !response && !isListening && !isProcessing && (
                  <div className="text-xs text-[#6b6b6b] space-y-2">
                    {!isSupported ? (
                      <p className="text-red-400">Speech recognition not supported. Please use Chrome, Edge, or Firefox.</p>
                    ) : (
                      <>
                        <div>
                          <p className="font-semibold text-[#D4D4D8] mb-1">Try saying:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li>&quot;Go to schedule&quot;</li>
                            <li>&quot;Check my attendance&quot;</li>
                            <li>&quot;Show my results&quot;</li>
                            <li>&quot;Open PYQs&quot;</li>
                            <li>&quot;Download PYQ for AI semester 5&quot;</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
