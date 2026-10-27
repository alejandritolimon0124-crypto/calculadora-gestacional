import { useEffect, useState } from 'react';

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : JSON.parse(stored);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* La app sigue funcionando si el almacenamiento está lleno o bloqueado. */ }
  }, [key, value]);

  return [value, setValue];
}
