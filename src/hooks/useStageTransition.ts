import { useCallback } from 'react';
export function useStageTransition() {
  const transition = useCallback((update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    doc.startViewTransition ? doc.startViewTransition(update) : update();
  }, []);
  return { transition };
}
