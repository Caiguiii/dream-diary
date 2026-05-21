import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams, getCachedWeeklyReport, setCachedWeeklyReport } from '../utils/storage';
import { apiGetWeeklyReport, isApiConfigured } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { WeeklyReportData } from '../types';

function getWeekStart(offset = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(start: string): string {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`;
}

function buildLocalReport(weekStart: string, weekEnd: string): WeeklyReportData {
  const dreams = getDreams().filter(d => d.date >= weekStart && d.date <= weekEnd);
  const emotionMap: Record<string, number> = {};
  const kwFreq: Record<string, number> = {};
  const typeMap: Record<string, number> = {};

  for (const d of dreams) {
    for (const em of d.analysis?.emotions ?? []) {
      emotionMap[em.name] = (emotionMap[em.name] ?? 0) + 1;
    }
    for (const kw of d.analysis?.keywords ?? []) {
      kwFreq[kw] = (kwFreq[kw] ?? 0) + 1;
    }
    if (d.dreamType) typeMap[d.dreamType] = (typeMap[d.dreamType] ?? 0) + 1;
  }

  return {
    weekStart,
    weekEnd,
    dreamCount: dreams.length,
    topEmotions: Object.entries(emotionMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    topKeywords: Object.entries(kwFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([kw]) => kw),
    dreamTypeCounts: Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
    moodSummary: '',
    dreamStory: '',
    generatedAt: new Date().toISOString(),
  };
}

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isCognitoConfigured } = useAuth();

  const [weekOffset, setWeekOffset] = useState(0);
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekLabel(weekStart, weekEnd), [weekStart, weekEnd]);
  const isCurrentWeek = weekOffset === 0;

  const loadReport = useCallback(async () => {
    setError('');

    // Try cache first
    const cached = getCachedWeeklyReport(weekStart) as WeeklyReportData | null;
    if (cached) {
      setReport(cached);
      return;
    }

    setLoading(true);
    try {
      if (isApiConfigured() && isLoggedIn) {
        const data = await apiGetWeeklyReport(weekStart);
        setReport(data);
        setCachedWeeklyReport(weekStart, data);
      } else {
        // Local fallback — no AI story
        const local = buildLocalReport(weekStart, weekEnd);
        setReport(local);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
      // Fallback to local
      const local = buildLocalReport(weekStart, weekEnd);
      setReport(local);
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, isLoggedIn]);

  useEffect(() => {
    setReport(null);
    loadReport();
  }, [loadReport]);

  const handleRefresh = async () => {
    // Clear cache and reload
    localStorage.removeItem(`dream-weekly-${weekStart}`);
    setReport(null);
    await loadReport();
  };

  const canGoNext = weekOffset < 0;

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-morandi-text">夢境週報</h1>
          <p className="text-morandi-muted text-sm mt-0.5">AI 生成你的夢境故事</p>
        </div>
        {report && !loading && (
          <button
            onClick={handleRefresh}
            className="text-morandi-subtle hover:text-morandi-accent text-xs border border-morandi-border px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            ↻ 重新生成
          </button>
        )}
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between bg-morandi-surface border border-morandi-border rounded-2xl px-4 py-3 shadow-morandi">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="text-morandi-subtle hover:text-morandi-accent transition-colors p-1"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-morandi-text font-semibold text-sm">{weekLabel}</p>
          <p className="text-morandi-subtle text-xs mt-0.5">
            {isCurrentWeek ? '本週' : `${Math.abs(weekOffset)} 週前`}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={!canGoNext}
          className="text-morandi-subtle hover:text-morandi-accent transition-colors p-1 disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 space-y-3">
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-morandi-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-morandi-muted text-sm">AI 正在編寫你的夢境故事…</p>
          <p className="text-morandi-subtle text-xs">這可能需要 10-20 秒</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-morandi-error/10 border border-morandi-error/25 rounded-2xl p-4 text-morandi-error text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* No dreams */}
      {!loading && report && report.dreamCount === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌑</div>
          <p className="text-morandi-muted text-sm font-medium">這週還沒有夢境紀錄</p>
          <p className="text-morandi-subtle text-xs mt-1">記錄夢境後，AI 會為你生成本週故事</p>
          <button
            onClick={() => navigate('/input')}
            className="mt-5 px-6 py-3 rounded-full bg-morandi-accent text-white text-sm font-medium hover:bg-morandi-accent/90 transition-all"
          >
            記錄夢境 ✨
          </button>
        </div>
      )}

      {/* Report content */}
      {!loading && report && report.dreamCount > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={String(report.dreamCount)} label="夢境數量" />
            <StatCard value={String(report.topEmotions[0]?.name ?? '—')} label="主要情緒" small />
            <StatCard value={String(report.topKeywords[0] ?? '—')} label="高頻關鍵字" small />
          </div>

          {/* Dream story — main feature */}
          {report.dreamStory ? (
            <div className="relative bg-gradient-to-br from-morandi-warm to-morandi-surface border border-morandi-accent/20 rounded-2xl p-5 shadow-morandi-md overflow-hidden">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-morandi-accent/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-morandi-accent/5 rounded-full translate-y-6 -translate-x-6 pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌙</span>
                  <h2 className="text-morandi-text font-bold text-base">本週夢境故事</h2>
                </div>
                {report.moodSummary && (
                  <p className="text-morandi-accent text-xs mb-4 italic">{report.moodSummary}</p>
                )}
                <p className="text-morandi-text text-sm leading-relaxed whitespace-pre-wrap">
                  {report.dreamStory}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-morandi-surface border border-morandi-border rounded-2xl p-5 text-center shadow-morandi">
              <p className="text-morandi-muted text-sm">
                {isCognitoConfigured && !isLoggedIn
                  ? '登入後可使用 AI 生成夢境故事'
                  : '本週夢境故事尚未生成'}
              </p>
              {isCognitoConfigured && !isLoggedIn && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-3 px-5 py-2 rounded-full bg-morandi-accent text-white text-xs font-medium hover:bg-morandi-accent/90 transition-all"
                >
                  登入帳號
                </button>
              )}
            </div>
          )}

          {/* Emotions */}
          {report.topEmotions.length > 0 && (
            <Section title="本週情緒分佈">
              <div className="space-y-3">
                {report.topEmotions.map((em, i) => (
                  <div key={em.name} className="flex items-center gap-3">
                    <span className="text-morandi-muted text-xs w-4 shrink-0">{i + 1}</span>
                    <span className="text-morandi-text text-sm flex-1">{em.name}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: em.count }).map((_, j) => (
                        <div key={j} className="w-2 h-2 rounded-full bg-morandi-accent" />
                      ))}
                    </div>
                    <span className="text-morandi-subtle text-xs w-8 text-right">{em.count}次</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Keywords */}
          {report.topKeywords.length > 0 && (
            <Section title="本週關鍵詞">
              <div className="flex flex-wrap gap-2">
                {report.topKeywords.map((kw, i) => (
                  <span
                    key={kw}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      i === 0
                        ? 'bg-morandi-accent text-white border-morandi-accent'
                        : i < 3
                        ? 'bg-morandi-warm text-morandi-accent border-morandi-accent/30'
                        : 'bg-morandi-surface text-morandi-muted border-morandi-border'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Dream types */}
          {report.dreamTypeCounts.length > 0 && (
            <Section title="夢境類型">
              <div className="flex flex-wrap gap-2">
                {report.dreamTypeCounts.map(tc => (
                  <div key={tc.type} className="flex items-center gap-1.5 bg-morandi-bg px-3 py-1.5 rounded-full border border-morandi-border">
                    <span className="text-morandi-text text-xs font-medium">{tc.type}</span>
                    <span className="text-morandi-subtle text-xs">{tc.count}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="bg-morandi-surface rounded-2xl p-3 border border-morandi-border shadow-morandi text-center">
      <div className={`font-bold text-morandi-text ${small ? 'text-sm' : 'text-xl'} truncate`}>
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
