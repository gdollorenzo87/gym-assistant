export interface Exercise {
  id: string;
  name: string;
  sets: number;
  /** Testo libero, es. "8-10" o "12" */
  reps: string;
  restSec: number;
  notes?: string;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface SetLog {
  weight?: number;
  reps?: number;
  done: boolean;
}

export interface SessionEntry {
  exerciseId: string;
  sets: SetLog[];
}

export interface Session {
  id: string;
  workoutId: string;
  /** Nome della scheda al momento della sessione, per lo storico */
  workoutName: string;
  date: string;
  entries: SessionEntry[];
  finished: boolean;
}

export interface AppData {
  version: 1;
  workouts: Workout[];
  sessions: Session[];
}
