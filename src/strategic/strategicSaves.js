/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { dispatchStrategicSave as dispatchStrategicSaveApi } from "../lib/strategicApi";
import { RESOURCE_KEYS, saveResource } from "../lib/resources";
import { RONOGRAD_MAP_DATA } from "./ronogradMapData";

export const DEFAULT_PLANNER_STATE = {
  actions: [],
  enabledCategoryIds: RONOGRAD_MAP_DATA.categories.map((category) => category.id),
  viewport: null,
  customMarkers: [],
};

const LEGACY_ENEMY_CATEGORY_IDS = [
  "enemy-rocketeer",
  "enemy-sniper",
  "enemy-unit",
  "enemy-vip-target",
  "enemy-camp-ambush",
  "enemy-mortar",
  "enemy-anti-air-launcher",
  "enemy-explosive-target",
  "enemy-heli-landing",
  "enemy-minefield",
  "enemy-machine-gunner",
];

function remapLegacyCategoryId(categoryId) {
  return LEGACY_ENEMY_CATEGORY_IDS.includes(categoryId) ? "enemy-intel" : categoryId;
}

function normalizeEnabledCategoryIds(enabledCategoryIds) {
  if (!Array.isArray(enabledCategoryIds)) {
    return DEFAULT_PLANNER_STATE.enabledCategoryIds;
  }

  return [...new Set(enabledCategoryIds.map(remapLegacyCategoryId))].filter((id) =>
    DEFAULT_PLANNER_STATE.enabledCategoryIds.includes(id),
  );
}

export function normalizePlannerState(value) {
  if (!value || typeof value !== "object") {
    return DEFAULT_PLANNER_STATE;
  }

  return {
    actions: Array.isArray(value.actions) ? value.actions : [],
    enabledCategoryIds: normalizeEnabledCategoryIds(value.enabledCategoryIds),
    viewport:
      value.viewport &&
      typeof value.viewport === "object" &&
      Number.isFinite(value.viewport.scale) &&
      Number.isFinite(value.viewport.offsetX) &&
      Number.isFinite(value.viewport.offsetY)
        ? {
            scale: value.viewport.scale,
            offsetX: value.viewport.offsetX,
            offsetY: value.viewport.offsetY,
          }
        : null,
    customMarkers: Array.isArray(value.customMarkers) ? value.customMarkers : [],
  };
}

export function normalizeStrategicSaves(value) {
  return Array.isArray(value) ? value : [];
}

export async function applyStrategicSaveToPlanner(save) {
  if (!save?.snapshot) {
    return null;
  }

  return saveResource(RESOURCE_KEYS.strategicPlannerState, {
    actions: Array.isArray(save.snapshot.actions) ? save.snapshot.actions : [],
    enabledCategoryIds: normalizeEnabledCategoryIds(
      save.snapshot.enabledCategoryIds,
    ),
    viewport: save.snapshot.viewport ?? null,
    customMarkers: Array.isArray(save.snapshot.customMarkers) ? save.snapshot.customMarkers : [],
  });
}

export async function dispatchStrategicSave(saveOrId) {
  const saveId =
    typeof saveOrId === "string"
      ? saveOrId
      : String(saveOrId?.id || "").trim();

  if (!saveId) {
    throw new Error("Strategic save tidak valid.");
  }

  return dispatchStrategicSaveApi(saveId, {
    thumbnailDataUrl:
      typeof saveOrId === "object" && saveOrId
        ? saveOrId.thumbnailDataUrl
        : "",
  });
}
