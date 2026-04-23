import { createElement, useState } from 'react';
import { BarChart3, LogOut, Sprout, Timer, Trophy, Trees, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import TimerComponent from './components/Timer';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Leaderboard from './components/Leaderboard';
import StudyTogether from './components/StudyTogether';
import LofiPlayer from './components/LofiPlayer';

const tabs = [
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'forest', label: 'Your Forest', icon: Trees },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'study', label: 'Study Together', icon: Users },
];

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neo-white font-display">
        <div className="fixed inset-0 neo-grid pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 border-4 border-neo-black bg-white px-8 py-6 font-mono text-lg font-bold shadow-hard">
          Loading Focus Forest...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-neo-white text-neo-black font-display">
      <div className="fixed inset-0 neo-grid pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-40 bg-transparent">
          <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setActiveTab('timer')}
              className="group flex w-fit items-center gap-3 border-4 border-neo-black bg-white px-4 py-3 shadow-hard transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              <Sprout size={30} strokeWidth={2.5} aria-hidden="true" />
              <span className="text-2xl font-black">Focus Forest</span>
            </button>

            <div className="flex w-fit max-w-full items-center gap-3">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex h-12 w-12 min-w-0 items-center justify-center gap-2 border-4 border-neo-black px-0 py-3 text-sm font-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:h-auto sm:w-auto sm:px-4 ${
                      active ? 'bg-neo-green text-neo-black' : 'bg-white hover:bg-neo-yellow'
                    }`}
                    aria-current={active ? 'page' : undefined}
                    title={label}
                  >
                    {createElement(Icon, { size: 18, strokeWidth: 2.5, 'aria-hidden': true })}
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}

              {/* User profile */}
              <div className="ml-2 flex items-center gap-2 border-4 border-neo-black bg-white px-3 py-2 shadow-hard-sm">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-7 w-7 rounded-full border border-neo-black"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neo-green text-xs font-black border border-neo-black">
                    {user.name?.charAt(0)}
                  </div>
                )}
                <span className="hidden font-mono text-xs font-bold sm:inline">{user.name?.split(' ')[0]}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="ml-1 flex items-center justify-center rounded p-1 transition-colors hover:bg-neo-red hover:text-white"
                  title="Sign out"
                >
                  <LogOut size={14} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {activeTab === 'timer' && (
            <>
              <TimerComponent />
              <LofiPlayer />
            </>
          )}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'forest' && <History />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'study' && <StudyTogether />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
