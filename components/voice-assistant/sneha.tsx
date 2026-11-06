"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { auth } from "@/lib/firebase/config";
import { VoiceWave } from "./voice-wave";
import {
  getSnehaDeviceCapabilities,
  unlockSpeechSynthesis,
  isMobileSpeechRecognitionMode,
  type SnehaDeviceCapabilities,
} from "@/lib/voice-assistant/device-capabilities";
import { getFriendlyAiError } from "@/lib/ai/client-gemini-guard";
import { authedFetch } from "@/lib/auth/authed-fetch";

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
  const handleCommandRef = useRef<((command: string) => Promise<void>) | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const userRef = useRef(user);

  // Keep refs in sync so speech-recognition callbacks always see the latest auth state.
  // The recognition effect runs once on mount (often before Firebase auth restores), so
  // reading user from a stale closure would falsely report "please sign in".
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const getUserId = (): string | undefined =>
    userRef.current?.uid ?? auth.currentUser?.uid ?? undefined;

  const [isSupported, setIsSupported] = useState(true);
  const deviceCapsRef = useRef<SnehaDeviceCapabilities | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const finalTranscriptRef = useRef<string>("");
  const latestTranscriptRef = useRef<string>("");
  const commandHandledRef = useRef(false);
  const mobileSpeechModeRef = useRef(false);
  
  // Phase 4: Conversation history for multi-turn conversations
  const conversationHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Detect device capabilities once on mount (for iOS speech tweaks)
  useEffect(() => {
    deviceCapsRef.current = getSnehaDeviceCapabilities();
    setIsSupported(deviceCapsRef.current.hasSpeechRecognition);
  }, []);

  const stopMicStream = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setAudioStream(null);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const caps = getSnehaDeviceCapabilities();
    deviceCapsRef.current = caps;
    mobileSpeechModeRef.current = isMobileSpeechRecognitionMode(caps);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || !caps.hasSpeechRecognition) {
      console.warn("Speech Recognition not supported on this device/browser");
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);

    const attachRecognitionHandlers = (recognition: any) => {
      const mobileMode = mobileSpeechModeRef.current;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setResponse("");
        finalTranscriptRef.current = "";
        latestTranscriptRef.current = "";
        commandHandledRef.current = false;
      };

      recognition.onresult = (event: any) => {
        let interimPart = "";

        // resultIndex is required on mobile — results are incremental, not a full snapshot
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
          } else {
            interimPart += text;
          }
        }

        latestTranscriptRef.current = `${finalTranscriptRef.current} ${interimPart}`.trim();
        setTranscript(latestTranscriptRef.current);

        const lastResult = event.results[event.results.length - 1];
        if (lastResult?.isFinal) {
          setTimeout(() => {
            try {
              recognitionRef.current?.stop();
            } catch {
              // ignore
            }
          }, mobileMode ? 250 : 800);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        stopMicStream();
        if (event.error === "not-allowed") {
          setResponse("Microphone permission denied. Please enable microphone access.");
        } else if (event.error === "no-speech") {
          setResponse("No speech detected. Please try again.");
        } else if (event.error === "aborted") {
          setIsListening(false);
        } else if (event.error === "network") {
          setResponse("Voice recognition needs internet. Check your connection.");
        } else {
          setResponse("Sorry, I couldn't understand. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopMicStream();

        if (commandHandledRef.current) return;

        const commandToProcess = (
          finalTranscriptRef.current || latestTranscriptRef.current
        ).trim();

        if (commandToProcess && handleCommandRef.current) {
          commandHandledRef.current = true;
          handleCommandRef.current(commandToProcess);
        }

        finalTranscriptRef.current = "";
        latestTranscriptRef.current = "";
      };
    };

    const recognition = new SpeechRecognition();
    recognition.continuous = !mobileSpeechModeRef.current;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    attachRecognitionHandlers(recognition);

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      setAudioStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMicStream]);

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
          userId: getUserId(),
          currentPath: window.location.pathname,
          conversationHistory: conversationHistoryRef.current.slice(-5), // Last 5 messages for context
        }),
      });

      const data = await res.json();

      if (data.success) {
        // executeAction returns true when it already produced and spoke its own
        // final answer (e.g. reading back schedule/results/alerts). In that case we
        // must NOT speak data.response again, or it would cut off the real answer.
        const handledSpeech = await executeAction(data.command, command);
        if (!handledSpeech && data.response) {
          setResponse(data.response);
          conversationHistoryRef.current.push({
            role: "assistant",
            content: data.response,
          });
          speak(data.response);
        }
      } else {
        const errorMsg =
          data.response ||
          getFriendlyAiError(data, data.error || "Sorry, I didn't understand that command.");
        setResponse(errorMsg);
        conversationHistoryRef.current.push({
          role: "assistant",
          content: errorMsg,
        });
        speak(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = getFriendlyAiError(error, "Sorry, I encountered an error. Please try again.");
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
  handleCommandRef.current = handleCommand;

  // Speak a final answer that SNEHA produced herself (read-back / query actions).
  // Also records it into conversation history so multi-turn context stays coherent.
  const speakFinal = (text: string) => {
    setResponse(text);
    conversationHistoryRef.current.push({ role: "assistant", content: text });
    speak(text);
  };

  // Execute action based on command.
  // Returns true when the action already produced and spoke its own final answer,
  // so the caller should NOT speak the generic data.response on top of it.
  const executeAction = async (command: VoiceCommand, originalCommand?: string): Promise<boolean> => {
    switch (command.action) {
      case "navigate":
        if (command.parameters?.path) {
          router.push(command.parameters.path);
        }
        return false;

      case "check_attendance":
        router.push("/academics?section=attendance");
        return false;

      case "check_schedule":
        router.push("/schedule");
        return false;

      case "check_results":
        router.push("/academics?section=results");
        return false;

      case "open_pyqs":
        router.push("/resources/pyqs");
        return false;

      case "open_notes":
        router.push("/resources/notes");
        return false;

      case "open_assignments":
        router.push("/resources/assignments");
        return false;

      case "open_srb":
        router.push("/academics?section=student-resource-book");
        return false;

      case "open_policy":
        router.push("/academics?section=examination-policy");
        return false;

      case "answer":
        // Pure conversation - the spoken text lives in parameters.speech (or response).
        // Handled by the caller speaking data.response, so nothing to do here.
        return false;

      case "read_schedule":
        return await readSchedule(command.parameters?.day);

      case "read_results":
        return await readResults();

      case "read_orders":
        return await readOrders();

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
        return false;

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
                conversationHistory: srbHistory,
                userId: getUserId(),
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
              const errorMsg = getFriendlyAiError(
                data,
                data.error || "Sorry, I couldn't find an answer in the Student Resource Book."
              );
              setResponse(errorMsg);
              speak(errorMsg);
            }
          } catch (error: any) {
            const errorMsg = getFriendlyAiError(
              error,
              "Sorry, I encountered an error while searching the Student Resource Book."
            );
            setResponse(errorMsg);
            speak(errorMsg);
          } finally {
            setIsProcessing(false);
          }
          return true;
        } else {
          router.push("/academics?section=student-resource-book");
          return false;
        }

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
                conversationHistory: policyHistory,
                userId: getUserId(),
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
              const errorMsg = getFriendlyAiError(
                data,
                data.error || "Sorry, I couldn't find an answer in the Examination Policy."
              );
              setResponse(errorMsg);
              speak(errorMsg);
            }
          } catch (error: any) {
            const errorMsg = getFriendlyAiError(
              error,
              "Sorry, I encountered an error while searching the Examination Policy."
            );
            setResponse(errorMsg);
            speak(errorMsg);
          } finally {
            setIsProcessing(false);
          }
          return true;
        } else {
          router.push("/academics?section=examination-policy");
          return false;
        }

      case "check_alerts":
        try {
          setIsProcessing(true);
          // Trigger proactive alerts check
          const res = await authedFetch(`/api/proactive-assistance/alerts?userId=${getUserId()}`, {
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
        return true;

      default:
        // Unknown action: let the caller speak data.response if present.
        console.log("Unknown action:", command.action);
        return false;
    }
  };

  // ---- Read-back helpers: fetch live data and speak it out loud ----

  const formatTime = (t?: string): string => {
    if (!t) return "";
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (isNaN(h)) return t;
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return m === 0 ? `${h} ${period}` : `${h}:${mStr} ${period}`;
  };

  const resolveTargetDay = (dayParam?: string): { key: string; label: string } => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const raw = (dayParam || "today").toLowerCase();

    if (raw === "tomorrow") {
      const key = days[(now.getDay() + 1) % 7];
      return { key, label: `tomorrow, ${key}` };
    }
    const named = days.find((d) => d.toLowerCase() === raw);
    if (named) {
      return { key: named, label: named === days[now.getDay()] ? "today" : `on ${named}` };
    }
    // default: today
    return { key: days[now.getDay()], label: "today" };
  };

  const readSchedule = async (dayParam?: string): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) {
      speakFinal("Please sign in so I can look up your schedule.");
      return true;
    }
    try {
      setIsProcessing(true);
      const { key: targetDay, label } = resolveTargetDay(dayParam);
      const res = await authedFetch(`/api/schedule/get?userId=${userId}`);
      const data = await res.json();

      if (!data.success || !Array.isArray(data.entries) || data.entries.length === 0) {
        speakFinal(
          "I couldn't find your timetable. You can upload it in the Schedule tab and I'll be able to read your classes."
        );
        return true;
      }

      const dayClasses = data.entries
        .filter((e: any) => (e.day || "").toLowerCase() === targetDay.toLowerCase())
        .sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

      if (dayClasses.length === 0) {
        speakFinal(`Good news, you have no classes ${label}. Enjoy your free day!`);
        return true;
      }

      const list = dayClasses
        .slice(0, 6)
        .map((c: any) => {
          const room = c.room ? ` in ${c.room}` : "";
          return `${c.subject} at ${formatTime(c.startTime)}${room}`;
        })
        .join(", ");

      const count = dayClasses.length;
      const intro = `You have ${count} class${count > 1 ? "es" : ""} ${label}. `;
      const extra = count > 6 ? ", and a few more" : "";
      speakFinal(`${intro}${list}${extra}.`);
      return true;
    } catch (error) {
      console.error("[SNEHA] readSchedule error:", error);
      speakFinal("Sorry, I couldn't fetch your schedule right now.");
      return true;
    } finally {
      setIsProcessing(false);
    }
  };

  const readResults = async (): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) {
      speakFinal("Please sign in so I can look up your results.");
      return true;
    }
    try {
      setIsProcessing(true);
      const res = await authedFetch(`/api/results?userId=${userId}`);
      const data = await res.json();

      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        speakFinal(
          "You haven't uploaded any results yet. You can upload them in the Academics section, and I'll help you analyze them."
        );
        return true;
      }

      const latest = data.results[0];
      const total = data.results.length;
      const uploaded = latest.uploadedAt ? new Date(latest.uploadedAt) : null;
      const when = uploaded
        ? uploaded.toLocaleDateString("en-IN", { day: "numeric", month: "long" })
        : "recently";
      speakFinal(
        `Your most recent result is for semester ${latest.semester}, uploaded on ${when}. You have ${total} result${total > 1 ? "s" : ""} saved. I can open the results analyzer if you'd like.`
      );
      return true;
    } catch (error) {
      console.error("[SNEHA] readResults error:", error);
      speakFinal("Sorry, I couldn't fetch your results right now.");
      return true;
    } finally {
      setIsProcessing(false);
    }
  };

  const readOrders = async (): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) {
      speakFinal("Please sign in so I can check your canteen orders.");
      return true;
    }
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/canteen/orders?userId=${userId}`);
      const data = await res.json();
      const orders = Array.isArray(data) ? data : data.orders;

      if (!Array.isArray(orders) || orders.length === 0) {
        speakFinal("You don't have any canteen orders yet. Want me to open the canteen menu?");
        return true;
      }

      const latest = orders[0];
      const status = latest.status ? String(latest.status).replace(/_/g, " ") : "placed";
      const itemCount = Array.isArray(latest.items) ? latest.items.length : null;
      const itemsText = itemCount ? ` with ${itemCount} item${itemCount > 1 ? "s" : ""}` : "";
      speakFinal(
        `Your most recent canteen order${itemsText} is currently ${status}. You have ${orders.length} order${orders.length > 1 ? "s" : ""} in total.`
      );
      return true;
    } catch (error) {
      console.error("[SNEHA] readOrders error:", error);
      speakFinal("Sorry, I couldn't check your canteen orders right now.");
      return true;
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-Speech with female voice (with iOS/mobile fixes)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const getFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const femaleVoiceNames = [
        "Microsoft Zira",
        "Samantha",
        "Karen",
        "Victoria",
        "Google UK English Female",
        "Google US English Female",
        "Microsoft Zira Desktop",
      ];

      for (const name of femaleVoiceNames) {
        const voice = voices.find((v) => v.name === name);
        if (voice) return voice;
      }

      return (
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("zira") ||
              voice.name.toLowerCase().includes("samantha") ||
              voice.name.toLowerCase().includes("karen"))
        ) || voices.find((voice) => voice.lang.startsWith("en"))
      );
    };

    const speakChunk = (chunk: string) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const femaleVoice = getFemaleVoice();
        if (femaleVoice) utterance.voice = femaleVoice;
      }

      utterance.rate = deviceCapsRef.current?.isIOS ? 1 : 0.92;
      utterance.pitch = deviceCapsRef.current?.isIOS ? 1.1 : 1.25;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    };

    const runSpeak = () => {
      // iOS cuts off very long utterances — speak in smaller chunks
      if (deviceCapsRef.current?.isIOS && text.length > 180) {
        const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        chunks.forEach((chunk, index) => {
          setTimeout(() => speakChunk(chunk.trim()), index * 120);
        });
      } else {
        speakChunk(text);
      }
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => runSpeak();
    } else {
      runSpeak();
    }
  }, []);

  // Start listening — recognition.start() must run synchronously in the tap handler (mobile PWA).
  const startListening = useCallback(() => {
    if (!isSupported) {
      setResponse("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      setIsOpen(true);
      return;
    }

    if (!recognitionRef.current) {
      setResponse("Speech recognition is not available. Please check your browser settings.");
      setIsOpen(true);
      return;
    }

    unlockSpeechSynthesis();

    try {
      setTranscript("");
      setResponse("");
      finalTranscriptRef.current = "";
      latestTranscriptRef.current = "";
      commandHandledRef.current = false;

      // Start speech recognition immediately while the user gesture is still active.
      // Awaiting getUserMedia first breaks mobile PWA and can block onresult entirely.
      recognitionRef.current.start();
      setIsOpen(true);

      const mobileMode =
        mobileSpeechModeRef.current ||
        isMobileSpeechRecognitionMode(
          deviceCapsRef.current ?? getSnehaDeviceCapabilities()
        );

      // Desktop only: optional mic stream for wave visualization (never on mobile).
      if (!mobileMode && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            audioStreamRef.current = stream;
            setAudioStream(stream);
          })
          .catch(() => {
            // Visualization only — recognition still works without this stream
          });
      }
    } catch (error: any) {
      if (error?.message?.includes("already started")) {
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsOpen(true);
          } catch {
            setResponse("Could not start listening. Please check microphone permissions.");
            setIsOpen(true);
          }
        }, 150);
        return;
      }
      stopMicStream();
      if (error?.name === "NotAllowedError") {
        setResponse("Microphone blocked. Allow mic access for CampusIQ in app settings.");
      } else {
        setResponse("Could not start listening. Please check microphone permissions.");
      }
      setIsOpen(true);
    }
  }, [isSupported, stopMicStream]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }
    setIsListening(false);
    stopMicStream();
  }, [stopMicStream]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle assistant
  const toggleAssistant = () => {
    unlockSpeechSynthesis();
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
                      Ask me anything - I can read out your classes and results, check your canteen orders and reminders, 
                      answer questions from the Student Resource Book or Exam Policy, find and download PYQs, open any page, 
                      or just chat. Speak naturally, I&apos;ll take care of the rest!
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
                      <p className="text-red-400">Speech recognition not supported. Please use Chrome or Edge.</p>
                    ) : (
                      <div>
                        <p className="font-semibold text-[#D4D4D8] mb-1">Try saying:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>&quot;What classes do I have today?&quot;</li>
                          <li>&quot;Do I have class tomorrow?&quot;</li>
                          <li>&quot;What&apos;s my latest result?&quot;</li>
                          <li>&quot;Any reminders for me?&quot;</li>
                          <li>&quot;Open campus voices&quot;</li>
                        </ul>
                      </div>
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
