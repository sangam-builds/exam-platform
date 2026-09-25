'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/apiClient';

interface UseTabSwitchDetectionOptions {
  attemptId: string | null;
  enabled?: boolean;
  onTabSwitch?: (count: number) => void;
}

export const useTabSwitchDetection = ({
  attemptId,
  enabled = true,
  onTabSwitch,
}: UseTabSwitchDetectionOptions) => {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const lastHiddenTime = useRef<number | null>(null);
  const isEnabledRef = useRef(enabled);
  isEnabledRef.current = enabled;

  const handleTabSwitch = useCallback(async () => {
    if (!isEnabledRef.current || !attemptId) return;

    setTabSwitchCount((prev) => {
      const nextCount = prev + 1;
      setIsWarningOpen(true);

      if (onTabSwitch) {
        onTabSwitch(nextCount);
      }

      // Record flag to backend asynchronously
      api.integrity
        .recordFlag({
          attemptId,
          flagType: 'TAB_SWITCH',
          details: {
            switchCount: nextCount,
            detectedAt: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          },
        })
        .catch((err) => {
          console.warn('Failed to record integrity flag:', err);
        });

      return nextCount;
    });
  }, [attemptId, onTabSwitch]);

  useEffect(() => {
    if (!enabled || !attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenTime.current = Date.now();
        handleTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      // In some browsers or desktop focus changes
      if (!document.hidden && (!lastHiddenTime.current || Date.now() - lastHiddenTime.current > 1000)) {
        lastHiddenTime.current = Date.now();
        handleTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, attemptId, handleTabSwitch]);

  const dismissWarning = useCallback(() => {
    setIsWarningOpen(false);
  }, []);

  return {
    tabSwitchCount,
    isWarningOpen,
    dismissWarning,
  };
};
