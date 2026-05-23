/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import paskusLightGif from "../assets/paskus-light.gif";
import SecurityAttackOverlay from "../components/SecurityAttackOverlay";
import { useAuth } from "../lib/strategicAuth";
import { useAnimatedFavicon } from "../lib/useAnimatedFavicon";

function RotatingLogo({ size = "h-28 w-28", glow = "bg-lime-300/18" }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className={`absolute rounded-full blur-[72px] ${glow} h-28 w-28`}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        className="absolute h-[120%] w-[120%] rounded-full border border-lime-300/18 border-t-lime-300/80 border-r-transparent border-b-lime-300/22 border-l-transparent"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute h-[138%] w-[138%] rounded-full border border-white/6 border-t-white/40 border-r-transparent border-b-transparent border-l-white/10"
      />
      <motion.img
        src={paskusLightGif}
        alt="Strategic center logo"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className={`relative z-10 rounded-full object-contain ${size}`}
      />
    </div>
  );
}

function IntroScreen() {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: "blur(22px)" }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050809]"
    >
      <div className="flex flex-col items-center">
        <RotatingLogo size="h-36 w-36" glow="bg-lime-300/22" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 220 }}
          transition={{ duration: 2.8, ease: "linear" }}
          className="mt-10 h-[2px] rounded-full bg-lime-300 shadow-[0_0_20px_rgba(190,242,100,0.45)]"
        />
        <p className="mt-5 font-public text-[10px] uppercase tracking-[0.52em] text-lime-300/72">
          Strategic Tactical Uplink
        </p>
      </div>
    </motion.div>
  );
}

