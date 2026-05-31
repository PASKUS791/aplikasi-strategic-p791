/*
 * Team DUKUN PASKUS 791 - Strategic User Controller
 */

const Joi = require("joi");
const StrategicUser = require("../model/strategicUser");
const StrategicResource = require("../model/resource");
const { hashPassword } = require("../utils/password");
const { broadcastResourceEvent } = require("../utils/sse");
const {
  normalizeStrategicAccess,
  normalizeStrategicUsername,
  serializeStrategicUser,
} = require("../utils/strategicUsers");
const { syncMapPlannerUsersResource } = require("../utils/seed");

const createUserSchema = Joi.object({
  operatorId: Joi.string().trim().lowercase().min(3).max(60),
  username: Joi.string().trim().lowercase().min(3).max(60),
  label: Joi.string().trim().min(2).max(100).required(),
  unit: Joi.string().trim().min(2).max(120).required(),
  role: Joi.string().valid("admin", "scout", "user").default("user"),
  securityKey: Joi.string().min(8).max(128),
  password: Joi.string().min(8).max(128),
  access: Joi.object({
    mainPlanner: Joi.boolean(),
    customMaps: Joi.boolean(),
    saves: Joi.boolean(),
  }).optional(),
  subscriptionExpiresAt: Joi.string().isoDate().allow(null).optional(),
})
  .or("operatorId", "username")
  .or("securityKey", "password");

async function removeOwnedCustomMaps(userDocument) {
  const customMapResource = await StrategicResource.findOne({ name: "strategic.customMaps" });

  if (!customMapResource || !Array.isArray(customMapResource.value)) {
    return false;
  }

  const ownerId = String(userDocument._id);
  const ownerUsername = normalizeStrategicUsername(userDocument.username);
  const nextValue = customMapResource.value.filter((entry) => {
    const createdByUsername = normalizeStrategicUsername(entry?.createdBy?.username);
    const createdById = String(entry?.createdBy?.id || "");
    return createdByUsername !== ownerUsername && createdById !== ownerId;
  });

  if (nextValue.length === customMapResource.value.length) {
    return false;
  }

  customMapResource.value = nextValue;
  await customMapResource.save();
  return true;
}

async function removeOwnedStrategicSaves(userDocument) {
  const saveResource = await StrategicResource.findOne({ name: "strategic.strategicSaves" });

  if (!saveResource || !Array.isArray(saveResource.value)) {
    return false;
  }

  const ownerId = String(userDocument._id);
  const ownerUsername = normalizeStrategicUsername(userDocument.username);
  const nextValue = saveResource.value.filter((entry) => {
    const entryOwnerId = String(entry?.ownerId || "");
    const entryOwnerUsername = normalizeStrategicUsername(entry?.ownerUsername);
    return entryOwnerId !== ownerId && entryOwnerUsername !== ownerUsername;
  });

  if (nextValue.length === saveResource.value.length) {
    return false;
  }

  saveResource.value = nextValue;
  await saveResource.save();
  return true;
}

exports.listUsers = async (_req, res) => {
  const users = await StrategicUser.find({ scope: "strategic", active: true }).sort({
    isPrimaryAdmin: -1,
    createdAt: 1,
  });

  return res.status(200).json({
    users: users.map((entry) => serializeStrategicUser(entry)),
  });
};

exports.createUser = async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Payload user Strategic tidak valid.",
      errors: error.details.map((detail) => detail.message),
    });
  }

  const username = normalizeStrategicUsername(value.operatorId || value.username);
  const securityKey = String(value.securityKey || value.password || "");
  const existing = await StrategicUser.findOne({ scope: "strategic", username }).select("_id");

  if (existing) {
    return res.status(409).json({ message: "Operator ID Strategic sudah dipakai." });
  }

  const user = await StrategicUser.create({
    username,
    label: value.label,
    nama: value.label,
    unit: value.unit,
    scope: "strategic",
    role: value.role || "user",
    password: await hashPassword(securityKey),
    access: normalizeStrategicAccess(value.access),
    subscriptionExpiresAt: value.subscriptionExpiresAt || null,
    active: true,
    isPrimaryAdmin: false,
  });

  await syncMapPlannerUsersResource();
  broadcastResourceEvent("strategic.mapPlannerUsers");

  return res.status(201).json({
    message: "User map planner berhasil ditambahkan.",
    user: serializeStrategicUser(user),
  });
};

exports.deleteUser = async (req, res) => {
  const username = normalizeStrategicUsername(req.params.operatorId || req.params.username);
  const user = await StrategicUser.findOne({ scope: "strategic", username });

  if (!user) {
    return res.status(404).json({ message: "User Strategic tidak ditemukan." });
  }

  if (user.isPrimaryAdmin) {
    return res.status(403).json({
      message: "Akun Strategic utama tidak boleh dihapus.",
    });
  }

  await Promise.all([
    removeOwnedCustomMaps(user),
    removeOwnedStrategicSaves(user),
  ]).then(([customMapsChanged, savesChanged]) => {
    if (customMapsChanged) {
      broadcastResourceEvent("strategic.customMaps");
    }
    if (savesChanged) {
      broadcastResourceEvent("strategic.strategicSaves");
    }
  });

  await StrategicUser.deleteOne({ _id: user._id });
  await syncMapPlannerUsersResource();
  broadcastResourceEvent("strategic.mapPlannerUsers");

  return res.status(200).json({
    message: "Anggota Strategic berhasil dihapus.",
  });
};
