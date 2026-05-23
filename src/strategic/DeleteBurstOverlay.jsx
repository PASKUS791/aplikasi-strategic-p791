/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Delete Burst Overlay
 * Purpose: Efek hapus dengan burst, partikel, dan visual caption.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import deleteBurstImage from "../assets/strategic/delete-burst.png";

const PARTICLES = [
  { x: -120, y: -90, size: 10, delay: 0 },
  { x: -42, y: -124, size: 8, delay: 0.03 },
  { x: 50, y: -116, size: 11, delay: 0.05 },
  { x: 116, y: -74, size: 8, delay: 0.08 },
  { x: 136, y: 2, size: 10, delay: 0.12 },
  { x: 92, y: 82, size: 8, delay: 0.15 },
  { x: 8, y: 124, size: 12, delay: 0.18 },
  { x: -78, y: 112, size: 9, delay: 0.21 },
  { x: -132, y: 28, size: 10, delay: 0.24 },
];

export default function DeleteBurstOverlay({
  visible,
  onComplete,
  caption = "Oke mas aku hapusin dulu",
}) {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onComplete?.();
    }, 1180);

    return () => window.clearTimeout(timeout);
  }, [onComplete, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/82 p-4 backdrop-blur-lg"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {PARTICLES.map((particle, index) => (
              <motion.span
                key={`${particle.x}-${particle.y}-${index}`}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.2, 1.4, 0.7],
                  x: particle.x,
                  y: particle.y,
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                  delay: particle.delay,
                }}
                className="absolute left-1/2 top-1/2 rounded-full bg-[linear-gradient(135deg,#fde68a,#f97316,#fb7185)] shadow-[0_0_34px_rgba(249,115,22,0.42)]"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.76, rotate: -5, y: 24 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-white/10 bg-[#121618]/90 shadow-[0_36px_120px_rgba(0,0,0,0.55)]"
          >
            <motion.div
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{ opacity: [0.25, 0.65, 0.18], scale: [0.8, 1.18, 1.28] }}
              transition={{ duration: 0.95, times: [0, 0.45, 1], ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,0,90,0.28),transparent_60%)]"
            />

            <div className="relative p-4">
              <img
                src={deleteBurstImage}
                alt="Delete burst"
                className="h-[360px] w-full rounded-[22px] object-cover"
              />
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.12 }}
                className="absolute inset-x-8 bottom-8 rounded-[18px] border border-white/10 bg-black/58 px-4 py-3 text-center shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                  Delete Sequence
                </p>
                <p className="mt-2 font-sans text-lg font-bold uppercase text-stone-100">
                  {caption}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
