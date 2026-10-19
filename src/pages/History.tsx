import { Link } from 'react-router-dom';
import { formatDate, useStore } from '../store';

export default function History() {
  const { data, deleteSession } = useStore();
  const sessions = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date));

  const exerciseName = (workoutId: string, exerciseId: string) =>
    data.workouts.find((w) => w.id === workoutId)?.exercises.find((e) => e.id === exerciseId)?.name ?? 'Esercizio eliminato';

  return (
    <>
      <h1>Storico</h1>
      {sessions.length === 0 && <p className="empty">Nessun allenamento registrato.</p>}
      {sessions.map((s) => (
        <details key={s.id} className="card">
          <summary className="card-head">
            <div>
              <h2>{s.workoutName}</h2>
              <p className="muted">
                {formatDate(s.date)}
                {s.finished ? '' : ' · in corso'}
              </p>
            </div>
          </summary>
          {s.entries
            .filter((e) => e.sets.some((x) => x.weight != null || x.reps != null))
            .map((e) => (
              <p key={e.exerciseId} className="history-line">
                <b>{exerciseName(s.workoutId, e.exerciseId)}</b>
                <span>
                  {e.sets
                    .filter((x) => x.weight != null || x.reps != null)
                    .map((x) => `${x.weight ?? '–'}kg×${x.reps ?? '–'}`)
                    .join(' · ')}
                </span>
              </p>
            ))}
          <div className="actions">
            <Link className="btn small" to={`/session/${s.id}`}>
              Apri / modifica
            </Link>
            <button
              className="btn small danger"
              onClick={() => confirm('Eliminare questo allenamento dallo storico?') && deleteSession(s.id)}
            >
              Elimina
            </button>
          </div>
        </details>
      ))}
    </>
  );
}
