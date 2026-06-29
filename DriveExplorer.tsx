import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SubtitleHeartsProps {
  activeText: string;
  activeEmotion: string;
}

interface HeartParticle {
  id: string;
  x: number; // horizontal starting percentage (30% to 70%)
  y: number; // vertical offset
  size: number; // size of heart
  duration: number; // animation duration
  drift: number; // horizontal sway distance
  scaleEnd: number; // final scale
}

const LOVE_REGEXP = /love|affection|darling|sweetheart|babe|dear|jaan|priyo|heart|valobasha|valobashi|bhalobasha|bhalobashi|bhalobasa|valobasa|bhalobashee|amar jihan|ভালোবাসা|ভালোবাসি|প্রিয়/i;

export const SubtitleHearts: React.FC<SubtitleHeartsProps> = ({ activeText, activeEmotion }) => {
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const lastTextRef = useRef<string>("");

  const spawnParticles = (count: number) => {
    const newParticles: HeartParticle[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `${timestamp}-${i}-${Math.random()}`,
        x: 30 + Math.random() * 40, // Centered span (30% to 70% of area)
        y: 80 + Math.random() * 20, // Start slightly below/bottom of subtitle
        size: 14 + Math.random() * 16, // Random sizes
        duration: 3 + Math.random() * 2.5, // Float up speed
        drift: -50 + Math.random() * 100, // Horizontal swing sway
        scaleEnd: 0.2 + Math.random() * 0.4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles].slice(-40)); // Cap particles array
  };

  // Trigger burst when a loving phrase first enters the subtitle area
  useEffect(() => {
    const trimmed = activeText.trim();
    if (!trimmed) return;

    if (LOVE_REGEXP.test(trimmed)) {
      if (lastTextRef.current !== trimmed) {
        lastTextRef.current = trimmed;
        // Spawn active burst of loving hearts!
        spawnParticles(12);
      }
    }
  }, [activeText]);

  // Periodic trickle of hearts while speaking or when emotion is matching and active
  useEffect(() => {
    const isLovingText = LOVE_REGEXP.test(activeText);
    
    if (isLovingText || activeEmotion === "happy") {
      const interval = setInterval(() => {
        spawnParticles(2);
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [activeText, activeEmotion]);

  // Self-cleaning cycle to keep the state clean from stale particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) => prev.filter((p) => {
        const idParts = p.id.split("-");
        const spawnedAt = parseInt(idParts[0], 10);
        return Date.now() - spawnedAt < (p.duration * 1000 + 100);
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [particles]);

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none z-10">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 0, 
              scale: 0.1, 
              x: `${p.x}%`, 
              y: `${p.y}%` 
            }}
            animate={{ 
              opacity: [0, 0.9, 0.7, 0],
              scale: [0.3, 1.1, 1.0, p.scaleEnd],
              x: [`${p.x}%`, `${p.x}%`, `calc(${p.x}% + ${p.drift}px)`],
              y: [`${p.y}%`, `${p.y - 45}%`, `${p.y - 120}%`]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: p.duration, 
              ease: "easeOut" 
            }}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-pink-500/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              style={{ width: "100%", height: "100%" }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
