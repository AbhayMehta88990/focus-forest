import { useEffect, useState } from 'react';
import { CheckCircle2, CircleX } from 'lucide-react';

import { API_URL } from '../config';

function formatLength(seconds) {
  const minutes = Math.floor((seconds || 0) / 60);
  const remainingSeconds = (seconds || 0) % 60;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function StatusPill({ status }) {
  const completed = status === 'completed';
  const Icon = completed ? CheckCircle2 : CircleX;

  return (
    <span className={`inline-flex items-center gap-2 border-2 border-neo-black px-3 py-1 font-mono text-xs font-black ${
      completed ? 'bg-neo-green text-neo-black' : 'bg-neo-red text-white'
    }`}>
      <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
      {completed ? 'Completed' : 'Failed'}
    </span>
  );
}

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/sessions`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching sessions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="border-4 border-neo-black bg-white p-8 font-mono font-bold shadow-hard">
        Loading history...
      </div>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 border-4 border-neo-black bg-white p-6 shadow-hard-lg sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-sm font-bold text-forest">Your planted trees</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">Your Forest</h1>
        </div>
        <div className="w-fit border-4 border-neo-black bg-neo-yellow px-4 py-3 font-mono text-sm font-bold">
          {sessions.length} sessions
        </div>
      </div>

      <div className="overflow-hidden border-4 border-neo-black bg-white shadow-hard-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-neo-black bg-neo-black text-white">
                <th className="p-4 font-mono text-sm font-black uppercase">Date</th>
                <th className="p-4 font-mono text-sm font-black uppercase">Category</th>
                <th className="p-4 font-mono text-sm font-black uppercase">Duration</th>
                <th className="p-4 font-mono text-sm font-black uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center font-mono font-bold">
                    No sessions recorded yet.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const date = new Date(session.startTime);
                  return (
                    <tr key={session.id} className="border-b-4 border-neo-black transition-colors hover:bg-neo-yellow">
                      <td className="p-4 font-mono text-sm font-bold">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex border-2 border-neo-black bg-neo-white px-3 py-1 font-mono text-xs font-black">
                          {session.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm font-black">{formatLength(session.duration)}</td>
                      <td className="p-4">
                        <StatusPill status={session.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
