import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExerciseForm from '../components/ExerciseForm';
import { formatRest, newExercise, useStore } from '../store';
import type { Exercise } from '../types';

export default function WorkoutEditor() {
  const { id } = useParams();
  const { data, updateWorkout, deleteWorkout } = useStore();
  const navigate = useNavigate();
  const workout = data.workouts.find((w) => w.id === id);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!workout) return <p className="empty">Scheda non trovata.</p>;

  const setExercises = (exercises: Exercise[]) => updateWorkout({ ...workout, exercises });

  const add = () => {
    const ex = newExercise();
    setExercises([...workout.exercises, ex]);
    setOpenId(ex.id);
  };

  const move = (index: number, dir: -1 | 1) => {
    const list = [...workout.exercises];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setExercises(list);
  };

  const remove = (ex: Exercise) => {
    if (!confirm(`Eliminare "${ex.name || 'esercizio'}"?`)) return;
    setExercises(workout.exercises.filter((e) => e.id !== ex.id));
  };

  const removeWorkout = () => {
    if (!confirm(`Eliminare la scheda "${workout.name}"? Lo storico delle sessioni resta.`)) return;
    deleteWorkout(workout.id);
    navigate('/');
  };

  return (
    <>
      <button className="back" onClick={() => navigate('/')}>
        ← Schede
      </button>
      <input
        className="title-input"
        value={workout.name}
        aria-label="Nome scheda"
        onChange={(e) => updateWorkout({ ...workout, name: e.target.value })}
      />

      {workout.exercises.map((ex, i) => {
        const open = openId === ex.id;
        return (
          <div key={ex.id} className="card">
            <div className="card-head" onClick={() => setOpenId(open ? null : ex.id)}>
              <div>
                <h2>
                  {i + 1}. {ex.name || <em className="muted">Nuovo esercizio</em>}
                </h2>
                <p className="muted">
                  {ex.sets} × {ex.reps} · rec. {formatRest(ex.restSec)}
                  {ex.videoUrl ? ' · ▶︎ video' : ''}
                </p>
              </div>
              <span className="chevron">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
              <>
                <ExerciseForm
                  exercise={ex}
                  onChange={(next) => setExercises(workout.exercises.map((e) => (e.id === ex.id ? next : e)))}
                />
                <div className="actions">
                  <button className="btn small" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button className="btn small" onClick={() => move(i, 1)} disabled={i === workout.exercises.length - 1}>
                    ↓
                  </button>
                  <button className="btn small danger" onClick={() => remove(ex)}>
                    Elimina
                  </button>
                  <button className="btn small primary" onClick={() => setOpenId(null)}>
                    Fatto
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <button className="btn block" onClick={add}>
        + Aggiungi esercizio
      </button>
      <button className="btn block danger ghost" onClick={removeWorkout}>
        Elimina scheda
      </button>
    </>
  );
}
