/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { AnimatePresence, motion } from "framer-motion";
import securityImage from "../assets/security-block.jpeg";

const DEFAULT_ALERT = {
  title: "Ancaman Diblokir",
  classification: "Aktivitas ini diklasifikasikan sebagai penyerangan website.",
  detail:
    "Lapisan keamanan menahan request yang menyerupai flood, brute force, atau probing pentest.",
};

export default function SecurityAttackOverlay({ alert, onDismiss }) {
  const payload = alert || DEFAULT_ALERT;

  return (
    <AnimatePresence>
      {alert ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, y: -10, filter: "blur(16px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-rose-400/26 bg-[#0c0f11]/90 shadow-[0_30px_120px_rgba(0,0,0,0.52)]"
          >
            <motion.div
              animate={{ opacity: [0.16, 0.34, 0.18], x: [0, 3, -3, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.2 }}
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,63,94,0.18),transparent_34%,rgba(255,255,255,0.03)_34%,transparent_68%)] mix-blend-screen"
            />

            <div className="border-b border-white/8 p-4">
              <p className="font-public text-[10px] uppercase tracking-[0.34em] text-rose-300">
                Security Countermeasure
              </p>
            </div>

            <div className="grid gap-5 p-5">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/28">
                <img
                  src={securityImage}
                  alt="Blocked attacker notice"
                  className="h-56 w-full object-cover"
                  draggable="false"
                />
              </div>

              <div>
                <h2 className="font-sans text-2xl font-bold uppercase text-stone-100">
                  {payload.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-stone-300">
                  {payload.classification}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  {payload.detail}
                </p>
                {payload.retryAfterSeconds ? (
                  <p className="mt-3 font-public text-[10px] uppercase tracking-[0.22em] text-amber-300">
                    Coba lagi dalam {payload.retryAfterSeconds} detik
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 font-public text-[11px] font-bold uppercase tracking-[0.2em] text-stone-100 transition hover:border-rose-300/30 hover:bg-rose-500/10"
              >
                Tutup Notifikasi
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
