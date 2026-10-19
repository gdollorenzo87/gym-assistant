import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import WorkoutEditor from './pages/WorkoutEditor';
import SessionView from './pages/SessionView';
import History from './pages/History';
import Settings from './pages/Settings';
import { useStore } from './store';

export default function App() {
  const { problem } = useStore();
  return (
    <div className="app">
      <main className="content">
        {problem && <div className="alert">{problem}</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout/:id/edit" element={<WorkoutEditor />} />
          <Route path="/session/:id" element={<SessionView />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav className="tabbar">
        <NavLink to="/" end>
          <span aria-hidden>🏋️</span>Schede
        </NavLink>
        <NavLink to="/history">
          <span aria-hidden>📅</span>Storico
        </NavLink>
        <NavLink to="/settings">
          <span aria-hidden>⚙️</span>Backup
        </NavLink>
      </nav>
    </div>
  );
}
