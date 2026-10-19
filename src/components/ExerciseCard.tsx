import { formatDate, formatRest } from '../store';
import type { Exercise, SetLog } from '../types';
import SetRow from './SetRow';

interface Props {
  index: number;
  exercise: Exercise;
  sets: SetLog[];
  last?: { date: string; sets: SetLog[] };
  onSetChange: (index: number, patch: Partial<SetLog>) => void;
}

export default function ExerciseCard({ index, exercise, sets, last, onSetChange }: Props) {
  const rows = Array.from({ length: Math.max(exercise.sets, sets.length) }, (_, i) => sets[i] ?? { done: false });
  const allDone = rows.length > 0 && rows.every((s) => s.done);
  const lastSummary = last?.sets
    .filter((s) => s.weight != null || s.reps != null)
    .map((s) => `${s.weight != null ? String(s.weight).replace(".", ",") : "–"}×${s.reps ?? "–"}`)
    .join(' · ');

  return (
    <div className={`card exercise${allDone ? ' complete' : ''}`}>
      <div className="card-head">
        <div>
          <h2>
            {index + 1}. {exercise.name}
          </h2>
          <p className="target">
            <b>{exercise.sets}</b> serie × <b>{exercise.reps}</b> rip · recupero <b>{formatRest(exercise.restSec)}</b>
          </p>
        </div>
        {exercise.videoUrl && (
          <a className="btn small video" href={exercise.videoUrl} target="_blank" rel="noreferrer">
            ▶︎ Video
          </a>
        )}
      </div>

      {exercise.notes && <p className="notes">📝 {exercise.notes}</p>}
      {last && lastSummary && (
        <p className="last">
          Volta scorsa ({formatDate(last.date)}): <span>{lastSummary}</span>
        </p>
      )}

      {rows.map((s, i) => (
        <SetRow
          key={i}
          index={i}
          set={s}
          previous={last?.sets[i]}
          targetReps={exercise.reps}
          onChange={(patch) => onSetChange(i, patch)}
        />
      ))}
    </div>
  );
}
