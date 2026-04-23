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
        <header className="sticky top-0 z-40 border-b-4 border-neo-black bg-white/90 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            {/* Logo */}
            <button
              type="button"
              onClick={() => setActiveTab('timer')}
              className="group flex shrink-0 items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center border-4 border-neo-black bg-neo-green shadow-hard-sm">
                <Sprout size={22} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <span className="hidden text-xl font-black sm:inline">Focus Forest</span>
            </button>

            {/* Tab navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-sm border-3 px-3 py-2 text-sm font-black transition-all ${
                      active
                        ? 'border-neo-black bg-neo-green shadow-hard-sm'
                        : 'border-transparent hover:border-neo-black hover:bg-neo-yellow/60'
                    }`}
                    aria-current={active ? 'page' : undefined}
                    title={label}
                  >
                    {createElement(Icon, { size: 16, strokeWidth: 2.5, 'aria-hidden': true })}
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* User profile */}
            <div className="flex shrink-0 items-center gap-2 border-3 border-neo-black bg-white px-3 py-2 shadow-hard-sm">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-7 w-7 rounded-full border-2 border-neo-black"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neo-green text-xs font-black border-2 border-neo-black">
                  {user.name?.charAt(0)}
                </div>
              )}
              <span className="hidden font-mono text-xs font-bold sm:inline">{user.name?.split(' ')[0]}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-0.5 flex items-center justify-center rounded p-1.5 transition-colors hover:bg-neo-red hover:text-white"
                title="Sign out"
              >
                <LogOut size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
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
