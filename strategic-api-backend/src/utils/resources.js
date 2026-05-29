/*
 * Team DUKUN PASKUS 791 - Resource Helpers
 */

const ALLOWED_RESOURCE_KEYS = new Set([
  "strategic.plannerState",
  "strategic.customMaps",
  "strategic.strategicSaves",
  "strategic.mapPlannerUsers",
]);

const DEFAULT_RESOURCE_VALUES = {
  "strategic.plannerState": {
    actions: [],
    enabledCategoryIds: ["2", "3", "4", "5", "6", "7", "8", "enemy-intel"],
    viewport: null,
    customMarkers: [],
  },
  "strategic.customMaps": [],
  "strategic.strategicSaves": [],
  "strategic.mapPlannerUsers": [],
};

const RESOURCE_PERMISSION_MAP = {
  "strategic.plannerState": "mainPlanner",
  "strategic.customMaps": "customMaps",
  "strategic.strategicSaves": "saves",
  "strategic.mapPlannerUsers": "admin",
};

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultResourceValue(resourceKey) {
  return cloneValue(DEFAULT_RESOURCE_VALUES[resourceKey] ?? null);
}

function getResourcePermission(resourceKey) {
  return RESOURCE_PERMISSION_MAP[resourceKey] || null;
}

module.exports = {
  ALLOWED_RESOURCE_KEYS,
  DEFAULT_RESOURCE_VALUES,
  cloneValue,
  getDefaultResourceValue,
  getResourcePermission,
};