function LoadingScreen({ progress, visibleLogs }) {
  return (
    <motion.div
      key="loader"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.12, filter: "blur(34px)" }}
      className="fixed inset-0 z-[180] flex items-center justify-center px-4"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-full max-w-2xl rounded-[34px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_28px_120px_rgba(0,0,0,0.42)] backdrop-blur-3xl"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <RotatingLogo size="h-24 w-24" glow="bg-lime-300/18" />
          </motion.div>

          <p className="font-public text-[10px] uppercase tracking-[0.42em] text-lime-300/78">
            Loading Strategic Center
          </p>
          <h1 className="mt-4 font-sans text-4xl font-bold uppercase text-stone-100">
            Tactical Map Authorization
          </h1>
        </div>

        <div className="mt-10 space-y-3 rounded-[24px] border border-white/8 bg-black/18 p-5">
          {visibleLogs.map((log) => (
            <motion.div
              key={log}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between border-b border-white/6 pb-2 text-sm last:border-b-0 last:pb-0"
            >
              <span className="text-stone-400">{log}</span>
              <span className="font-public text-[10px] uppercase tracking-[0.22em] text-lime-300">
                Sync
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between font-public text-[10px] uppercase tracking-[0.24em] text-stone-500">
            <span>Security Link</span>
            <span className="text-lime-300">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/8 bg-black/26 p-[3px]">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-lime-300 via-lime-200 to-amber-300 shadow-[0_0_18px_rgba(190,242,100,0.38)]"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StrategicLoginPortal() {
  const navigate = useNavigate();
  const { loading, login, user } = useAuth();
  useAnimatedFavicon();
  const [phase, setPhase] = useState("intro");
  const [progress, setProgress] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [securityAlert, setSecurityAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logMessages = useMemo(
    () => [
      "Locking Strategic tactical uplink...",
      "Validating Ronograd command profile...",
      "Stitching strategic map layers...",
      "Decrypting operation save matrix...",
      "Routing planning board authority...",
      "Preparing command access panel...",
    ],
    [],
  );

  const visibleLogs = useMemo(() => {
    const completed = Math.min(
      logMessages.length,
      Math.max(1, Math.ceil((progress / 100) * logMessages.length)),
    );

    return logMessages.slice(Math.max(0, completed - 3), completed);
  }, [logMessages, progress]);

  useEffect(() => {
    if (phase !== "intro") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setProgress(0);
      setPhase("loading");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProgress((previousProgress) => {
        if (previousProgress >= 100) {
          window.clearInterval(timer);
          return 100;
        }

        return Math.min(100, previousProgress + 2);
      });
    }, 45);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading" || progress !== 100) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setPhase("content"), 600);
    return () => window.clearTimeout(timeout);
  }, [phase, progress]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setError(""), 1600);
    return () => window.clearTimeout(timeout);
  }, [error]);

  if (loading) {
    return null;
  }

  if (user?.scope === "strategic") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAuthenticate = () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    window.setTimeout(async () => {
      try {
        await login("strategic", username, password);
        navigate("/dashboard", { replace: true });
      } catch (authError) {
        const attackPayload = authError?.payload?.securityEvent;

        if (attackPayload) {
          setSecurityAlert({
            ...attackPayload,
            retryAfterSeconds: authError?.payload?.retryAfterSeconds,
          });
        }

        setError(
          attackPayload?.classification ||
            authError.message ||
            "ACCESS DENIED - INVALID Strategic CREDENTIAL",
        );
        setIsSubmitting(false);
      }
    }, 850);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090b] font-sans text-stone-100">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_34%),linear-gradient(180deg,rgba(7,10,12,0.94),rgba(4,6,8,0.98))]" />
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(190,242,100,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(190,242,100,0.22) 1px, transparent 1px)",
            backgroundSize: "124px 124px",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.28)_50%)] bg-[length:100%_4px] opacity-[0.14]" />
      </div>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.26, 0.12, 0.22, 0] }}
            transition={{ duration: 0.62 }}
            className="pointer-events-none absolute inset-0 z-[70] bg-rose-500/10 mix-blend-screen"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "intro" ? <IntroScreen /> : null}
        {phase === "loading" ? (
          <LoadingScreen progress={progress} visibleLogs={visibleLogs} />
        ) : null}
      </AnimatePresence>

      <SecurityAttackOverlay
        alert={securityAlert}
        onDismiss={() => setSecurityAlert(null)}
      />

      <AnimatePresence>
        {phase === "content" ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 1.04, filter: "blur(30px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10"
          >
            <div className="flex w-full justify-center">
              <motion.section
                initial={{ opacity: 0, y: 26, filter: "blur(20px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.16, duration: 0.82 }}
                className="w-full max-w-3xl rounded-[38px] border border-white/8 bg-[#111416]/84 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-8 xl:p-10"
              >
                <div className="rounded-[30px] border border-lime-300/12 bg-black/20 p-6 md:p-8">
                  <div className="flex flex-col items-center border-b border-white/6 pb-8 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ delay: 0.22, duration: 0.72 }}
                      className="mb-6"
                    >
                      <RotatingLogo size="h-24 w-24" glow="bg-lime-300/20" />
                    </motion.div>
                    <p className="font-public text-[10px] uppercase tracking-[0.3em] text-lime-300">
                      Planning Authorization
                    </p>
                    <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-none text-stone-100 md:text-5xl">
                      Strategic MAP PLANNER
                    </h2>
                  </div>

                  <div className="mt-8 grid gap-5">
                    <label className="grid gap-2">
                      <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                        Operator ID
                      </span>
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleAuthenticate();
                          }
                        }}
                        autoComplete="username"
                        placeholder="ENTER Strategic USERNAME"
                        className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-lime-300"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                        Security Key
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleAuthenticate();
                          }
                        }}
                        autoComplete="current-password"
                        placeholder="••••••••••"
                        className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-lime-300"
                      />
                    </label>
                  </div>

                  <div className="mt-8 flex flex-col gap-4 border-t border-white/6 pt-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-public text-[10px] uppercase tracking-[0.16em] text-stone-500">
                        Unauthorized Strategic access will be logged and monitored.
                      </p>
                      {error ? (
                        <p className="mt-2 font-public text-[10px] uppercase tracking-[0.18em] text-rose-300">
                          {error}
                        </p>
                      ) : null}
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleAuthenticate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-full bg-lime-300 px-6 py-4 font-public text-[11px] font-bold uppercase tracking-[0.24em] text-[#0b100e] shadow-[0_0_40px_rgba(190,242,100,0.18)] transition hover:brightness-105"
                    >
                      {isSubmitting ? "Authorizing..." : "Access Map Planner"}
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
