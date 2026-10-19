import { Link, useNavigate } from 'react-router-dom';
import { formatDate, useStore } from '../store';

export default function Home() {
  const { data, createWorkout, startSession, activeSession } = useStore();
  const navigate = useNavigate();

  const lastDate = (workoutId: string) =>
    data.sessions
      .filter((s) => s.workoutId === workoutId && s.finished)
      .map((s) => s.date)
      .sort()
      .pop();

  const addWorkout = () => {
    const letter = String.fromCharCode(65 + data.workouts.length);
    const w = createWorkout(`Scheda ${letter}`);
    navigate(`/workout/${w.id}/edit`);
  };

  const start = (workoutId: string) => {
    if (activeSession && !confirm('Hai un allenamento in corso. Vuoi iniziarne comunque uno nuovo?')) return;
    const s = startSession(workoutId);
    navigate(`/session/${s.id}`);
  };

  return (
    <>
      <h1>Le tue schede</h1>

      {activeSession && (
        <Link to={`/session/${activeSession.id}`} className="banner">
          <strong>Allenamento in corso</strong>
          <span>
            {activeSession.workoutName} · {formatDate(activeSession.date)} — Riprendi →
          </span>
        </Link>
      )}

      {data.workouts.length === 0 && (
        <p className="empty">Nessuna scheda ancora. Crea la tua prima scheda con gli esercizi della settimana.</p>
      )}

      {data.workouts.map((w) => {
        const last = lastDate(w.id);
        return (
          <div key={w.id} className="card">
            <div className="card-head">
              <div>
                <h2>{w.name}</h2>
                <p className="muted">
                  {w.exercises.length} esercizi{last ? ` · ultima volta ${formatDate(last)}` : ''}
                </p>
              </div>
              <Link to={`/workout/${w.id}/edit`} className="btn ghost small">
                Modifica
              </Link>
            </div>
            <button className="btn primary block" disabled={w.exercises.length === 0} onClick={() => start(w.id)}>
              Inizia allenamento
            </button>
          </div>
        );
      })}

      <button className="btn block" onClick={addWorkout}>
        + Nuova scheda
      </button>
    </>
  );
}
