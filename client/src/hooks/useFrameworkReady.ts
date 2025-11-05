import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      (globalThis as any).window.frameworkReady?.();
    }
  });
}

