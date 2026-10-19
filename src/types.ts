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
  /** Inizio sessione (ISO) */
  startedAt: string;
  /** Fine sessione (ISO), assente se in corso o se registrata prima della v2 */
  finishedAt?: string;
  entries: SessionEntry[];
  finished: boolean;
}

export const DATA_VERSION = 2;

export interface AppData {
  version: typeof DATA_VERSION;
  workouts: Workout[];
  sessions: Session[];
}
