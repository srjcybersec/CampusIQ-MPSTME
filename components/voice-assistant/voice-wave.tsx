"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface VoiceWaveProps {
  isActive: boolean;
  color?: string;
  bars?: number;
  audioStream?: MediaStream | null;
}

export function VoiceWave({ isActive, color = "#7C7CFF", bars = 5, audioStream }: VoiceWaveProps) {
  const [heights, setHeights] = useState<number[]>(Array(bars).fill(0.2));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(bars).fill(0.2));
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      return;
    }

    // If no audio stream provided, use smooth animated wave (for TTS)
    if (!audioStream) {
      const interval = setInterval(() => {
        setHeights(
          Array(bars)
            .fill(0)
            .map(() => {
              // Create smooth, natural wave pattern
              const base = 0.3 + Math.random() * 0.4;
              return Math.min(1, base);
            })
        );
      }, 120);
      return () => clearInterval(interval);
    }

    // Initialize Web Audio API for real-time audio analysis
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(audioStream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Animate based on real audio data
      const updateWave = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Extract frequency bands for visualization
        const bandSize = Math.floor(bufferLength / bars);
        const newHeights = Array(bars)
          .fill(0)
          .map((_, i) => {
            const start = i * bandSize;
            const end = start + bandSize;
            let sum = 0;
            for (let j = start; j < end && j < bufferLength; j++) {
              sum += dataArrayRef.current![j];
            }
            const average = sum / bandSize;
            // Normalize to 0-1 range (0-255 -> 0-1)
            return Math.min(1, (average / 255) * 2); // Multiply by 2 for more visible waves
          });

        setHeights(newHeights);
        animationFrameRef.current = requestAnimationFrame(updateWave);
      };

      updateWave();
    } catch (error) {
      console.error("Error initializing audio analysis:", error);
      // Fallback to random animation
      const interval = setInterval(() => {
        setHeights(
          Array(bars)
            .fill(0)
            .map(() => 0.2 + Math.random() * 0.8)
        );
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [isActive, audioStream, bars]);

  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {Array(bars)
        .fill(0)
        .map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: "4px",
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}, 0 0 12px ${color}40`,
              minHeight: "4px",
            }}
            animate={{
              height: isActive ? `${Math.max(20, heights[i] * 100)}%` : "20%",
              opacity: isActive ? 0.7 + heights[i] * 0.3 : 0.3,
            }}
            transition={{
              duration: 0.15,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
}
