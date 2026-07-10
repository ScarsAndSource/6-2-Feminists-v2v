const PREFIX = 'undismissed';

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(`${PREFIX}:${key}`) === '1';
  } catch {
    return false;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    if (value) localStorage.setItem(`${PREFIX}:${key}`, '1');
    else localStorage.removeItem(`${PREFIX}:${key}`);
  } catch {
    // storage unavailable (private mode etc) — fail silent, never block the app
  }
}

export function hasOnboarded(): boolean {
  return readBool('onboarded');
}

export function setOnboarded(value = true): void {
  writeBool('onboarded', value);
}

export function getAvgCycleLength(): number | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}:avg_cycle_length`);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setAvgCycleLength(days: number | null): void {
  try {
    if (days == null) localStorage.removeItem(`${PREFIX}:avg_cycle_length`);
    else localStorage.setItem(`${PREFIX}:avg_cycle_length`, String(Math.round(days)));
  } catch {
    // ignore
  }
}

export function getManualCycleDay(): number | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}:manual_cycle_day`);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setManualCycleDay(day: number | null): void {
  try {
    if (day == null) localStorage.removeItem(`${PREFIX}:manual_cycle_day`);
    else localStorage.setItem(`${PREFIX}:manual_cycle_day`, String(Math.round(day)));
  } catch {
    // ignore
  }
}

export function hasCelebrated(key: 'first_log' | 'first_casefile'): boolean {
  return readBool(`celebrated_${key}`);
}

export function setCelebrated(key: 'first_log' | 'first_casefile'): void {
  writeBool(`celebrated_${key}`, true);
}
