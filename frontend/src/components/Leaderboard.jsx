import { useEffect, useState } from 'react';
import { Trophy, Clock, Trees } from 'lucide-react';
import { useAuth } from './AuthContext';

import { API_URL } from '../config';

function formatMinutes(seconds) {
  const hrs = Math.floor((seconds || 0) / 3600);
  const mins = Math.round(((seconds || 0) % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

const RANK_STYLES = {
  1: 'bg-neo-yellow border-neo-black',
  2: 'bg-gray-200 border-neo-black',
  3: 'bg-amber-700/20 border-neo-black',
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="border-4 border-neo-black bg-white p-8 font-mono font-bold shadow-hard">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 border-4 border-neo-black bg-white p-6 shadow-hard-lg sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-sm font-bold text-forest">Rankings</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">Leaderboard</h1>
        </div>
        <div className="flex w-fit items-center gap-2 border-4 border-neo-black bg-neo-yellow px-4 py-3 font-mono text-sm font-bold">
          <Trophy size={18} strokeWidth={2.5} aria-hidden="true" />
          Top focusers
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="border-4 border-dashed border-neo-black bg-white p-12 text-center font-mono font-bold shadow-hard">
          No data yet. Complete a focus session to appear here!
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isCurrentUser = user && entry.name === user.name;
            const rankStyle = RANK_STYLES[entry.rank] || 'bg-white border-neo-black';

            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 border-4 p-4 shadow-hard transition-transform hover:-translate-y-0.5 ${rankStyle} ${
                  isCurrentUser ? 'ring-4 ring-forest ring-offset-2' : ''
                }`}
              >
                {/* Rank badge */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-neo-black bg-neo-black font-mono text-xl font-black text-white">
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                </div>

                {/* Avatar */}
                {entry.picture ? (
                  <img
                    src={entry.picture}
                    alt={entry.name}
                    className="h-10 w-10 shrink-0 rounded-full border-2 border-neo-black"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-neo-black bg-neo-green font-black">
                    {entry.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black">
                    {entry.name}
                    {isCurrentUser && (
                      <span className="ml-2 inline-block border-2 border-neo-black bg-neo-green px-2 py-0.5 font-mono text-xs font-bold">
                        YOU
                      </span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex shrink-0 gap-4">
                  <div className="flex items-center gap-1 font-mono text-sm font-bold">
                    <Clock size={16} strokeWidth={2.5} aria-hidden="true" />
                    {formatMinutes(entry.totalFocusTime)}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-sm font-bold">
                    <Trees size={16} strokeWidth={2.5} aria-hidden="true" />
                    {entry.totalTrees}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
