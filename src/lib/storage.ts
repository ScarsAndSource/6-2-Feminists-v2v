const PREFIX = 'undismissed:v1:';

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch (error) { console.warn(`[storage] could not read ${key}`, error); return fallback; }
}
export function storageSet<T>(key: string, value: T): boolean {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
  catch (error) { console.error(`[storage] could not save ${key}`, error); return false; }
}
export function storageRemove(key: string): void { localStorage.removeItem(PREFIX + key); }
export function onStorageChange(key: string, callback: () => void): () => void {
  const handler = (event: StorageEvent) => { if (event.key === PREFIX + key) callback(); };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
