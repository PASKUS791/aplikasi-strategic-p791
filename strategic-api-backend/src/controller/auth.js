/*
 * Team DUKUN PASKUS 791 - Auth Controller
 */

const Joi = require("joi");
const StrategicUser = require("../model/strategicUser");
const { comparePassword } = require("../utils/password");
const {
  buildSecurityConfig,
  clearFailedLogins,
  getLockedLogin,
  hasSuspiciousLoginPayload,
  registerFailedLogin,
  sendSecurityBlock,
} = require("../utils/security");
const {
  getCookieOptions,
  getSessionCookieName,
  signSessionToken,
} = require("../utils/session");
const {
  normalizeStrategicUsername,
  serializeStrategicUser,
} = require("../utils/strategicUsers");
const { resolveAuthenticatedUser } = require("../middleware/authuser");

const loginSchema = Joi.object({
  scope: Joi.string().valid("strategic").required(),
  operatorId: Joi.string().trim().lowercase().min(3).max(60),
  securityKey: Joi.string().min(8).max(128),
  username: Joi.string().trim().lowercase().min(3).max(60),
  password: Joi.string().min(8).max(128),
})
  .or("operatorId", "username")
  .or("securityKey", "password");
const securityConfig = buildSecurityConfig();

exports.login = async (req, res) => {
  if (hasSuspiciousLoginPayload(req.body)) {
    return sendSecurityBlock(res, 403, "Payload login diblokir.", {
      type: "pentest-probe",
      title: "Probing Payload Diblokir",
      classification:
        "Input yang dikirim menyerupai payload probing atau pentest terhadap autentikasi.",
      detail:
        "Lapisan keamanan menahan pola karakter yang dianggap berbahaya sebelum request diproses lebih jauh.",
    });
  }

  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Payload login Strategic tidak valid.",
      errors: error.details.map((detail) => detail.message),
    });
  }

  const operatorId = normalizeStrategicUsername(value.operatorId || value.username);
  const securityKey = String(value.securityKey || value.password || "");
  const lockState = getLockedLogin(operatorId, req, securityConfig);

  if (lockState.locked) {
    return sendSecurityBlock(
      res,
      429,
      "Akses login ditahan sementara oleh sistem keamanan.",
      {
        type: "brute-force",
        title: "Brute Force Diblokir",
        classification:
          "Percobaan login berulang terdeteksi dan diklasifikasikan sebagai serangan akun.",
        detail:
          "Portal menahan akses sementara karena pola autentikasi menyerupai brute force.",
      },
      {
        retryAfterSeconds: lockState.retryAfterSeconds,
      },
    );
  }

  const user = await StrategicUser.findOne({
    scope: "strategic",
    username: operatorId,
    active: true,
  }).select("+password");

  if (!user) {
    const state = registerFailedLogin(operatorId, req, securityConfig);

    if (state.lockUntil && state.lockUntil > Date.now()) {
      return sendSecurityBlock(
        res,
        429,
        "Akses login ditahan sementara oleh sistem keamanan.",
        {
          type: "brute-force",
          title: "Brute Force Diblokir",
          classification:
            "Percobaan login berulang terdeteksi dan diklasifikasikan sebagai serangan akun.",
          detail:
            "Portal menahan akses sementara karena pola autentikasi menyerupai brute force.",
        },
        {
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((state.lockUntil - Date.now()) / 1000),
          ),
        },
      );
    }

    return res.status(400).json({ message: "Operator ID atau security key salah." });
  }

  const isValidPassword = await comparePassword(securityKey, user.password);

  if (!isValidPassword) {
    const state = registerFailedLogin(operatorId, req, securityConfig);

    if (state.lockUntil && state.lockUntil > Date.now()) {
      return sendSecurityBlock(
        res,
        429,
        "Akses login ditahan sementara oleh sistem keamanan.",
        {
          type: "brute-force",
          title: "Brute Force Diblokir",
          classification:
            "Percobaan login berulang terdeteksi dan diklasifikasikan sebagai serangan akun.",
          detail:
            "Portal menahan akses sementara karena pola autentikasi menyerupai brute force.",
        },
        {
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((state.lockUntil - Date.now()) / 1000),
          ),
        },
      );
    }

    return res.status(400).json({ message: "Operator ID atau security key salah." });
  }

  clearFailedLogins(operatorId, req);
  user.lastLoginAt = new Date();
  await user.save();

  const sessionToken = signSessionToken(user);
  res.cookie(getSessionCookieName(), sessionToken, getCookieOptions());

  return res.status(200).json({
    message: "Login Strategic berhasil.",
    user: serializeStrategicUser(user),
  });
};

exports.session = async (req, res) => {
  const user = await resolveAuthenticatedUser(req);

  if (!user) {
    return res.status(200).json({
      authenticated: false,
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: serializeStrategicUser(user),
  });
};

exports.me = exports.session;

exports.logout = async (_req, res) => {
  res.clearCookie(getSessionCookieName(), getCookieOptions());
  return res.status(200).json({
    ok: true,
    message: "Logout Strategic berhasil.",
  });
};
