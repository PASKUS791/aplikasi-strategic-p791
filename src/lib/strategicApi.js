/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic API
 * Purpose: Konektor frontend Strategic ke backend /api milik project ini.
 */

import { createJsonHttpClient, normalizeHttpError } from "./httpClient";

const Strategic_SESSION_STORAGE_KEY = "strategic-p791.session.v1";
const RAW_Strategic_API_BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_STRATEGIC_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://api.strategic.so791.com";
const API_BASE_URL = RAW_Strategic_API_BASE_URL.replace(/\/$/, "");
const strategicHttpClient = createJsonHttpClient({
  baseURL: API_BASE_URL,
});
const Strategic_SSE_RECONNECT_DELAY_MS = 1400;
const strategicResourceListeners = new Map();
let strategicSharedEventSource = null;
let strategicReconnectTimer = null;

export function isStrategicResourceKey(resourceKey) {
  return String(resourceKey || "").startsWith("strategic.");
}

function getWindowStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStoredJson(key) {
  const storage = getWindowStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredJson(key, value) {
  const storage = getWindowStorage();

  if (!storage) {
    return value;
  }

  storage.setItem(key, JSON.stringify(value));
  return value;
}

function clearStoredJson(key) {
  const storage = getWindowStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(key);
}

export function normalizeStrategicSessionUser(user) {
  if (!user) {
    return null;
  }

  const operatorId = String(user.operatorId || user.username || "")
    .trim()
    .toLowerCase();
  const normalizedAccess =
    user?.access && typeof user.access === "object"
      ? {
          mainPlanner: user.access.mainPlanner !== false,
          customMaps: user.access.customMaps !== false,
          saves: user.access.saves !== false,
        }
      : null;

  return {
    id: String(user.id || operatorId || "strategic-user"),
    username: operatorId,
    operatorId,
    nama: String(user.label || user.nama || operatorId || "Strategic Admin"),
    label: String(user.label || user.nama || operatorId || "Strategic Admin"),
    unit: String(user.unit || "Strategic Command"),
    scope: "strategic",
    role: String(user.role || (user?.isPrimaryAdmin ? "admin" : "user")),
    access: normalizedAccess,
    isPrimaryAdmin: user?.isPrimaryAdmin === true,
  };
}

async function strategicApiFetch(path, options = {}) {
  try {
    const response = await strategicHttpClient.request({
      url: path,
      method: options.method || "GET",
      data: options.body,
      headers: options.headers,
    });

    return response?.data ?? null;
  } catch (error) {
    throw normalizeHttpError(error, "Strategic API request failed.");
  }
}

export function readStoredStrategicSession() {
  return readStoredJson(Strategic_SESSION_STORAGE_KEY);
}

export function writeStoredStrategicSession(session) {
  return writeStoredJson(Strategic_SESSION_STORAGE_KEY, session);
}

export function clearStoredStrategicSession() {
  clearStoredJson(Strategic_SESSION_STORAGE_KEY);
}

export async function loginStrategic(operatorId, securityKey) {
  const normalizedOperatorId = String(operatorId || "").trim().toLowerCase();
  const payload = await strategicApiFetch("/api/auth/login", {
    method: "POST",
    body: {
      scope: "strategic",
      operatorId: normalizedOperatorId,
      securityKey,
      username: normalizedOperatorId,
      password: securityKey,
    },
  });

  const session = {
    user: normalizeStrategicSessionUser(payload?.user),
    updatedAt: new Date().toISOString(),
  };

  writeStoredStrategicSession(session);
  return session;
}

export async function refreshStrategicSession() {
  const payload = await strategicApiFetch("/api/auth/session");
  const serverUser = payload?.authenticated ? payload?.user : null;

  if (!serverUser || serverUser.scope !== "strategic") {
    clearStoredStrategicSession();
    return null;
  }

  const session = {
    user: normalizeStrategicSessionUser(serverUser),
    updatedAt: new Date().toISOString(),
  };

  writeStoredStrategicSession(session);
  return session;
}

export async function logoutStrategic() {
  try {
    await strategicApiFetch("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearStoredStrategicSession();
  }
}

export async function fetchStrategicResource(resourceKey) {
  const payload = await strategicApiFetch(
    `/api/resources/${encodeURIComponent(resourceKey)}`,
  );
  return payload?.value;
}

export async function saveStrategicResource(resourceKey, value) {
  const payload = await strategicApiFetch(
    `/api/resources/${encodeURIComponent(resourceKey)}`,
    {
      method: "PUT",
      body: { value },
    },
  );
  return payload?.value;
}

function closeSharedResourceStream() {
  if (strategicReconnectTimer && typeof window !== "undefined") {
    window.clearTimeout(strategicReconnectTimer);
    strategicReconnectTimer = null;
  }

  if (!strategicSharedEventSource) {
    return;
  }

  strategicSharedEventSource.close();
  strategicSharedEventSource = null;
}

function scheduleSharedResourceReconnect() {
  if (typeof window === "undefined") {
    return;
  }

  if (strategicReconnectTimer || strategicResourceListeners.size === 0) {
    return;
  }

  strategicReconnectTimer = window.setTimeout(() => {
    strategicReconnectTimer = null;
    ensureSharedResourceStream();
  }, Strategic_SSE_RECONNECT_DELAY_MS);
}

function ensureSharedResourceStream() {
  if (typeof window === "undefined") {
    return;
  }

  if (strategicSharedEventSource || strategicResourceListeners.size === 0) {
    return;
  }

  const eventSource = new EventSource(`${API_BASE_URL}/api/events`, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const resourceKey = String(payload?.resource || "");

      if (!resourceKey) {
        return;
      }

      const listeners = strategicResourceListeners.get(resourceKey);

      if (!listeners || listeners.size === 0) {
        return;
      }

      listeners.forEach((listener) => listener());
    } catch {
      // Ignore malformed event payloads.
    }
  };

  eventSource.onerror = () => {
    if (strategicSharedEventSource === eventSource) {
      strategicSharedEventSource = null;
    }

    eventSource.close();
    scheduleSharedResourceReconnect();
  };

  strategicSharedEventSource = eventSource;
}

export function subscribeStrategicResource(resourceKey, onChange) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const normalizedResourceKey = String(resourceKey || "").trim();

  if (!normalizedResourceKey || typeof onChange !== "function") {
    return () => undefined;
  }

  let listeners = strategicResourceListeners.get(normalizedResourceKey);

  if (!listeners) {
    listeners = new Set();
    strategicResourceListeners.set(normalizedResourceKey, listeners);
  }

  listeners.add(onChange);
  ensureSharedResourceStream();

  return () => {
    const activeListeners = strategicResourceListeners.get(normalizedResourceKey);

    if (!activeListeners) {
      return;
    }

    activeListeners.delete(onChange);

    if (activeListeners.size === 0) {
      strategicResourceListeners.delete(normalizedResourceKey);
    }

    if (strategicResourceListeners.size === 0) {
      closeSharedResourceStream();
    }
  };
}

