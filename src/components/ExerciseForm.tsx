import type { Exercise } from '../types';

interface Props {
  exercise: Exercise;
  onChange: (e: Exercise) => void;
}

export default function ExerciseForm({ exercise, onChange }: Props) {
  const set = <K extends keyof Exercise>(key: K, value: Exercise[K]) => onChange({ ...exercise, [key]: value });
  const toInt = (v: string) => Math.max(0, parseInt(v, 10) || 0);

  return (
    <div className="form">
      <label>
        Esercizio
        <input value={exercise.name} placeholder="es. Panca piana" onChange={(e) => set('name', e.target.value)} />
      </label>
      <div className="row3">
        <label>
          Serie
          <input inputMode="numeric" value={exercise.sets || ''} onChange={(e) => set('sets', toInt(e.target.value))} />
        </label>
        <label>
          Ripetizioni
          <input value={exercise.reps} placeholder="8-10" onChange={(e) => set('reps', e.target.value)} />
        </label>
        <label>
          Recupero (s)
          <input inputMode="numeric" value={exercise.restSec || ''} onChange={(e) => set('restSec', toInt(e.target.value))} />
        </label>
      </div>
      <label>
        Link video YouTube
        <input
          type="url"
          inputMode="url"
          value={exercise.videoUrl ?? ''}
          placeholder="https://youtube.com/…"
          onChange={(e) => set('videoUrl', e.target.value || undefined)}
        />
      </label>
      <label>
        Note
        <textarea
          rows={2}
          value={exercise.notes ?? ''}
          placeholder="es. sedile al 4, presa larga"
          onChange={(e) => set('notes', e.target.value || undefined)}
        />
      </label>
    </div>
  );
}
