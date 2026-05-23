/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { motion } from "framer-motion";
import paskusAnimatedLogo from "../assets/paskus-light.gif";

export default function RotatingPaskusLogo({
  sizeClassName = "h-28 w-28",
  glowClassName = "bg-emerald-400/18",
  className = "",
  imageClassName = "",
  visualOffsetClassName = "",
}) {
  return (
    <div
      className={[
        "relative flex items-center justify-center",
        visualOffsetClassName,
        className,
      ].join(" ")}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className={`absolute rounded-full blur-[72px] ${glowClassName} h-28 w-28`}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        className="absolute h-[120%] w-[120%] rounded-full border border-emerald-300/18 border-t-emerald-300/85 border-r-transparent border-b-emerald-300/20 border-l-transparent"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute h-[138%] w-[138%] rounded-full border border-white/6 border-t-white/40 border-r-transparent border-b-transparent border-l-white/10"
      />
      <motion.img
        src={paskusAnimatedLogo}
        alt="Paskus insignia"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className={`relative z-10 rounded-full object-contain ${sizeClassName} ${imageClassName}`}
      />
    </div>
  );
}
