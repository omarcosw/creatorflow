'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserData, saveUserData } from '@/lib/clients-api';

// Global save queue — ensures unmount flushes complete before the next mount fetch
const pendingSaves = new Map<string, Promise<void>>();

/**
 * Hook to load and persist user-level data (executive projects, freelancers, etc.) via API.
 * Same pattern as useClientData but keyed by userId (derived from token) instead of clientId.
 */
export function useUserData<T>(
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      // Wait for any pending save from a previous unmount
      const pending = pendingSaves.get(dataType);
      if (pending) {
        await pending;
        pendingSaves.delete(dataType);
      }

      try {
        const result = await fetchUserData<T>(dataType);
        if (!cancelled && result !== null && result !== undefined) {
          setDataState(result);
          latestDataRef.current = result;
        }
        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error(`useUserData(${dataType}) load error:`, err);
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [dataType]);

  const setData = useCallback(
    (newDataOrFn: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const newData = typeof newDataOrFn === 'function'
          ? (newDataOrFn as (prev: T) => T)(prev)
          : newDataOrFn;

        latestDataRef.current = newData;
        hasSavedRef.current = true;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const savePromise = saveUserData(dataType, latestDataRef.current).catch((err) => {
            console.error(`useUserData(${dataType}) save error:`, err);
          });
          pendingSaves.set(dataType, savePromise);
          savePromise.then(() => {
            if (pendingSaves.get(dataType) === savePromise) {
              pendingSaves.delete(dataType);
            }
          });
        }, 300);

        return newData;
      });
    },
    [dataType]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (hasSavedRef.current) {
          const savePromise = saveUserData(dataType, latestDataRef.current).catch(() => {});
          pendingSaves.set(dataType, savePromise);
          savePromise.then(() => {
            if (pendingSaves.get(dataType) === savePromise) {
              pendingSaves.delete(dataType);
            }
          });
        }
      }
    };
  }, [dataType]);

  return { data, setData, loading };
}
