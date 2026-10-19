import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FutureVersionError, migrate } from './migrations';
import { DATA_VERSION, type AppData, type Exercise, type Session, type SetLog, type Workout } from './types';

const STORAGE_KEY = 'gym-assistant-data';
const BACKUP_PREFIX = 'gym-assistant-backup-';

export const emptyData = (): AppData => ({ version: DATA_VERSION, workouts: [], sessions: [] });

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Copia di sicurezza dei dati grezzi, prima di una migrazione o se non si riescono a leggere */
function backupRaw(raw: string, label: string) {
  try {
    localStorage.setItem(`${BACKUP_PREFIX}${label}-${new Date().toISOString()}`, raw);
  } catch {
    // spazio esaurito: la copia principale resta comunque intatta
  }
}

interface LoadResult {
  data: AppData;
  /** false = i dati salvati non sono leggibili: non si scrive nulla per non sovrascriverli */
  writable: boolean;
  problem?: string;
  unreadableRaw?: string;
}

function load(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { data: emptyData(), writable: false, problem: 'La memoria del browser non è accessibile: i dati non verranno salvati.' };
  }
  if (!raw) return { data: emptyData(), writable: true };
  try {
    const parsed = JSON.parse(raw);
    const data = migrate(parsed);
    if (parsed.version !== DATA_VERSION) backupRaw(raw, `v${parsed.version}`);
    return { data, writable: true };
  } catch (e) {
    backupRaw(raw, 'illeggibile');
    const problem =
      e instanceof FutureVersionError
        ? "I dati sono stati salvati da una versione più recente dell'app. Ricarica la pagina per aggiornarla: nel frattempo non salvo nulla per non sovrascriverli."
        : 'Non riesco a leggere i dati salvati. Non salvo nulla per non sovrascriverli: esporta i dati originali dalla pagina Backup.';
    return { data: emptyData(), writable: false, problem, unreadableRaw: raw };
  }
}

/** Legge un backup esportato (anche di versioni precedenti) aggiornandolo al formato attuale */
export function parseBackup(text: string): AppData {
  return migrate(JSON.parse(text));
}

function emptySets(n: number): SetLog[] {
  return Array.from({ length: n }, () => ({ done: false }));
}

interface Store {
  data: AppData;
  createWorkout: (name: string) => Workout;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  startSession: (workoutId: string) => Session;
  updateSet: (sessionId: string, exerciseId: string, index: number, patch: Partial<SetLog>) => void;
  finishSession: (sessionId: string) => void;
  setSessionTimes: (sessionId: string, startedAt: string, finishedAt?: string) => void;
  deleteSession: (sessionId: string) => void;
  replaceAll: (data: AppData) => void;
  activeSession: Session | undefined;
  problem?: string;
  unreadableRaw?: string;
  lastPerformance: (workoutId: string, exerciseId: string, excludeSessionId?: string) => { date: string; sets: SetLog[] } | undefined;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [data, setData] = useState<AppData>(initial.data);
  const [writable, setWritable] = useState(initial.writable);
  const [problem, setProblem] = useState(initial.problem);

  useEffect(() => {
    if (!writable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage pieno o non disponibile
    }
  }, [data, writable]);

  const createWorkout = useCallback((name: string) => {
    const workout: Workout = { id: uid(), name, exercises: [] };
    setData((d) => ({ ...d, workouts: [...d.workouts, workout] }));
    return workout;
  }, []);

  const updateWorkout = useCallback((workout: Workout) => {
    setData((d) => ({ ...d, workouts: d.workouts.map((w) => (w.id === workout.id ? workout : w)) }));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }));
  }, []);

  const startSession = useCallback(
    (workoutId: string) => {
      const workout = data.workouts.find((w) => w.id === workoutId);
      if (!workout) throw new Error('Scheda non trovata');
      const session: Session = {
        id: uid(),
        workoutId,
        workoutName: workout.name,
        startedAt: new Date().toISOString(),
        entries: workout.exercises.map((e) => ({ exerciseId: e.id, sets: emptySets(e.sets) })),
        finished: false,
      };
      setData((d) => ({ ...d, sessions: [...d.sessions, session] }));
      return session;
    },
    [data.workouts],
  );

  const updateSet = useCallback((sessionId: string, exerciseId: string, index: number, patch: Partial<SetLog>) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const hasEntry = s.entries.some((e) => e.exerciseId === exerciseId);
        const entries = hasEntry ? s.entries : [...s.entries, { exerciseId, sets: [] }];
        return {
          ...s,
          entries: entries.map((e) => {
            if (e.exerciseId !== exerciseId) return e;
            const sets = [...e.sets];
            while (sets.length <= index) sets.push({ done: false });
            sets[index] = { ...sets[index], ...patch };
            return { ...e, sets };
          }),
        };
      }),
    }));
  }, []);

  const finishSession = useCallback((sessionId: string) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === sessionId ? { ...s, finished: true, finishedAt: s.finishedAt ?? new Date().toISOString() } : s,
      ),
    }));
  }, []);

  const setSessionTimes = useCallback((sessionId: string, startedAt: string, finishedAt?: string) => {
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === sessionId ? { ...s, startedAt, finishedAt } : s)) }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== sessionId) }));
  }, []);

  // Sostituzione esplicita (import backup / azzera): da qui si può tornare a salvare
  const replaceAll = useCallback((next: AppData) => {
    setData(next);
    setWritable(true);
    setProblem(undefined);
  }, []);

  const activeSession = useMemo(() => data.sessions.find((s) => !s.finished), [data.sessions]);

  const lastPerformance = useCallback(
    (workoutId: string, exerciseId: string, excludeSessionId?: string) => {
      const candidates = data.sessions
        .filter((s) => s.workoutId === workoutId && s.id !== excludeSessionId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      for (const s of candidates) {
        const entry = s.entries.find((e) => e.exerciseId === exerciseId);
        if (entry && entry.sets.some((set) => set.weight != null || set.reps != null)) {
          return { date: s.startedAt, sets: entry.sets };
        }
      }
      return undefined;
    },
    [data.sessions],
  );

  const value: Store = {
    data,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    startSession,
    updateSet,
    finishSession,
    setSessionTimes,
    deleteSession,
    replaceAll,
    activeSession,
    lastPerformance,
    problem,
    unreadableRaw: initial.unreadableRaw,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore deve essere usato dentro StoreProvider');
  return store;
}

export function newExercise(): Exercise {
  return { id: uid(), name: '', sets: 3, reps: '10', restSec: 90 };
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatRest(sec: number) {
  if (sec < 60) return `${sec}"`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}'${String(s).padStart(2, '0')}"` : `${m}'`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}'` : `${m}'`;
}

export function sessionDuration(s: Session, now = Date.now()) {
  const end = s.finishedAt ? Date.parse(s.finishedAt) : s.finished ? undefined : now;
  return end == null ? undefined : end - Date.parse(s.startedAt);
}
