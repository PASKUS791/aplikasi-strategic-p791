/*
 * Team DUKUN PASKUS 791 - Session Helpers
 */

const jwt = require("jsonwebtoken");

function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || "strategic_api_session";
}

function getSessionDays() {
  const parsed = Number.parseInt(process.env.SESSION_EXPIRES_DAYS || "7", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
}

function getSessionMaxAgeMs() {
  return getSessionDays() * 24 * 60 * 60 * 1000;
}

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = String(process.env.COOKIE_DOMAIN || "").trim();

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: getSessionMaxAgeMs(),
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}

function signSessionToken(user) {
  const payload = {
    id: String(user._id),
    username: user.username,
    label: user.label,
    unit: user.unit,
    scope: "strategic",
    isPrimaryAdmin: user.isPrimaryAdmin === true,
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: `${getSessionDays()}d`,
  });
}

function verifySessionToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

function readTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (bearerToken) {
    return bearerToken;
  }

  return req.cookies?.[getSessionCookieName()] || "";
}

module.exports = {
  getCookieOptions,
  getSessionCookieName,
  readTokenFromRequest,
  signSessionToken,
  verifySessionToken,
};
