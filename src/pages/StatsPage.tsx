import { useMemo, useState } from 'react';
import { getDreams } from '../utils/storage';

type Period = 'month' | 'week' | 'all';

const PERIOD_LABELS: Record<Period, string> = { month: '本月', week: '本週', all: '全部' };

export default function StatsPage() {
  const allDreams = useMemo(() => getDreams(), []);
  const [period, setPeriod] = useState<Period>('all');

  const dreams = useMemo(() => {
    const now = new Date();
    if (period === 'month') {
      const monthStr = now.toISOString().slice(0, 7);
      return allDreams.filter(d => d.date.startsWith(monthStr));
    }
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return allDreams.filter(d => new Date(d.date) >= weekAgo);
    }
    return allDreams;
  }, [allDreams, period]);

  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return allDreams.filter(d => new Date(d.date) >= weekAgo).length;
  }, [allDreams]);

  const clarityPct = useMemo(() => {
    if (dreams.length === 0) return 0;

    const clarityScore = {
      fuzzy: 20,
      normal: 60,
      clear: 100
    };

    const totalScore = dreams.reduce((sum, dream) => {
      return sum + clarityScore[dream.clarity];
    }, 0);

    return Math.round(totalScore / dreams.length);
  }, [dreams]);

  const emotionFreq = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dreams) {
      for (const e of d.analysis?.emotions ?? []) {
        map[e.name] = (map[e.name] ?? 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
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
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [dreams]);

  if (allDreams.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-morandi-muted text-sm">還沒有夢境資料可以統計</p>
        <p className="text-morandi-subtle text-xs mt-1">記錄幾個夢境後，這裡會出現統計圖表</p>
      </div>
    );
  }

  const maxEmotion = emotionFreq[0]?.count ?? 1;

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-morandi-text">夢境統計</h1>
        <p className="text-morandi-muted text-sm mt-1">探索你的夢境模式</p>
      </div>

      {/* Period filter tabs */}
      <div className="flex gap-1 bg-morandi-surface border border-morandi-border rounded-2xl p-1 shadow-morandi">
        {(['month', 'week', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm transition-all font-medium ${
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
        <StatCard value={String(dreams.length)} label="總夢境" />
        <StatCard value={String(thisWeekCount)} label="本週" />
        <StatCard value={`${clarityPct}%`} label="清晰度" accent />
      </div>

      {/* Emotion frequency */}
      {emotionFreq.length > 0 && (
        <Section title="常見情緒">
          <div className="space-y-4">
            {emotionFreq.map(e => (
              <div key={e.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-morandi-text text-sm">{e.name}</span>
                  <span className="text-morandi-muted text-xs">{e.count} 次</span>
                </div>
                <div className="h-2 bg-morandi-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-morandi-accent rounded-full transition-all duration-500"
                    style={{ width: `${(e.count / maxEmotion) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Symbol frequency */}
      {symbolFreq.length > 0 && (
        <Section title="常見象徵元素">
          <div className="divide-y divide-morandi-border">
            {symbolFreq.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-morandi-surface2 border border-morandi-border flex items-center justify-center text-morandi-muted text-xs font-medium shrink-0">
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
        </Section>
      )}
    </div>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="bg-morandi-surface rounded-2xl p-3 border border-morandi-border shadow-morandi text-center">
      <div className={`text-xl font-bold ${accent ? 'text-morandi-accent' : 'text-morandi-text'}`}>
        {value}
      </div>
      <div className="text-morandi-subtle text-xs mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-morandi-surface rounded-2xl p-4 border border-morandi-border shadow-morandi">
      <h2 className="text-morandi-text text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
