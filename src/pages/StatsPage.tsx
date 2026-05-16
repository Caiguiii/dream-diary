import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { getDreams } from '../utils/storage';

const COLORS = ['#8EA8B8', '#8FAF9A', '#BFA07A', '#9B8FAA', '#B8A0A0', '#8AB0A8', '#C0B090'];

const tooltipStyle = {
  background: '#FAFAF8',
  border: '1px solid #E0DCD7',
  borderRadius: '12px',
  color: '#3A3835',
  boxShadow: '0 4px 16px rgba(58,56,53,0.08)',
  fontSize: '13px',
};

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
      <div className="py-20 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-morandi-muted text-sm">還沒有夢境資料可以統計</p>
        <p className="text-morandi-subtle text-xs mt-1">記錄幾個夢境後，這裡會出現統計圖表</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-xl font-semibold text-morandi-text">統計分析</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '總夢境數', value: dreams.length, icon: '🌙' },
          { label: '已分析', value: dreams.filter(d => d.analysis).length, icon: '🔮' },
          { label: '不同主題', value: new Set(dreams.flatMap(d => d.analysis?.themes ?? [])).size, icon: '🎯' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl bg-morandi-surface border border-morandi-border p-4 text-center shadow-morandi"
          >
            <div className="text-2xl mb-1.5">{stat.icon}</div>
            <div className="text-xl font-semibold text-morandi-text">{stat.value}</div>
            <div className="text-xs text-morandi-subtle mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Count */}
      {monthlyCount.length > 0 && (
        <StatCard title="每月夢境數量" icon="📅">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,53,0.06)" />
              <XAxis
                dataKey="month"
                stroke="rgba(58,56,53,0.25)"
                tick={{ fontSize: 11, fill: '#A4A09B' }}
              />
              <YAxis
                stroke="rgba(58,56,53,0.25)"
                tick={{ fontSize: 11, fill: '#A4A09B' }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#9B8FAA"
                strokeWidth={2}
                dot={{ fill: '#9B8FAA', r: 3 }}
                name="夢境數"
              />
            </LineChart>
          </ResponsiveContainer>
        </StatCard>
      )}

      {/* Emotion Frequency */}
      {emotionFreq.length > 0 && (
        <StatCard title="最常出現的情緒" icon="💫">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={emotionFreq} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,53,0.06)" horizontal={false} />
              <XAxis
                type="number"
                stroke="rgba(58,56,53,0.25)"
                tick={{ fontSize: 11, fill: '#A4A09B' }}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="rgba(58,56,53,0.25)"
                tick={{ fontSize: 11, fill: '#706D69' }}
                width={48}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="次數">
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
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themeFreq}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={66}
                    strokeWidth={0}
                  >
                    {themeFreq.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {themeFreq.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-morandi-muted">{t.name}</span>
                  <span className="text-morandi-subtle">×{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </StatCard>
      )}

      {/* Symbol Ranking */}
      {symbolFreq.length > 0 && (
        <StatCard title="象徵元素排行" icon="🌟">
          <div className="space-y-2.5">
            {symbolFreq.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-morandi-subtle text-xs w-4 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-morandi-muted text-xs w-16 shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-morandi-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / symbolFreq[0].count) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-morandi-subtle text-xs shrink-0">×{s.count}</span>
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
    <div className="rounded-2xl bg-morandi-surface border border-morandi-border p-5 shadow-morandi">
      <h2 className="text-xs font-medium text-morandi-subtle mb-4 flex items-center gap-2 uppercase tracking-wider">
        <span className="text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
