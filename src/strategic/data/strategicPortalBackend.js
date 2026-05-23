/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Backend Adapter
 * Purpose: Menyatukan operasi data Strategic untuk akses planner, user, dan dispatch.
 */

import { PRIMARY_STRATEGIC_ADMIN_USERNAME } from "../strategicAccess";
import {
  createStrategicUserAccount,
  deleteStrategicUserAccount,
  dispatchStrategicSave,
  fetchStrategicResource,
  listStrategicUsersApi,
  saveStrategicResource,
} from "../../lib/strategicApi";
import { RESOURCE_KEYS } from "../../lib/resources";

function cloneArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

export function createEmptyStrategicPortalSnapshot() {
  return {
    plannerState: null,
    customMaps: [],
    strategicSaves: [],
    mapPlannerUsers: [],
    users: [],
  };
}

function isPrimaryAdminUser(user) {
  return String(user?.username || "").trim().toLowerCase() === PRIMARY_STRATEGIC_ADMIN_USERNAME;
}

function filterStrategicSavesByUser(saves, user) {
  if (isPrimaryAdminUser(user)) {
    return cloneArray(saves);
  }

  const normalizedUsername = String(user?.username || "").trim().toLowerCase();
  return cloneArray(saves).filter(
    (entry) => String(entry.ownerUsername || "").trim().toLowerCase() === normalizedUsername,
  );
}

export async function fetchStrategicPortalSnapshot(currentUser = null) {
  const [plannerState, customMaps, strategicSaves, mapPlannerUsers, usersPayload] =
    await Promise.all([
      fetchStrategicResource(RESOURCE_KEYS.strategicPlannerState),
      fetchStrategicResource(RESOURCE_KEYS.strategicCustomMaps),
      fetchStrategicResource(RESOURCE_KEYS.strategicStrategicSaves),
      fetchStrategicResource(RESOURCE_KEYS.strategicMapPlannerUsers),
      isPrimaryAdminUser(currentUser)
        ? listStrategicUsersApi().catch(() => ({ users: [] }))
        : Promise.resolve({ users: [] }),
    ]);

  return {
    plannerState: plannerState || null,
    customMaps: cloneArray(customMaps),
    strategicSaves: filterStrategicSavesByUser(cloneArray(strategicSaves), currentUser),
    mapPlannerUsers: cloneArray(mapPlannerUsers),
    users: Array.isArray(usersPayload?.users) ? usersPayload.users : [],
  };
}

export async function fetchStrategicPlannerUsers() {
  const payload = await listStrategicUsersApi();
  return Array.isArray(payload?.users) ? payload.users : [];
}

export async function createStrategicPlannerUser(formState) {
  return createStrategicUserAccount(formState);
}

export async function removeStrategicPlannerUser(username) {
  return deleteStrategicUserAccount(username);
}

export async function persistStrategicResource(resourceKey, value) {
  return saveStrategicResource(resourceKey, value);
}

export async function dispatchStrategicSnapshot(saveId) {
  return dispatchStrategicSave(saveId);
}
