/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStrategicResource,
  saveStrategicResource,
  subscribeStrategicResource,
} from "./strategicApi";

export const RESOURCE_KEYS = {
  strategicPlannerState: "strategic.plannerState",
  strategicStrategicSaves: "strategic.strategicSaves",
  strategicCustomMaps: "strategic.customMaps",
  strategicMapPlannerUsers: "strategic.mapPlannerUsers",
};

function cloneDefaultValue(defaultValue) {
  if (defaultValue == null || typeof defaultValue !== "object") {
    return defaultValue;
  }

  return JSON.parse(JSON.stringify(defaultValue));
}

export async function fetchResource(resourceKey) {
  return fetchStrategicResource(resourceKey);
}

export async function saveResource(resourceKey, value) {
  return saveStrategicResource(resourceKey, value);
}

export function useSyncedResource(
  resourceKey,
  {
    defaultValue,
    enabled = true,
    normalize = (value) => value,
    saveDelay = 450,
  },
) {
  const defaultValueRef = useRef(cloneDefaultValue(defaultValue));
  const [data, setData] = useState(() => cloneDefaultValue(defaultValueRef.current));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const skipPersistRef = useRef(true);
  const saveTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const nextValue = await fetchResource(resourceKey);

      if (!mountedRef.current) {
        return;
      }

      skipPersistRef.current = true;
      setData(normalize(nextValue ?? cloneDefaultValue(defaultValueRef.current)));
      setError("");
      setReady(true);
    } catch (loadError) {
      if (!mountedRef.current) {
        return;
      }

      setError(loadError.message || "Gagal memuat data.");
      setReady(true);
    }
  }, [enabled, normalize, resourceKey]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setReady(false);
      setError("");
      setData(cloneDefaultValue(defaultValueRef.current));
      return () => {
        mountedRef.current = false;
      };
    }

    setReady(false);
    reload();

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeStrategicResource(resourceKey, reload);
  }, [enabled, reload, resourceKey]);

  useEffect(() => {
    if (!enabled || !ready) {
      return undefined;
    }

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return undefined;
    }

    clearSaveTimeout();
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await saveResource(resourceKey, data);
        if (mountedRef.current) {
          setError("");
        }
      } catch (saveError) {
        if (mountedRef.current) {
          setError(saveError.message || "Gagal menyimpan data.");
        }
      }
    }, saveDelay);

    return clearSaveTimeout;
  }, [clearSaveTimeout, data, enabled, ready, resourceKey, saveDelay]);

  useEffect(
    () => () => {
      clearSaveTimeout();
    },
    [clearSaveTimeout],
  );

  return {
    data,
    setData,
    ready,
    loading: !ready,
    error,
    reload,
  };
}
