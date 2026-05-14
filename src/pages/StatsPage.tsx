import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { getDreams } from '../utils/storage';

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777'];

export default function StatsPage() {
  const dreams = useMemo(() => getDreams(), []);

  const emotionFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) {
      for (const e of d.analysis?.emotions ?? []) {
        map[e.name] = (map[e.name] ?? 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));
  }, [dreams]);

  const symbolFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) {
      for (const s of d.analysis?.symbols ?? []) {
        map[s.symbol] = (map[s.symbol] ?? 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [dreams]);

  const themeFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) {
      for (const t of d.analysis?.themes ?? []) {
        map[t] = (map[t] ?? 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [dreams]);

  const monthlyCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) {
      const month = d.date.slice(0, 7);
      map[month] = (map[month] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort()
      .slice(-6)
      .map(([month, count]) => ({ month: month.slice(5), count }));
  }, [dreams]);

  if (dreams.length === 0) {
    return (
      <div className="py-20 text-center text-white/40">
        <div className="text-4xl mb-3">📊</div>
        <p>還沒有夢境資料可以統計</p>
        <p className="text-sm mt-1">記錄幾個夢境後，這裡會出現統計圖表</p>
      </div>
    );
  }

  const tooltipStyle = {
    background: '#0d0d38',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
  };

  return (
    <div className="py-8 space-y-8">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        統計分析
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '總夢境數', value: dreams.length, icon: '🌙' },
          { label: '已分析', value: dreams.filter(d => d.analysis).length, icon: '🔮' },
          { label: '不同主題', value: new Set(dreams.flatMap(d => d.analysis?.themes ?? [])).size, icon: '🎯' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Count */}
      {monthlyCount.length > 0 && (
        <StatCard title="每月夢境數量" icon="📅">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} name="夢境數" />
            </LineChart>
          </ResponsiveContainer>
        </StatCard>
      )}

      {/* Emotion Frequency */}
      {emotionFreq.length > 0 && (
        <StatCard title="最常出現的情緒" icon="💫">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={emotionFreq} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="次數">
                {emotionFreq.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </StatCard>
      )}

      {/* Theme Pie */}
      {themeFreq.length > 0 && (
        <StatCard title="夢境主題分佈" icon="🎯">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={themeFreq} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {themeFreq.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3">
              {themeFreq.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/70">{t.name}</span>
                  <span className="text-white/30">×{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </StatCard>
      )}

      {/* Symbol Ranking */}
      {symbolFreq.length > 0 && (
        <StatCard title="象徵元素排行" icon="🌟">
          <div className="space-y-2">
            {symbolFreq.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-white/30 text-xs w-5 text-right">{i + 1}</span>
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-white/80 text-sm w-16 shrink-0">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / symbolFreq[0].count) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-white/40 text-xs shrink-0">×{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      )}
    </div>
  );
}

function StatCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
