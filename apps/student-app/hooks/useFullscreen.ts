'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const checkFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    const fsElement =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;
    return !!fsElement;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const doc = document as any;
    const supported =
      !!(
        doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        doc.mozFullScreenEnabled ||
        doc.msFullscreenEnabled
      );
    setIsSupported(supported);
    setIsFullscreen(checkFullscreen());

    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkFullscreen]);

  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;

    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      } else {
        return false;
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn('Fullscreen request failed or was denied:', err);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;

    try {
      const doc = document as any;
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      setIsFullscreen(false);
      return true;
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return exitFullscreen();
    } else {
      return enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
