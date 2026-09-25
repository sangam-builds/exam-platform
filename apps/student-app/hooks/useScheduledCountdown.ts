'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScheduledCountdownProps {
  startTime?: string | null;
  onUnlock?: () => void;
}

export const useScheduledCountdown = ({
  startTime,
  onUnlock,
}: UseScheduledCountdownProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  const calculateRemaining = useCallback(() => {
    if (!startTime) return 0;
    const targetMs = new Date(startTime).getTime();
    const nowMs = Date.now();
    return Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  }, [startTime]);

  useEffect(() => {
    if (!startTime) {
      setSecondsRemaining(0);
      return;
    }

    const initial = calculateRemaining();
    setSecondsRemaining(initial);

    if (initial <= 0) {
      if (onUnlockRef.current) {
        onUnlockRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onUnlockRef.current) {
          onUnlockRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining, startTime]);

  const isLocked = Boolean(startTime && secondsRemaining > 0);

  const days = Math.floor(secondsRemaining / (3600 * 24));
  const hours = Math.floor((secondsRemaining % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  let formattedCountdown = '';
  if (days > 0) {
    formattedCountdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    formattedCountdown = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return {
    isLocked,
    secondsRemaining,
    formattedCountdown,
    minutesRemaining: minutes,
    secondsRemainingSub: seconds,
  };
};
