"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number; // Horizontal drift amount
}

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(1000);

  useEffect(() => {
    setIsMounted(true);
    
    // Get viewport height
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    
    // Generate snowflakes - subtle and light
    const generatedSnowflakes: Snowflake[] = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position
      size: 2 + Math.random() * 3, // Size between 2-5px
      duration: 8 + Math.random() * 12, // Fall duration between 8-20s
      delay: Math.random() * 5, // Random delay to stagger appearance
      opacity: 0.3 + Math.random() * 0.4, // Opacity between 0.3-0.7 for subtlety
      drift: (Math.random() - 0.5) * 50, // Horizontal drift between -25px to +25px
    }));

    setSnowflakes(generatedSnowflakes);
    
    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
      {snowflakes.map((snowflake) => (
        <motion.div
          key={snowflake.id}
          className="absolute rounded-full"
          style={{
            left: `${snowflake.left}%`,
            top: "-10px",
            width: `${snowflake.size}px`,
            height: `${snowflake.size}px`,
            background: "rgba(255, 255, 255, 0.8)",
            boxShadow: `
              0 0 ${snowflake.size * 2}px rgba(255, 255, 255, 0.5),
              0 0 ${snowflake.size * 3}px rgba(255, 255, 255, 0.3)
            `,
            opacity: snowflake.opacity,
          }}
          animate={{
            y: [0, viewportHeight + 100],
            x: [0, snowflake.drift],
            opacity: [
              snowflake.opacity * 0.5,
              snowflake.opacity,
              snowflake.opacity * 0.5,
            ],
          }}
          transition={{
            duration: snowflake.duration,
            delay: snowflake.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
