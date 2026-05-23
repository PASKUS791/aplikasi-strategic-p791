/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Custom Maps
 * Purpose: Normalizer dan helper untuk daftar map custom Strategic.
 */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createBoardActionId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBoardAction(action, index) {
  if (!action || typeof action !== "object") {
    return null;
  }

  if (action.type === "text") {
    return {
      id: action.id ?? `text-${index}`,
      type: "text",
      x: Number(action.x) || 0,
      y: Number(action.y) || 0,
      text: typeof action.text === "string" ? action.text : "",
      color: typeof action.color === "string" ? action.color : "#E9C349",
      size: clamp(Number(action.size) || 18, 10, 48),
    };
  }

  if (!Array.isArray(action.points) || action.points.length === 0) {
    return null;
  }

  return {
    id: action.id ?? `stroke-${index}`,
    type: "stroke",
    tool: action.tool === "eraser" ? "eraser" : "pen",
    color: typeof action.color === "string" ? action.color : "#E9C349",
    size: clamp(Number(action.size) || 12, 2, 44),
    points: action.points.map((point) => ({
      x: Number(point?.x) || 0,
      y: Number(point?.y) || 0,
    })),
  };
}

function normalizeViewport(viewport) {
  if (
    viewport &&
    typeof viewport === "object" &&
    Number.isFinite(viewport.scale) &&
    Number.isFinite(viewport.offsetX) &&
    Number.isFinite(viewport.offsetY)
  ) {
    return {
      scale: viewport.scale,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
    };
  }

  return null;
}

export function createCustomMapId() {
  return createBoardActionId("custom-map");
}

export function isStrategicSaveLinkedToCustomMap(save, mapId) {
  return save?.sourceType === "custom-map" && save?.sourceMapId === mapId;
}

export function countCustomMapLinkedSaves(saves, mapId) {
  return Array.isArray(saves)
    ? saves.filter((save) => isStrategicSaveLinkedToCustomMap(save, mapId)).length
    : 0;
}

export function removeCustomMapEntries(entries, mapId) {
  return Array.isArray(entries)
    ? entries.filter((entry) => entry?.id !== mapId)
    : [];
}

export function removeCustomMapLinkedSaves(saves, mapId) {
  return Array.isArray(saves)
    ? saves.filter((save) => !isStrategicSaveLinkedToCustomMap(save, mapId))
    : [];
}

export function normalizeCustomMapEntry(entry, index = 0) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const imageDataUrl = typeof entry.imageDataUrl === "string" ? entry.imageDataUrl : "";

  if (!imageDataUrl.startsWith("data:image/")) {
    return null;
  }

  const boardActions = Array.isArray(entry.board?.actions)
    ? entry.board.actions
        .map((action, actionIndex) => normalizeBoardAction(action, actionIndex))
        .filter(Boolean)
    : [];

  return {
    id: entry.id ?? `custom-map-${index}`,
    title: String(entry.title || "").trim() || `Custom Map ${index + 1}`,
    description: String(entry.description || "").trim(),
    imageDataUrl,
    createdAt:
      typeof entry.createdAt === "string" && entry.createdAt
        ? entry.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof entry.updatedAt === "string" && entry.updatedAt
        ? entry.updatedAt
        : new Date().toISOString(),
    createdBy: {
      id: entry.createdBy?.id ?? null,
      username: String(entry.createdBy?.username || "").trim(),
      label: String(entry.createdBy?.label || "").trim(),
    },
    board: {
      actions: boardActions,
      viewport: normalizeViewport(entry.board?.viewport),
    },
  };
}

export function normalizeCustomMaps(value) {
  return Array.isArray(value)
    ? value.map((entry, index) => normalizeCustomMapEntry(entry, index)).filter(Boolean)
    : [];
}
