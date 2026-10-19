import { useState } from 'react';
import type { SetLog } from '../types';

interface Props {
  index: number;
  set: SetLog;
  previous?: SetLog;
  targetReps: string;
  onChange: (patch: Partial<SetLog>) => void;
}

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

const fmt = (n?: number) => (n == null ? '' : String(n).replace('.', ','));

export default function SetRow({ index, set, previous, targetReps, onChange }: Props) {
  // Testo grezzo locale, così "22," resta scrivibile mentre si digita
  const [weight, setWeight] = useState(fmt(set.weight));
  const [reps, setReps] = useState(fmt(set.reps));

  const toggleDone = () => {
    if (set.done) return onChange({ done: false });
    // Spuntando una serie vuota si riprendono i valori della volta scorsa
    const patch: Partial<SetLog> = { done: true };
    if (set.weight == null && previous?.weight != null) {
      patch.weight = previous.weight;
      setWeight(fmt(previous.weight));
    }
    if (set.reps == null) {
      const r = previous?.reps ?? parseNum(targetReps);
      if (r != null) {
        patch.reps = r;
        setReps(fmt(r));
      }
    }
    onChange(patch);
  };

  return (
    <div className={`set-row${set.done ? ' done' : ''}`}>
      <span className="set-num">{index + 1}</span>
      <label className="set-field">
        <input
          inputMode="decimal"
          value={weight}
          placeholder={fmt(previous?.weight) || '–'}
          onChange={(e) => {
            setWeight(e.target.value);
            onChange({ weight: parseNum(e.target.value) });
          }}
        />
        <span>kg</span>
      </label>
      <label className="set-field">
        <input
          inputMode="numeric"
          value={reps}
          placeholder={fmt(previous?.reps) || targetReps}
          onChange={(e) => {
            setReps(e.target.value);
            onChange({ reps: parseNum(e.target.value) });
          }}
        />
        <span>rep</span>
      </label>
      <button className="check" onClick={toggleDone} aria-label={set.done ? 'Segna come non fatta' : 'Segna come fatta'}>
        ✓
      </button>
    </div>
  );
}
