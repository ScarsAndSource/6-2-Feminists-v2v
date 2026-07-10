import { useCallback, useState } from 'react';
import { storageGet, storageSet } from '../lib/storage';
export type JourneyStage = 'landing' | 'log' | 'report' | 'suggestions' | 'helper' | 'patterns' | 'doctor';
const KEY = 'journey';
export function useJourney() {
  const [stage, setStageState] = useState<JourneyStage>(() => storageGet<JourneyStage>(KEY, 'landing'));
  const setStage = useCallback((next: JourneyStage) => { storageSet(KEY, next); setStageState(next); }, []);
  return { stage, setStage };
}
