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
const { serializeStrategicUser } = require("../utils/strategicUsers");
const { resolveAuthenticatedUser } = require("../middleware/authuser");

const loginSchema = Joi.object({
  scope: Joi.string().valid("strategic").required(),
  username: Joi.string().trim().lowercase().min(3).max(60).required(),
  password: Joi.string().min(8).max(128).required(),
});
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

  const lockState = getLockedLogin(value.username, req, securityConfig);

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
    username: value.username,
    active: true,
  }).select("+password");

  if (!user) {
    const state = registerFailedLogin(value.username, req, securityConfig);

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

    return res.status(400).json({ message: "Username atau password salah." });
  }

  const isValidPassword = await comparePassword(value.password, user.password);

  if (!isValidPassword) {
    const state = registerFailedLogin(value.username, req, securityConfig);

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

    return res.status(400).json({ message: "Username atau password salah." });
  }

  clearFailedLogins(value.username, req);
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
