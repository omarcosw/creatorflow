'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchClientData, saveClientData } from '@/lib/clients-api';

/**
 * Hook to load and persist per-client sub-data (kanban, agenda, etc.) via API.
 * Replaces direct localStorage read/write with debounced API calls.
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

  // Load data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchClientData<T>(clientId, dataType)
      .then((result) => {
        if (!cancelled) {
          // Only use API result if it has meaningful data
          const hasData = Array.isArray(result) ? result.length > 0 : result !== null && result !== undefined;
          if (hasData) {
            setDataState(result);
            latestDataRef.current = result;
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`useClientData(${dataType}) load error:`, err);
        if (!cancelled) setLoading(false);
      });

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

        // Debounce API write
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveClientData(clientId, dataType, latestDataRef.current).catch((err) => {
            console.error(`useClientData(${dataType}) save error:`, err);
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
        // Flush the latest data on unmount
        saveClientData(clientId, dataType, latestDataRef.current).catch(() => {});
      }
    };
  }, [clientId, dataType]);

  return { data, setData, loading };
}
