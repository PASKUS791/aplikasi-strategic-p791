/*
 * Team DUKUN PASKUS 791 - Resource Controller
 */

const StrategicUser = require("../model/strategicUser");
const StrategicResource = require("../model/resource");
const { broadcastResourceEvent } = require("../utils/sse");
const {
  ALLOWED_RESOURCE_KEYS,
  cloneValue,
  getDefaultResourceValue,
  getResourcePermission,
} = require("../utils/resources");
const {
  buildMapPlannerUsersSnapshot,
  normalizeStrategicAccess,
  normalizeStrategicUsername,
} = require("../utils/strategicUsers");
const { syncMapPlannerUsersResource } = require("../utils/seed");

async function ensureResourceDocument(resourceKey) {
  let document = await StrategicResource.findOne({ name: resourceKey });

  if (!document) {
    document = await StrategicResource.create({
      name: resourceKey,
      scope: "strategic",
      value: getDefaultResourceValue(resourceKey),
      updatedBy: {
        username: "system",
        label: "Bootstrap",
      },
    });
  }

  return document;
}

function isAllowedResourceKey(resourceKey) {
  return ALLOWED_RESOURCE_KEYS.has(resourceKey);
}

exports.getResource = async (req, res) => {
  const resourceKey = String(req.params.resourceKey || "").trim();

  if (!isAllowedResourceKey(resourceKey)) {
    return res.status(404).json({ message: "Resource Strategic tidak ditemukan." });
  }

  if (resourceKey === "strategic.mapPlannerUsers") {
    if (!req.user?.isPrimaryAdmin) {
      return res.status(403).json({ message: "Resource ini hanya untuk admin Strategic." });
    }

    const users = await StrategicUser.find({ scope: "strategic", active: true }).sort({
      isPrimaryAdmin: -1,
      createdAt: 1,
    });

    return res.status(200).json({
      resource: resourceKey,
      value: buildMapPlannerUsersSnapshot(users),
    });
  }

  const permissionKey = getResourcePermission(resourceKey);
  if (permissionKey && permissionKey !== "admin" && !req.user?.isPrimaryAdmin) {
    if (!req.user?.access?.[permissionKey]) {
      return res.status(403).json({ message: "Akses ke resource ini ditolak." });
    }
  }

  const document = await ensureResourceDocument(resourceKey);
  return res.status(200).json({
    resource: resourceKey,
    value: cloneValue(document.value),
  });
};

exports.saveResource = async (req, res) => {
  const resourceKey = String(req.params.resourceKey || "").trim();

  if (!isAllowedResourceKey(resourceKey)) {
    return res.status(404).json({ message: "Resource Strategic tidak ditemukan." });
  }

  if (typeof req.body?.value === "undefined") {
    return res.status(400).json({ message: "Body value wajib diisi." });
  }

  if (resourceKey === "strategic.mapPlannerUsers") {
    if (!req.user?.isPrimaryAdmin) {
      return res.status(403).json({ message: "Resource ini hanya untuk admin Strategic." });
    }

    const nextEntries = Array.isArray(req.body.value) ? req.body.value : [];
    const users = await StrategicUser.find({ scope: "strategic", active: true });
    const usersByUsername = new Map(
      users.map((entry) => [normalizeStrategicUsername(entry.username), entry]),
    );

    for (const entry of nextEntries) {
      const normalizedUsername = normalizeStrategicUsername(entry.username);
      const user = usersByUsername.get(normalizedUsername);

      if (!user || user.isPrimaryAdmin) {
        continue;
      }

      user.access = normalizeStrategicAccess(entry.access);
      await user.save();
    }

    const syncedValue = await syncMapPlannerUsersResource();
    broadcastResourceEvent(resourceKey);

    return res.status(200).json({
      resource: resourceKey,
      value: syncedValue,
    });
  }

  const permissionKey = getResourcePermission(resourceKey);
  if (permissionKey && permissionKey !== "admin" && !req.user?.isPrimaryAdmin) {
    if (!req.user?.access?.[permissionKey]) {
      return res.status(403).json({ message: "Akses ke resource ini ditolak." });
    }
  }

  const document = await ensureResourceDocument(resourceKey);
  document.value = req.body.value;
  document.updatedBy = {
    id: req.user.id,
    username: req.user.username,
    label: req.user.label,
  };
  await document.save();
  broadcastResourceEvent(resourceKey);

  return res.status(200).json({
    resource: resourceKey,
    value: cloneValue(document.value),
  });
};
