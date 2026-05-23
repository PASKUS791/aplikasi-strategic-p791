/*
 * Team DUKUN PASKUS 791 - Auth Middleware
 */

const StrategicUser = require("../model/strategicUser");
const { readTokenFromRequest, verifySessionToken } = require("../utils/session");
const { serializeStrategicUser } = require("../utils/strategicUsers");

async function resolveAuthenticatedUser(req) {
  const token = readTokenFromRequest(req);

  if (!token) {
    return null;
  }

  try {
    const payload = verifySessionToken(token);
    const user = await StrategicUser.findOne({
      _id: payload.id,
      scope: "strategic",
      active: true,
    });

    return user || null;
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const user = await resolveAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({ message: "Mohon login ke akun Strategic Anda." });
  }

  req.user = serializeStrategicUser(user);
  req.userDocument = user;
  return next();
}

function requirePrimaryAdmin(req, res, next) {
  if (!req.user?.isPrimaryAdmin) {
    return res.status(403).json({
      message: "Menu ini hanya bisa dipakai oleh akun Strategic utama.",
    });
  }

  return next();
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (req.user?.isPrimaryAdmin) {
      return next();
    }

    if (!req.user?.access?.[permissionKey]) {
      return res.status(403).json({
        message: "Akses kamu belum diaktifkan untuk menu ini.",
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requirePermission,
  requirePrimaryAdmin,
  resolveAuthenticatedUser,
};
