import { useEffect, useState } from 'react';

/** Ora corrente aggiornata ogni `intervalMs` (null = ferma) */
export function useNow(intervalMs: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (intervalMs == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
