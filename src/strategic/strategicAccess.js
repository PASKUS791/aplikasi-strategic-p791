/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Access Helpers
 * Purpose: Menyatukan default akses route Strategic dan pengecekan admin utama.
 */

export const DEFAULT_Strategic_ACCESS = {
  mainPlanner: true,
  customMaps: true,
  saves: true,
};

export const PRIMARY_STRATEGIC_ADMIN_USERNAME = "strategicadmin";

export function normalizeStrategicUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function normalizeAccessState(access) {
  return {
    mainPlanner: access?.mainPlanner !== false,
    customMaps: access?.customMaps !== false,
    saves: access?.saves !== false,
  };
}

export function isPrimaryStrategicAdminUser(user) {
  if (user?.isPrimaryAdmin === true) {
    return true;
  }

  return normalizeStrategicUsername(user?.username) === PRIMARY_STRATEGIC_ADMIN_USERNAME;
}

export function normalizeStrategicAccessEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const username = normalizeStrategicUsername(entry.username);

  if (!username) {
    return null;
  }

  return {
    username,
    access: {
      mainPlanner: entry.access?.mainPlanner !== false,
      customMaps: entry.access?.customMaps !== false,
      saves: entry.access?.saves !== false,
    },
    updatedAt:
      typeof entry.updatedAt === "string" && entry.updatedAt
        ? entry.updatedAt
        : new Date().toISOString(),
  };
}

export function normalizeStrategicAccessEntries(value) {
  return Array.isArray(value)
    ? value.map((entry) => normalizeStrategicAccessEntry(entry)).filter(Boolean)
    : [];
}

export function getStrategicAccessForUser(user, accessEntries = []) {
  if (isPrimaryStrategicAdminUser(user)) {
    return DEFAULT_Strategic_ACCESS;
  }

  if (user?.access && typeof user.access === "object") {
    return normalizeAccessState(user.access);
  }

  const username = normalizeStrategicUsername(user?.username);
  const matchedEntry = accessEntries.find(
    (entry) => normalizeStrategicUsername(entry.username) === username,
  );

  if (!matchedEntry) {
    return DEFAULT_Strategic_ACCESS;
  }

  return normalizeAccessState(matchedEntry.access);
}
