"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (!target) return;
      
      // Get the element (might be a text node, so traverse up)
      let element: HTMLElement | null = null;
      if (target instanceof HTMLElement) {
        element = target;
      } else if (target instanceof Node && target.parentElement) {
        element = target.parentElement;
      }
      
      if (!element) return;
      
      // Check if hovering over interactive element
      if (
        element.tagName === "BUTTON" ||
        element.tagName === "A" ||
        (element.closest && (
          element.closest("button") ||
          element.closest("a") ||
          element.closest("[data-cursor-hover]")
        ))
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          className={`rounded-full bg-white transition-all duration-300 ${
            isHovering ? "w-8 h-8" : "w-2 h-2"
          }`}
          animate={{
            scale: isHovering ? 1.5 : 1,
          }}
        />
      </motion.div>

      {/* Trailing blur */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          className={`rounded-full bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] transition-all duration-500 ${
            isHovering ? "w-32 h-32 opacity-30" : "w-16 h-16 opacity-10"
          }`}
          animate={{
            scale: isHovering ? 1.2 : 1,
          }}
          style={{
            filter: "blur(20px)",
          }}
        />
      </motion.div>
    </>
  );
}
