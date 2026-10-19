import { useRef } from 'react';
import { isAppData, useStore } from '../store';

export default function Settings() {
  const { data, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isAppData(parsed)) throw new Error();
      if (!confirm('Importando il backup sostituirai tutti i dati attuali. Continuare?')) return;
      replaceAll(parsed);
      alert('Backup importato.');
    } catch {
      alert('File non valido: serve un backup esportato da Gym Assistant.');
    }
  };

  const reset = () => {
    if (!confirm('Cancellare TUTTE le schede e lo storico? Esporta prima un backup se vuoi conservarli.')) return;
    replaceAll({ version: 1, workouts: [], sessions: [] });
  };

  return (
    <>
      <h1>Backup</h1>
      <p className="muted">
        I dati sono salvati solo su questo dispositivo. Esporta un backup ogni tanto (es. su iCloud Drive) per non perderli.
      </p>
      <div className="card">
        <p>
          {data.workouts.length} schede · {data.sessions.length} allenamenti registrati
        </p>
        <button className="btn primary block" onClick={exportData}>
          Esporta backup
        </button>
        <button className="btn block" onClick={() => fileRef.current?.click()}>
          Importa backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = '';
          }}
        />
      </div>
      <button className="btn block ghost danger" onClick={reset}>
        Cancella tutti i dati
      </button>
    </>
  );
}
