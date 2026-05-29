/*
 * Team DUKUN PASKUS 791 - Strategic User Helpers
 */

function normalizeStrategicUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStrategicAccess(access = {}) {
  return {
    mainPlanner: access?.mainPlanner !== false,
    customMaps: access?.customMaps !== false,
    saves: access?.saves !== false,
  };
}

function serializeStrategicUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  const subscriptionStatus = userDoc.isPrimaryAdmin
    ? "active"
    : userDoc.subscriptionExpiresAt
    ? new Date(userDoc.subscriptionExpiresAt) > new Date()
      ? "active"
      : "expired"
    : "none";

  return {
    id: String(userDoc._id),
    username: normalizeStrategicUsername(userDoc.username),
    operatorId: normalizeStrategicUsername(userDoc.username),
    label: String(userDoc.label || userDoc.nama || userDoc.username || "Strategic User"),
    nama: String(userDoc.nama || userDoc.label || userDoc.username || "Strategic User"),
    unit: String(userDoc.unit || "Strategic Command"),
    scope: "strategic",
    access: normalizeStrategicAccess(userDoc.access),
    subscriptionExpiresAt: userDoc.subscriptionExpiresAt
      ? new Date(userDoc.subscriptionExpiresAt).toISOString()
      : null,
    subscriptionStatus,
    isPrimaryAdmin: userDoc.isPrimaryAdmin === true,
    active: userDoc.active !== false,
  };
}

function buildMapPlannerUsersSnapshot(userDocs) {
  return Array.isArray(userDocs)
    ? userDocs.map((entry) => ({
        username: normalizeStrategicUsername(entry.username),
        access: normalizeStrategicAccess(entry.access),
        subscriptionExpiresAt: entry.subscriptionExpiresAt
          ? new Date(entry.subscriptionExpiresAt).toISOString()
          : null,
        subscriptionStatus: entry.isPrimaryAdmin
          ? "active"
          : entry.subscriptionExpiresAt
          ? new Date(entry.subscriptionExpiresAt) > new Date()
            ? "active"
            : "expired"
          : "none",
        updatedAt: new Date(entry.updatedAt || entry.createdAt || Date.now()).toISOString(),
      }))
    : [];
}

module.exports = {
  buildMapPlannerUsersSnapshot,
  normalizeStrategicAccess,
  normalizeStrategicUsername,
  serializeStrategicUser,
};
