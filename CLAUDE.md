# Gym Assistant

PWA (Vite + React + TS) pubblicata su GitHub Pages ad ogni push su `main`. I dati dell'utente vivono solo nel `localStorage` del suo telefono (chiave `gym-assistant-data`).

## Regola fondamentale: non perdere mai dati
- Ogni modifica alla struttura dei dati (`src/types.ts`) deve incrementare `DATA_VERSION` e aggiungere uno step in `src/migrations.ts` che converte la versione precedente **senza scartare informazioni**. Campi nuovi: opzionali o derivati dai vecchi.
- Non rimuovere né rinominare la chiave `gym-assistant-data`, e non cambiare `base`/percorso di pubblicazione (cambierebbe l'origine e il localStorage).
- `load()` in `src/store.tsx` non deve mai sovrascrivere dati che non riesce a leggere: in quel caso l'app va in sola lettura.
- Prima di pubblicare una migrazione, provarla in locale con dati della versione precedente.
