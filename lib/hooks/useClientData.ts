'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchClientData, saveClientData } from '@/lib/clients-api';

// Global save queue — ensures unmount flushes complete before the next mount fetch
const pendingSaves = new Map<string, Promise<void>>();

function getSaveKey(clientId: string, dataType: string) {
  return `${clientId}:${dataType}`;
}

/**
 * Hook to load and persist per-client sub-data (kanban, agenda, etc.) via API.
 * Replaces direct localStorage read/write with debounced API calls.
 *
 * Fixes:
 * - Waits for any pending save to complete before fetching on mount
 * - Properly handles empty arrays as valid data (not treated as "no data")
 * - Synchronous flush on unmount tracked globally to prevent race conditions
 */
export function useClientData<T>(
  clientId: string,
  dataType: string,
  fallback: T
): {
  data: T;
  setData: (newData: T | ((prev: T) => T)) => void;
  loading: boolean;
} {
  const [data, setDataState] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<T>(fallback);
  const hasSavedRef = useRef(false);

  // Load data on mount — wait for any pending save first
  useEffect(() => {
    const key = getSaveKey(clientId, dataType);

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      // Wait for any pending save from a previous unmount
      const pending = pendingSaves.get(key);
      if (pending) {
        await pending;
        pendingSaves.delete(key);
      }

      try {
        const result = await fetchClientData<T>(clientId, dataType);
        if (!cancelled) {
          // Accept any non-null/undefined result, including empty arrays
          if (result !== null && result !== undefined) {
            // If the user has already made changes (hasSavedRef = true), the
            // fetch result is stale relative to the user's optimistic update.
            // Updating state or ref here would erase the user's change from
            // both the UI and the pending debounced save.
            if (!hasSavedRef.current) {
              setDataState(result);
              latestDataRef.current = result;
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error(`useClientData(${dataType}) load error:`, err);
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [clientId, dataType]);

  // setData: optimistic update + debounced API save
  const setData = useCallback(
    (newDataOrFn: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const newData = typeof newDataOrFn === 'function'
          ? (newDataOrFn as (prev: T) => T)(prev)
          : newDataOrFn;

        latestDataRef.current = newData;
        hasSavedRef.current = true;

        // Debounce API write
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const key = getSaveKey(clientId, dataType);
          const savePromise = saveClientData(clientId, dataType, latestDataRef.current).catch((err) => {
            console.error(`useClientData(${dataType}) save error:`, err);
          });
          pendingSaves.set(key, savePromise);
          savePromise.then(() => {
            // Only delete if this is still the active save
            if (pendingSaves.get(key) === savePromise) {
              pendingSaves.delete(key);
            }
          });
        }, 300);

        return newData;
      });
    },
    [clientId, dataType]
  );

  // Cleanup debounce on unmount — flush pending save
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Only flush if data was actually modified
        if (hasSavedRef.current) {
          const key = getSaveKey(clientId, dataType);
          const savePromise = saveClientData(clientId, dataType, latestDataRef.current).catch(() => {});
          pendingSaves.set(key, savePromise);
          savePromise.then(() => {
            if (pendingSaves.get(key) === savePromise) {
              pendingSaves.delete(key);
            }
          });
        }
      }
    };
  }, [clientId, dataType]);

  return { data, setData, loading };
}
