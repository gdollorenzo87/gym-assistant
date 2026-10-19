import { useNavigate, useParams } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import { formatDate, formatDuration, formatTime, sessionDuration, useStore } from '../store';
import type { Session } from '../types';
import { useNow } from '../useNow';

const toTimeInput = (iso?: string) => (iso ? formatTime(iso) : '');

/** Applica un orario HH:MM al giorno di `baseIso`; se `after` è indicato e l'orario cade prima, passa al giorno dopo */
function withTime(baseIso: string, hhmm: string, after?: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseIso);
  d.setHours(h, m, 0, 0);
  if (after && d.getTime() < Date.parse(after)) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function SessionTimes({ session, onChange }: { session: Session; onChange: (startedAt: string, finishedAt?: string) => void }) {
  const setStart = (v: string) => {
    if (!v) return;
    const startedAt = withTime(session.startedAt, v);
    onChange(startedAt, session.finishedAt && Date.parse(session.finishedAt) < Date.parse(startedAt) ? undefined : session.finishedAt);
  };
  const setEnd = (v: string) => onChange(session.startedAt, v ? withTime(session.startedAt, v, session.startedAt) : undefined);
  return (
    <div className="card times">
      <label>
        Inizio
        <input type="time" value={toTimeInput(session.startedAt)} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label>
        Fine
        <input type="time" value={toTimeInput(session.finishedAt)} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <div className="times-total">
        Durata
        <b>{session.finishedAt ? formatDuration(sessionDuration(session) ?? 0) : '–'}</b>
      </div>
    </div>
  );
}

export default function SessionView() {
  const { id } = useParams();
  const { data, updateSet, finishSession, setSessionTimes, deleteSession, lastPerformance } = useStore();
  const navigate = useNavigate();
  const session = data.sessions.find((s) => s.id === id);
  const now = useNow(session && !session.finished ? 1000 : null);

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
        {formatDate(session.startedAt)} · {doneSets}/{totalSets} serie fatte
        {session.finished ? ' · concluso' : ''}
      </p>
      {!session.finished && (
        <p className="timer">
          ⏱ Iniziato alle {formatTime(session.startedAt)} · <b>{formatClock(now - Date.parse(session.startedAt))}</b>
        </p>
      )}
      {session.finished && <SessionTimes session={session} onChange={(a, b) => setSessionTimes(session.id, a, b)} />}
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

function formatClock(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
