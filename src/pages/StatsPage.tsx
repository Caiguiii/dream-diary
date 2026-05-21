import { useMemo, useState } from 'react';
import { getDreams } from '../utils/storage';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell,
  PieChart, Pie,
} from 'recharts';

type Period = 'week' | 'month' | 'all';
const PERIOD_LABELS: Record<Period, string> = { week: '本週', month: '本月', all: '全部' };

const MOOD_SCORE: Record<string, number> = {
  '😊 愉快': 5, '😌 平靜': 4, '😲 驚訝': 3,
  '😐 茫然': 2, '😰 緊張': 2, '😢 悲傷': 1, '😨 害怕': 1,
};

const CHART_COLORS = ['#C4815A', '#8b6fc4', '#5a9cc4', '#c4a875', '#7ab89c', '#c47a7a'];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function GlassTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-morandi rounded-xl px-3 py-2 text-xs shadow-morandi-md">
      {label && <p className="text-morandi-muted mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-morandi-text font-medium">{p.name ? `${p.name}: ` : ''}{p.value}</p>
      ))}
    </div>
  );
}

// ── Weekly trend data ─────────────────────────────────────────────────────────
function useWeeklyTrend(allDreams: ReturnType<typeof getDreams>) {
  return useMemo(() => {
    const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dream = allDreams.find(dr => dr.date === dateStr);
      const score = dream?.mood ? (MOOD_SCORE[dream.mood] ?? null) : null;
      return { day: DAYS[d.getDay()], date: dateStr, score, hasDream: !!dream };
    });
  }, [allDreams]);
}

export default function StatsPage() {
  const allDreams = useMemo(() => getDreams(), []);
  const [period, setPeriod] = useState<Period>('all');

  const dreams = useMemo(() => {
    const now = new Date();
    if (period === 'month') {
      const m = now.toISOString().slice(0, 7);
      return allDreams.filter(d => d.date.startsWith(m));
    }
    if (period === 'week') {
      const ago = new Date(now.getTime() - 7 * 86400000);
      return allDreams.filter(d => new Date(d.date) >= ago);
    }
    return allDreams;
  }, [allDreams, period]);

  const weekTrend = useWeeklyTrend(allDreams);

  const thisWeekCount = useMemo(() => {
    const ago = new Date(Date.now() - 7 * 86400000);
    return allDreams.filter(d => new Date(d.date) >= ago).length;
  }, [allDreams]);

  const clarityPct = useMemo(() => {
    if (!dreams.length) return 0;
    const score = { fuzzy: 20, normal: 60, clear: 100 };
    return Math.round(dreams.reduce((s, d) => s + score[d.clarity], 0) / dreams.length);
  }, [dreams]);

  const emotionFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) for (const e of d.analysis?.emotions ?? []) {
      map[e.name] = (map[e.name] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [dreams]);

  const symbolFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) for (const s of d.analysis?.symbols ?? []) {
      map[s.symbol] = (map[s.symbol] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [dreams]);

  const dreamTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) if (d.dreamType) map[d.dreamType] = (map[d.dreamType] ?? 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [dreams]);

  const maxEmotion = emotionFreq[0]?.count ?? 1;

  if (allDreams.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-morandi-muted text-sm">還沒有夢境資料可以統計</p>
        <p className="text-morandi-subtle text-xs mt-1">記錄幾個夢境後，這裡會出現統計圖表</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 page-enter">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-morandi-text">夢境統計</h1>
          <p className="text-morandi-muted text-sm mt-0.5">探索你的夢境模式與情緒旅程</p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 glass-morandi rounded-2xl p-1 shadow-morandi">
        {(['week', 'month', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p
                ? 'bg-morandi-accent text-white shadow-morandi'
                : 'text-morandi-muted hover:text-morandi-text'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <GlassStatCard value={String(dreams.length)} label="夢境總數" />
        <GlassStatCard value={String(thisWeekCount)} label="本週" />
        <GlassStatCard value={`${clarityPct}%`} label="清晰度" accent />
      </div>

      {/* Weekly mood trend */}
      <div className="glass-morandi rounded-2xl p-4 shadow-morandi-md">
        <h2 className="text-morandi-text text-sm font-semibold mb-1">本週情緒趨勢</h2>
        <p className="text-morandi-subtle text-xs mb-4">每日心情分數（1–5）</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#ADA39A' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 10, fill: '#ADA39A' }}
                axisLine={false}
                tickLine={false}
                ticks={[1, 3, 5]}
              />
              <Tooltip content={<GlassTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#C4815A"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.score == null) return <g key={`dot-${cx}`} />;
                  return (
                    <circle
                      key={`dot-${cx}`}
                      cx={cx} cy={cy} r={4}
                      fill="#C4815A"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
                connectNulls={false}
                activeDot={{ r: 6, fill: '#C4815A', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Day labels with dream indicators */}
        <div className="flex justify-around mt-1">
          {weekTrend.map(d => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${d.hasDream ? 'bg-morandi-accent' : 'bg-morandi-border'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Emotion frequency bar chart */}
      {emotionFreq.length > 0 && (
        <div className="glass-morandi rounded-2xl p-4 shadow-morandi">
          <h2 className="text-morandi-text text-sm font-semibold mb-4">常見情緒</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionFreq} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#ADA39A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#ADA39A' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {emotionFreq.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dream type distribution */}
      {dreamTypeData.length > 0 && (
        <div className="glass-morandi rounded-2xl p-4 shadow-morandi">
          <h2 className="text-morandi-text text-sm font-semibold mb-4">夢境類型分佈</h2>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dreamTypeData}
                    cx="50%" cy="50%"
                    innerRadius={24} outerRadius={52}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {dreamTypeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.9} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {dreamTypeData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-morandi-text text-xs flex-1 truncate">{item.name}</span>
                  <span className="text-morandi-subtle text-xs">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Common emotions manual bars (detailed) */}
      {emotionFreq.length > 0 && (
        <div className="glass-morandi rounded-2xl p-4 shadow-morandi">
          <h2 className="text-morandi-text text-sm font-semibold mb-4">情緒詳細分析</h2>
          <div className="space-y-4">
            {emotionFreq.map((e, i) => (
              <div key={e.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-morandi-text text-sm">{e.name}</span>
                  </div>
                  <span className="text-morandi-muted text-xs">{e.count} 次</span>
                </div>
                <div className="h-1.5 bg-morandi-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full animate-data-load"
                    style={{
                      width: `${(e.count / maxEmotion) * 100}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common symbols */}
      {symbolFreq.length > 0 && (
        <div className="glass-morandi rounded-2xl p-4 shadow-morandi">
          <h2 className="text-morandi-text text-sm font-semibold mb-4">常見象徵元素</h2>
          <div className="divide-y divide-morandi-border/60">
            {symbolFreq.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.85 }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-morandi-text text-sm">{s.name}</span>
                </div>
                <span className="text-xs px-2.5 py-1 bg-morandi-warm text-morandi-accent rounded-full font-medium border border-morandi-accent/20">
                  {s.count} 次
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GlassStatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="glass-morandi rounded-2xl p-3 shadow-morandi text-center">
      <div className={`text-xl font-bold ${accent ? 'text-morandi-accent' : 'text-morandi-text'}`}>
        {value}
      </div>
      <div className="text-morandi-subtle text-xs mt-0.5">{label}</div>
    </div>
  );
}
