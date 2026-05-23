/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");

const authRouter = require("./src/router/auth");
const resourceRouter = require("./src/router/resource");
const strategicRouter = require("./src/router/strategic");
const { registerEventClient, closeEventClient } = require("./src/utils/sse");
const { bootstrapStrategicData } = require("./src/utils/seed");
const {
  applyRequestRateLimit,
  buildSecurityConfig,
  ensureTrustedOrigin,
} = require("./src/utils/security");

const app = express();
const port = Number.parseInt(process.env.PORT || "4455", 10);
const bodyLimit = process.env.BODY_LIMIT || "50mb";
const securityConfig = buildSecurityConfig();

function normalizeOrigin(value) {
  try {
    return new URL(String(value || "")).origin;
  } catch {
    return "";
  }
}

app.set("trust proxy", true);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(express.json({ limit: bodyLimit }));

function applyCorsHeaders(req, res) {
  const normalizedOrigin = normalizeOrigin(req.headers.origin);

  if (!normalizedOrigin || !securityConfig.allowedOrigins.includes(normalizedOrigin)) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", normalizedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");

  return true;
}

app.use((req, res, next) => {
  const hasCorsAccess = applyCorsHeaders(req, res);

  if (req.method !== "OPTIONS") {
    return next();
  }

  if (req.headers.origin && !hasCorsAccess) {
    return res.status(403).json({
      message: "Origin tidak diizinkan oleh konfigurasi CORS.",
    });
  }

  return res.sendStatus(204);
});

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.path.startsWith("/api/") && applyRequestRateLimit(req, res, securityConfig)) {
    return;
  }

  const requiresTrustedOrigin =
    req.method !== "GET" ||
    req.path === "/api/auth/login" ||
    req.path === "/api/auth/logout";

  if (requiresTrustedOrigin && !ensureTrustedOrigin(req, res, securityConfig)) {
    return;
  }

  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "strategic-api",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/events", (req, res) => {
  registerEventClient(res);
  req.on("close", () => {
    closeEventClient(res);
  });
});

app.use("/api/auth", authRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/strategic", strategicRouter);

app.use((req, res) => {
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

app.use((error, _req, res, _next) => {
  void _next;
  const status = error.errorStatus || error.status || 500;
  res.status(status).json({
    message: error.message || "Terjadi kesalahan pada server.",
    data: error.data || null,
  });
});

mongoose
  .connect(process.env.DB)
  .then(async () => {
    await bootstrapStrategicData();

    app.listen(port, () => {
      console.log(`strategic-api backend aktif di port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Gagal konek ke MongoDB:", error);
    process.exitCode = 1;
  });
