import { DATA_VERSION, type AppData } from './types';

/**
 * Migrazioni dei dati salvati.
 *
 * REGOLA: ogni modifica alla struttura di AppData deve
 *  1. incrementare DATA_VERSION in types.ts
 *  2. aggiungere qui una funzione che porta i dati dalla versione precedente alla nuova,
 *     senza mai scartare informazioni.
 * I dati vecchi vengono sempre aggiornati, mai buttati.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const steps: Record<number, (d: Raw) => Raw> = {
  // v1 → v2: `date` diventa `startedAt`, nuovo campo opzionale `finishedAt`
  1: (d) => ({
    ...d,
    version: 2,
    sessions: d.sessions.map(({ date, ...s }: Raw) => ({ ...s, startedAt: s.startedAt ?? date })),
  }),
};

export class FutureVersionError extends Error {}

export function migrate(raw: Raw): AppData {
  if (!raw || typeof raw !== 'object' || typeof raw.version !== 'number') throw new Error('Formato non riconosciuto');
  if (!Array.isArray(raw.workouts) || !Array.isArray(raw.sessions)) throw new Error('Formato non riconosciuto');
  if (raw.version > DATA_VERSION) throw new FutureVersionError(`Dati della versione ${raw.version}, app alla ${DATA_VERSION}`);
  let d = raw;
  while (d.version < DATA_VERSION) {
    const step = steps[d.version];
    if (!step) throw new Error(`Manca la migrazione dalla versione ${d.version}`);
    d = step(d);
  }
  return d as AppData;
}
