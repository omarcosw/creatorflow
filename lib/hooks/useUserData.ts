'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserData, saveUserData } from '@/lib/clients-api';

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchUserData<T>(dataType)
      .then((result) => {
        if (!cancelled) {
          const hasData = Array.isArray(result) ? result.length > 0 : result !== null && result !== undefined;
          if (hasData) {
            setDataState(result as T);
            latestDataRef.current = result as T;
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`useUserData(${dataType}) load error:`, err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dataType]);

  const setData = useCallback(
    (newDataOrFn: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const newData = typeof newDataOrFn === 'function'
          ? (newDataOrFn as (prev: T) => T)(prev)
          : newDataOrFn;

        latestDataRef.current = newData;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveUserData(dataType, latestDataRef.current).catch((err) => {
            console.error(`useUserData(${dataType}) save error:`, err);
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
        saveUserData(dataType, latestDataRef.current).catch(() => {});
      }
    };
  }, [dataType]);

  return { data, setData, loading };
}
