'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
}

export function usePolling<T>({
  fetcher,
  intervalMs = 20000,
  enabled = true,
  onSuccess,
  onError,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(!enabled);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<number>(
    Math.round(intervalMs / 1000),
  );

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const executeFetch = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastPolledAt(new Date());
      setSecondsUntilNextPoll(Math.round(intervalMs / 1000));
      if (onSuccessRef.current) {
        onSuccessRef.current(result);
      }
    } catch (err: any) {
      console.error('Polling fetch error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to fetch latest data.';
      setError(msg);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [intervalMs]);

  // Initial fetch on mount or when enabled changes
  useEffect(() => {
    if (enabled && !isPaused) {
      executeFetch(true);
    }
  }, [enabled, isPaused, executeFetch]);

  // Periodic Polling & countdown ticker
  useEffect(() => {
    if (!enabled || isPaused) return;

    // 1-second interval to update countdown timer
    const ticker = setInterval(() => {
      setSecondsUntilNextPoll((prev) => {
        if (prev <= 1) {
          executeFetch(false);
          return Math.round(intervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [enabled, isPaused, intervalMs, executeFetch]);

  const refresh = useCallback(() => {
    setSecondsUntilNextPoll(Math.round(intervalMs / 1000));
    return executeFetch(false);
  }, [executeFetch, intervalMs]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    setSecondsUntilNextPoll(Math.round(intervalMs / 1000));
    executeFetch(false);
  }, [executeFetch, intervalMs]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, resume, pause]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastPolledAt,
    isPaused,
    secondsUntilNextPoll,
    refresh,
    pause,
    resume,
    togglePause,
  };
}
