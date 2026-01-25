"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  left: number;
  top: number;
  opacity: number;
  xOffset: number;
  duration: number;
  delay: number;
  color: string;
}

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Only generate particles on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    const colors = [
      "rgba(124, 124, 255, 1)", // Electric Purple
      "rgba(56, 189, 248, 1)",   // Neon Blue
      "rgba(251, 146, 60, 1)",   // Burning Orange
      "rgba(236, 72, 153, 1)",  // Plasma Pink
      "rgba(34, 211, 238, 1)",  // Cyan
      "rgba(168, 85, 247, 1)",  // Purple
    ];

    // Generate floating neon particles
    const generatedParticles: Particle[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.8 + Math.random() * 0.2,
      xOffset: (Math.random() - 0.5) * 40,
      duration: 4 + Math.random() * 3,
      delay: Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <>
      {/* Noise grain overlay */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Floating neon particles */}
      {isMounted && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[1]">
          {particles.map((particle) => {
            return (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: "6px",
                  height: "6px",
                  background: particle.color,
                  boxShadow: `
                    0 0 15px ${particle.color},
                    0 0 30px ${particle.color},
                    0 0 45px ${particle.color},
                    0 0 60px ${particle.color.replace("1)", "0.5)")}
                  `,
                  opacity: particle.opacity,
                }}
                animate={{
                  y: [0, -50, 0],
                  x: [0, particle.xOffset, 0],
                  opacity: [particle.opacity * 0.7, particle.opacity, particle.opacity * 0.7],
                  scale: [1, 2.2, 1],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
