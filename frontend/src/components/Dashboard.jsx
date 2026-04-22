import { useEffect, useState } from 'react';
import { createElement } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Target, Trees, XCircle } from 'lucide-react';

import { API_URL } from '../config';
const COLORS = ['#118A48', '#FBFF48', '#3B82F6', '#FF70A6'];

function formatMinutes(seconds) {
  return Math.round((seconds || 0) / 60);
}

function StatBlock({ label, value, Icon, accent = 'bg-white' }) {
  return (
    <div className={`border-4 border-neo-black ${accent} p-5 shadow-hard transition-transform hover:-translate-y-1`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-mono text-sm font-bold uppercase">{label}</p>
        {createElement(Icon, { size: 25, strokeWidth: 2.5, 'aria-hidden': true })}
      </div>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFocusTime: 0,
    totalTrees: 0,
    failedSessions: 0,
    dailyStats: [],
    categoryStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/analytics`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching analytics:', err);
        setLoading(false);
      });
  }, []);

  const barData = stats.dailyStats.map((item) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    Minutes: formatMinutes(item.duration),
  }));

  const pieData = stats.categoryStats.map((item) => ({
    name: item.category,
    value: item.count,
  }));

  const totalSessions = stats.totalTrees + stats.failedSessions;
  const successRate = totalSessions > 0 ? Math.round((stats.totalTrees / totalSessions) * 100) : 0;

  if (loading) {
    return (
      <div className="border-4 border-neo-black bg-white p-8 font-mono font-bold shadow-hard">
        Loading forest data...
      </div>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 border-4 border-neo-black bg-white p-6 shadow-hard-lg sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-sm font-bold text-forest">Analytics</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">Forest dashboard</h1>
        </div>
        <div className="flex w-fit items-center gap-2 border-4 border-neo-black bg-neo-yellow px-4 py-3 font-mono text-sm font-bold">
          <CheckCircle2 size={18} strokeWidth={2.5} aria-hidden="true" />
          {successRate}% success
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock label="Total focus" value={`${formatMinutes(stats.totalFocusTime)} min`} Icon={Clock} accent="bg-neo-green" />
        <StatBlock label="Trees grown" value={stats.totalTrees} Icon={Trees} accent="bg-white" />
        <StatBlock label="Failed sessions" value={stats.failedSessions} Icon={XCircle} accent="bg-neo-red text-white" />
        <StatBlock label="Success rate" value={`${successRate}%`} Icon={Target} accent="bg-neo-yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border-4 border-neo-black bg-white p-5 shadow-hard-lg sm:p-6">
          <div className="mb-6 border-b-4 border-neo-black pb-4">
            <h2 className="text-2xl font-black">Daily focus time</h2>
            <p className="mt-1 font-mono text-sm font-bold text-neutral-600">Minutes saved per day.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#121212', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#121212', fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: '#FFFDF5' }}
                  contentStyle={{ border: '4px solid #121212', boxShadow: '4px 4px 0 #121212', borderRadius: 0 }}
                />
                <Bar dataKey="Minutes" fill="#118A48" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-4 border-neo-black bg-white p-5 shadow-hard-lg sm:p-6">
          <div className="mb-6 border-b-4 border-neo-black pb-4">
            <h2 className="text-2xl font-black">Category split</h2>
            <p className="mt-1 font-mono text-sm font-bold text-neutral-600">Session count by category.</p>
          </div>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={58} outerRadius={98} paddingAngle={2} dataKey="value" stroke="#121212" strokeWidth={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ border: '4px solid #121212', boxShadow: '4px 4px 0 #121212', borderRadius: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border-4 border-dashed border-neo-black bg-neo-white p-6 text-center font-mono font-bold">
                No category data yet.
              </div>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 border-2 border-neo-black bg-neo-white px-3 py-2 font-mono text-sm font-bold">
                  <span className="h-4 w-4 border-2 border-neo-black" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
