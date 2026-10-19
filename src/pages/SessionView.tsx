import { useNavigate, useParams } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import { formatDate, useStore } from '../store';

export default function SessionView() {
  const { id } = useParams();
  const { data, updateSet, finishSession, deleteSession, lastPerformance } = useStore();
  const navigate = useNavigate();
  const session = data.sessions.find((s) => s.id === id);

  if (!session) return <p className="empty">Allenamento non trovato.</p>;

  const workout = data.workouts.find((w) => w.id === session.workoutId);
  if (!workout) return <p className="empty">La scheda di questo allenamento è stata eliminata.</p>;

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets, 0);
  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  const finish = () => {
    finishSession(session.id);
    navigate('/');
  };

  const cancel = () => {
    if (!confirm('Annullare questo allenamento? I pesi inseriti verranno eliminati.')) return;
    deleteSession(session.id);
    navigate('/');
  };

  return (
    <>
      <button className="back" onClick={() => navigate('/')}>
        ← Schede
      </button>
      <h1>{session.workoutName}</h1>
      <p className="muted">
        {formatDate(session.date)} · {doneSets}/{totalSets} serie fatte
        {session.finished ? ' · concluso' : ''}
      </p>
      <div className="progress">
        <div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
      </div>

      {workout.exercises.map((ex, i) => (
        <ExerciseCard
          key={ex.id}
          index={i}
          exercise={ex}
          sets={session.entries.find((e) => e.exerciseId === ex.id)?.sets ?? []}
          last={lastPerformance(session.workoutId, ex.id, session.id)}
          onSetChange={(setIndex, patch) => updateSet(session.id, ex.id, setIndex, patch)}
        />
      ))}

      {!session.finished && (
        <>
          <button className="btn primary block" onClick={finish}>
            Termina allenamento
          </button>
          <button className="btn block ghost danger" onClick={cancel}>
            Annulla allenamento
          </button>
        </>
      )}
    </>
  );
}