export async function listStrategicUsersApi() {
  const payload = await strategicApiFetch("/api/strategic/users");
  return {
    users: Array.isArray(payload?.users) ? payload.users : [],
  };
}

export async function createStrategicUserAccount(payload) {
  const operatorId = String(payload?.operatorId || payload?.username || "")
    .trim()
    .toLowerCase();
  const securityKey = payload?.securityKey || payload?.password;

  return strategicApiFetch("/api/strategic/users", {
    method: "POST",
    body: {
      ...payload,
      operatorId,
      securityKey,
      username: operatorId,
      password: securityKey,
    },
  });
}

export async function deleteStrategicUserAccount(username) {
  return strategicApiFetch(`/api/strategic/users/${encodeURIComponent(username)}`, {
    method: "DELETE",
  });
}

export async function dispatchStrategicSave(saveId, payload = {}) {
  const requestBody = {};

  if (typeof payload?.thumbnailDataUrl === "string" && payload.thumbnailDataUrl.trim()) {
    requestBody.thumbnailDataUrl = payload.thumbnailDataUrl.trim();
  }

  if (typeof payload?.snapshotDataUrl === "string" && payload.snapshotDataUrl.trim()) {
    requestBody.snapshotDataUrl = payload.snapshotDataUrl.trim();
  }

  return strategicApiFetch(
    `/api/strategic/strategic-saves/${encodeURIComponent(saveId)}/dispatch`,
    {
      method: "POST",
      ...(Object.keys(requestBody).length > 0 ? { body: requestBody } : {}),
    },
  );
}

export async function createStrategicServerAddressWebhook(payload) {
  return strategicApiFetch("/api/strategic/server-addresses/dispatch", {
    method: "POST",
    body: payload,
  });
}

export async function updateStrategicServerAddressWebhook(messageId, payload) {
  return strategicApiFetch(
    `/api/strategic/server-addresses/${encodeURIComponent(messageId)}`,
    {
      method: "PUT",
      body: payload,
    },
  );
}

export async function deleteStrategicServerAddressWebhook(messageId) {
  return strategicApiFetch(
    `/api/strategic/server-addresses/${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
      body: {},
    },
  );
}
