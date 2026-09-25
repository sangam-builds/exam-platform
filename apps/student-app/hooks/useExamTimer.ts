'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExamTimerProps {
  durationMinutes: number;
  startedAt: string;
  onExpire?: () => void;
}

export const useExamTimer = ({
  durationMinutes,
  startedAt,
  onExpire,
}: UseExamTimerProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const calculateRemaining = useCallback(() => {
    const startMs = new Date(startedAt).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endMs = startMs + durationMs;
    const nowMs = Date.now();
    const diffSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
    return diffSeconds;
  }, [durationMinutes, startedAt]);

  useEffect(() => {
    const initial = calculateRemaining();
    setSecondsRemaining(initial);

    if (initial <= 0) {
      if (onExpireRef.current) {
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formattedTime =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = secondsRemaining <= 300 && secondsRemaining > 60; // < 5 minutes
  const isCritical = secondsRemaining <= 60; // < 1 minute

  return {
    secondsRemaining,
    formattedTime,
    hours,
    minutes,
    seconds,
    isWarning,
    isCritical,
  };
};
