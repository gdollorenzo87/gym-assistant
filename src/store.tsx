import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Exercise, Session, SetLog, Workout } from './types';

const STORAGE_KEY = 'gym-assistant-data';

const emptyData = (): AppData => ({ version: 1, workouts: [], sessions: [] });

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function isAppData(value: unknown): value is AppData {
  const v = value as AppData;
  return !!v && v.version === 1 && Array.isArray(v.workouts) && Array.isArray(v.sessions);
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isAppData(parsed)) return parsed;
    }
  } catch {
    // dati corrotti o storage non disponibile: si riparte vuoti
  }
  return emptyData();
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
  deleteSession: (sessionId: string) => void;
  replaceAll: (data: AppData) => void;
  activeSession: Session | undefined;
  lastPerformance: (workoutId: string, exerciseId: string, excludeSessionId?: string) => { date: string; sets: SetLog[] } | undefined;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage pieno o non disponibile
    }
  }, [data]);

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
        date: new Date().toISOString(),
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
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === sessionId ? { ...s, finished: true } : s)) }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== sessionId) }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const activeSession = useMemo(() => data.sessions.find((s) => !s.finished), [data.sessions]);

  const lastPerformance = useCallback(
    (workoutId: string, exerciseId: string, excludeSessionId?: string) => {
      const candidates = data.sessions
        .filter((s) => s.workoutId === workoutId && s.id !== excludeSessionId)
        .sort((a, b) => b.date.localeCompare(a.date));
      for (const s of candidates) {
        const entry = s.entries.find((e) => e.exerciseId === exerciseId);
        if (entry && entry.sets.some((set) => set.weight != null || set.reps != null)) {
          return { date: s.date, sets: entry.sets };
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
    deleteSession,
    replaceAll,
    activeSession,
    lastPerformance,
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
