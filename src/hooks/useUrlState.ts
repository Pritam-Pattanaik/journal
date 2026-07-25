import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export type UrlParamValue = string | number | boolean | null | undefined;

export interface UseUrlStateReturn<T extends Record<string, UrlParamValue>> {
  params: { [K in keyof T]: T[K] };
  setParam: <K extends keyof T>(key: K, value: T[K]) => void;
  setParams: (newParams: Partial<{ [K in keyof T]: T[K] }>) => void;
  resetParams: () => void;
  queryString: string;
}

/**
 * Architectural custom hook for URL SearchParams as the authoritative Source of Truth
 * for filtering, date ranges, pagination, and sorting across institutional views.
 */
export function useUrlState<T extends Record<string, UrlParamValue>>(
  defaultValues: T
): UseUrlStateReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const parsed: Partial<{ [K in keyof T]: T[K] }> = {};
    for (const key of Object.keys(defaultValues) as Array<keyof T>) {
      const val = searchParams.get(key as string);
      const defaultVal = defaultValues[key];

      if (val === null) {
        parsed[key] = defaultVal;
      } else if (typeof defaultVal === 'number') {
        parsed[key] = Number(val) as T[keyof T];
      } else if (typeof defaultVal === 'boolean') {
        parsed[key] = (val === 'true') as T[keyof T];
      } else {
        parsed[key] = val as T[keyof T];
      }
    }
    return parsed as { [K in keyof T]: T[K] };
  }, [searchParams, defaultValues]);

  const setParam = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === undefined || value === '') {
          next.delete(key as string);
        } else {
          next.set(key as string, String(value));
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setParams = useCallback(
    (newParams: Partial<{ [K in keyof T]: T[K] }>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const resetParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    params,
    setParam,
    setParams,
    resetParams,
    queryString: searchParams.toString(),
  };
}
