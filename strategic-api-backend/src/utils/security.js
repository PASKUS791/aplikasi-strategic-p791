/*
 * Team DUKUN PASKUS 791 - Security Helpers
 */

const requestRateBuckets = new Map();
const loginAttemptBuckets = new Map();

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeOrigin(value) {
  try {
    return new URL(String(value || "")).origin;
  } catch {
    return "";
  }
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function buildSecurityConfig() {
  return {
    allowedOrigins: String(
      process.env.Strategic_ALLOWED_ORIGINS ||
        "http://localhost:5173,https://strategic.so791.com",
    )
      .split(",")
      .map((entry) => normalizeOrigin(entry.trim()))
      .filter(Boolean),
    loginWindowMs: parsePositiveInt(process.env.Strategic_LOGIN_WINDOW_MINUTES, 15) * 60 * 1000,
    loginMaxAttempts: parsePositiveInt(process.env.Strategic_LOGIN_MAX_ATTEMPTS, 5),
    lockoutMs: parsePositiveInt(process.env.Strategic_LOGIN_LOCK_MINUTES, 15) * 60 * 1000,
    loginRateLimitPerWindow: parsePositiveInt(process.env.Strategic_LOGIN_RATE_LIMIT, 20),
    apiRateLimitPerMinute: parsePositiveInt(process.env.Strategic_API_RATE_LIMIT, 120),
  };
}

function getClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)[0];

  return (
    forwardedFor ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function pruneRequestBucket(entries, windowMs) {
  const threshold = Date.now() - windowMs;
  return entries.filter((entry) => entry > threshold);
}

function createSecurityEvent(overrides = {}) {
  return {
    action: "blocked",
    imageKey: "security-block",
    title: "Percobaan Serangan Terdeteksi",
    classification: "Aktivitas ini diklasifikasikan sebagai penyerangan website.",
    detail:
      "Permintaan diblokir oleh lapisan keamanan karena menyerupai flood, brute force, atau probing pentest.",
    ...overrides,
  };
}

function sendSecurityBlock(res, statusCode, message, securityEvent = {}, extra = {}) {
  return res.status(statusCode).json({
    ok: false,
    message,
    securityEvent: createSecurityEvent(securityEvent),
    ...extra,
  });
}

function ensureTrustedOrigin(req, res, config) {
  const origin = normalizeOrigin(req.headers.origin);

  if (origin) {
    if (!config.allowedOrigins.includes(origin)) {
      sendSecurityBlock(res, 403, "Origin request tidak diizinkan.", {
        type: "cross-origin-probe",
        title: "Cross-Origin Probe Diblokir",
        classification:
          "Permintaan lintas-origin yang menyerupai probing atau pentest diblokir.",
        detail:
          "Origin request tidak masuk daftar tepercaya, sehingga akses dihentikan sebelum menyentuh data aplikasi.",
      });
      return false;
    }

    return true;
  }

  const referer = String(req.headers.referer || "");

  if (referer) {
    const refererOrigin = normalizeOrigin(referer);

    if (!refererOrigin || !config.allowedOrigins.includes(refererOrigin)) {
      sendSecurityBlock(res, 403, "Referer request tidak diizinkan.", {
        type: "cross-origin-probe",
        title: "Referer Probe Diblokir",
        classification:
          "Referer request yang tidak tepercaya terdeteksi sebagai probing akses.",
        detail:
          "Sistem menolak request tulis yang datang dari referer yang tidak sesuai daftar origin resmi.",
      });
      return false;
    }
  }

  return true;
}

function applyRequestRateLimit(req, res, config) {
  const path = req.originalUrl || req.url || "";
  const rule =
    path.startsWith("/api/auth/login")
      ? {
          scope: "login",
          limit: config.loginRateLimitPerWindow,
          windowMs: config.loginWindowMs,
        }
      : path.startsWith("/api/")
        ? {
            scope: "api",
            limit: config.apiRateLimitPerMinute,
            windowMs: 60 * 1000,
          }
        : null;

  if (!rule) {
    return false;
  }

  const bucketKey = `${rule.scope}:${getClientIp(req)}`;
  const currentEntries = pruneRequestBucket(
    requestRateBuckets.get(bucketKey) || [],
    rule.windowMs,
  );

  currentEntries.push(Date.now());
  requestRateBuckets.set(bucketKey, currentEntries);

  if (currentEntries.length <= rule.limit) {
    return false;
  }

  sendSecurityBlock(
    res,
    429,
    "Traffic diblokir karena melebihi ambang keamanan.",
    rule.scope === "login"
      ? {
          type: "brute-force",
          title: "Brute Force Diblokir",
          classification:
            "Lonjakan percobaan login terdeteksi dan digolongkan sebagai serangan akun.",
          detail:
            "Portal menahan akses sementara karena pola request menyerupai brute force terhadap autentikasi.",
        }
      : {
          type: "request-flood",
          title: "Flood Request Diblokir",
          classification:
            "Lonjakan request digolongkan sebagai percobaan flood atau DDoS ringan.",
          detail:
            "Sistem rate limit aktif untuk menahan lalu lintas yang melampaui batas aman aplikasi.",
        },
    {
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
    },
  );
  return true;
}

function getLoginAttemptState(username, req, config) {
  const bucketKey = `${getClientIp(req)}:${normalizeUsername(username)}`;
  const currentState = loginAttemptBuckets.get(bucketKey);

  if (!currentState) {
    return { bucketKey, count: 0, lockUntil: 0 };
  }

  if (currentState.lockUntil && currentState.lockUntil > Date.now()) {
    return { bucketKey, ...currentState };
  }

  if (currentState.lastAttemptAt < Date.now() - config.loginWindowMs) {
    loginAttemptBuckets.delete(bucketKey);
    return { bucketKey, count: 0, lockUntil: 0 };
  }

  return { bucketKey, ...currentState };
}

function registerFailedLogin(username, req, config) {
  const { bucketKey, count } = getLoginAttemptState(username, req, config);
  const nextCount = count + 1;
  const nextState = {
    count: nextCount,
    lastAttemptAt: Date.now(),
    lockUntil: nextCount >= config.loginMaxAttempts ? Date.now() + config.lockoutMs : 0,
  };

  loginAttemptBuckets.set(bucketKey, nextState);
  return nextState;
}

function clearFailedLogins(username, req) {
  const bucketKey = `${getClientIp(req)}:${normalizeUsername(username)}`;
  loginAttemptBuckets.delete(bucketKey);
}

function getLockedLogin(username, req, config) {
  const state = getLoginAttemptState(username, req, config);

  if (state.lockUntil && state.lockUntil > Date.now()) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((state.lockUntil - Date.now()) / 1000),
      ),
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
  };
}

function hasSuspiciousLoginPayload(body) {
  const joined = [
    String(body?.operatorId || ""),
    String(body?.securityKey || ""),
    String(body?.username || ""),
    String(body?.password || ""),
    String(body?.scope || ""),
  ]
    .join(" ")
    .toLowerCase();

  return [
    "--",
    ";",
    "/*",
    "*/",
    " union ",
    " select ",
    " or 1=1",
    " drop table ",
    "<script",
    "javascript:",
    "../",
    "..\\",
  ].some((pattern) => joined.includes(pattern));
}

module.exports = {
  applyRequestRateLimit,
  buildSecurityConfig,
  clearFailedLogins,
  ensureTrustedOrigin,
  getLockedLogin,
  hasSuspiciousLoginPayload,
  registerFailedLogin,
  sendSecurityBlock,
};
