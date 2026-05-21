import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams, getCachedWeeklyReport, setCachedWeeklyReport } from '../utils/storage';
import { apiGetWeeklyReport, isApiConfigured } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { WeeklyReportData } from '../types';

// ── Date helpers ──────────────────────────────────────────────────────────────
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
function fmtWeek(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  return `${s.getMonth() + 1}月${s.getDate()}日 – ${e.getMonth() + 1}月${e.getDate()}日`;
}

// ── Local fallback ────────────────────────────────────────────────────────────
function buildLocal(ws: string, we: string): WeeklyReportData {
  const dreams = getDreams().filter(d => d.date >= ws && d.date <= we);
  const em: Record<string, number> = {};
  const kw: Record<string, number> = {};
  const tp: Record<string, number> = {};
  for (const d of dreams) {
    for (const e of d.analysis?.emotions ?? []) em[e.name] = (em[e.name] ?? 0) + 1;
    for (const k of d.analysis?.keywords ?? []) kw[k] = (kw[k] ?? 0) + 1;
    if (d.dreamType) tp[d.dreamType] = (tp[d.dreamType] ?? 0) + 1;
  }
  return {
    weekStart: ws, weekEnd: we,
    dreamCount: dreams.length,
    topEmotions: Object.entries(em).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
    topKeywords: Object.entries(kw).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
    dreamTypeCounts: Object.entries(tp).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    moodSummary: '', dreamStory: '', generatedAt: new Date().toISOString(),
  };
}

// ── Floating particles decoration ─────────────────────────────────────────────
function StoryParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${10 + (i * 7.3) % 80}%`,
            top: `${20 + (i * 4.7) % 60}%`,
            width: `${1 + (i % 3) * 0.8}px`,
            height: `${1 + (i % 3) * 0.8}px`,
            background: i % 3 === 0 ? 'rgba(196,168,117,0.7)' : 'rgba(255,255,255,0.25)',
            animation: `float ${8 + (i % 5) * 2}s ${(i % 4) * 0.7}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Loading animation ─────────────────────────────────────────────────────────
function StoryLoader() {
  return (
    <div
      className="relative rounded-3xl p-8 overflow-hidden text-center"
      style={{
        background: 'linear-gradient(160deg, #0e0f20 0%, #15112e 60%, #0e0f20 100%)',
        border: '1px solid rgba(196,168,117,0.15)',
        minHeight: '260px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <StoryParticles />
      <div
        className="relative z-10 text-5xl mb-6 animate-float"
        style={{ filter: 'drop-shadow(0 0 20px rgba(196,168,117,0.5))' }}
      >
        🌙
      </div>
      <p className="relative z-10 text-sm mb-1" style={{ color: '#c4a875' }}>
        AI 正在編寫你的夢境故事…
      </p>
      <p className="relative z-10 text-xs" style={{ color: '#5a5672' }}>
        這可能需要 15-20 秒
      </p>
      <div className="relative z-10 flex gap-2 mt-5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-twinkle"
            style={{ background: '#c4a875', animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isCognitoConfigured } = useAuth();

  const [offset, setOffset] = useState(0);
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ws = useMemo(() => getWeekStart(offset), [offset]);
  const we = useMemo(() => getWeekEnd(ws), [ws]);
  const weekLabel = useMemo(() => fmtWeek(ws, we), [ws, we]);

  const load = useCallback(async () => {
    setError('');
    const cached = getCachedWeeklyReport(ws) as WeeklyReportData | null;
    if (cached) { setReport(cached); return; }

    setLoading(true);
    try {
      if (isApiConfigured() && isLoggedIn) {
        const data = await apiGetWeeklyReport(ws);
        setReport(data);
        setCachedWeeklyReport(ws, data);
      } else {
        setReport(buildLocal(ws, we));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
      setReport(buildLocal(ws, we));
    } finally {
      setLoading(false);
    }
  }, [ws, we, isLoggedIn]);

  useEffect(() => { setReport(null); load(); }, [load]);

  const handleRefresh = () => {
    localStorage.removeItem(`dream-weekly-${ws}`);
    setReport(null);
    load();
  };

  return (
    <div className="py-4 space-y-4 page-enter">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-morandi-text">夢境週報</h1>
          <p className="text-morandi-muted text-sm mt-0.5">每週一頁，你的夢境小說</p>
        </div>
        {report && !loading && report.dreamCount > 0 && (
          <button
            onClick={handleRefresh}
            className="text-morandi-subtle hover:text-morandi-accent text-xs border border-morandi-border px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0 mt-1"
          >
            ↻ 重生成
          </button>
        )}
      </div>

      {/* Week navigator */}
      <div className="glass-morandi flex items-center justify-between rounded-2xl px-4 py-3 shadow-morandi">
        <button
          onClick={() => setOffset(o => o - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-morandi-warm transition-colors text-morandi-muted hover:text-morandi-accent text-lg"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-morandi-text font-semibold text-sm">{weekLabel}</p>
          <p className="text-morandi-subtle text-xs mt-0.5">
            {offset === 0 ? '本週' : `${Math.abs(offset)} 週前`}
          </p>
        </div>
        <button
          onClick={() => setOffset(o => o + 1)}
          disabled={offset >= 0}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-morandi-warm transition-colors text-morandi-muted hover:text-morandi-accent text-lg disabled:opacity-25"
        >
          ›
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-morandi-error/10 border border-morandi-error/25 rounded-2xl p-4 text-morandi-error text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Loading story card */}
      {loading && <StoryLoader />}

      {/* Empty state */}
      {!loading && report?.dreamCount === 0 && (
        <div
          className="relative rounded-3xl p-8 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0e0f20, #15112e, #0e0f20)',
            border: '1px solid rgba(196,168,117,0.12)',
          }}
        >
          <StoryParticles />
          <div className="relative z-10">
            <div className="text-4xl mb-4">🌑</div>
            <p className="text-sm mb-1" style={{ color: '#8a86a8' }}>這週還沒有夢境紀錄</p>
            <p className="text-xs mb-5" style={{ color: '#5a5672' }}>記錄夢境後，AI 會為你生成本週故事</p>
            <button
              onClick={() => navigate('/input')}
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(196,168,117,0.2), rgba(196,129,90,0.28))',
                border: '1px solid rgba(196,168,117,0.35)',
                color: '#e8d5a0',
              }}
            >
              記錄夢境 ✨
            </button>
          </div>
        </div>
      )}

      {/* Report content */}
      {!loading && report && report.dreamCount > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat value={String(report.dreamCount)} label="夢境數量" />
            <MiniStat value={report.topEmotions[0]?.name ?? '—'} label="主要情緒" small />
            <MiniStat value={report.topKeywords[0] ?? '—'} label="高頻詞" small />
          </div>

          {/* Dream story card — main feature */}
          {report.dreamStory ? (
            <div
              className="relative rounded-3xl overflow-hidden shadow-dream animate-fade-in"
              style={{
                background: 'linear-gradient(160deg, #0a0c1e 0%, #141128 45%, #1a1535 80%, #0a0c1e 100%)',
                border: '1px solid rgba(196,168,117,0.18)',
              }}
            >
              {/* Star particles */}
              <StoryParticles />

              {/* Nebula glow top-right */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(130,60,220,0.15) 0%, transparent 65%)' }}
              />
              {/* Gold glow bottom-left */}
              <div
                className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(196,168,117,0.1) 0%, transparent 65%)' }}
              />

              <div className="relative z-10 p-6">
                {/* Story header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="text-3xl animate-float"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(196,168,117,0.5))' }}
                  >
                    🌙
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: '#e8d5a0' }}>
                      本週夢境故事
                    </p>
                    {report.moodSummary && (
                      <p className="text-xs mt-0.5" style={{ color: '#8a86a8' }}>
                        {report.moodSummary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div
                  className="mb-5"
                  style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,168,117,0.35), transparent)' }}
                />

                {/* Story text */}
                <p
                  className="text-sm leading-[2] whitespace-pre-wrap"
                  style={{
                    color: '#d4cce8',
                    fontFamily: "'PingFang TC', 'Noto Serif TC', 'Georgia', serif",
                    letterSpacing: '0.04em',
                  }}
                >
                  {report.dreamStory}
                </p>

                {/* Footer */}
                <div
                  className="mt-6 pt-4 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xs" style={{ color: '#5a5672' }}>
                    {weekLabel}
                  </span>
                  <span className="text-xs" style={{ color: '#5a5672' }}>
                    共 {report.dreamCount} 篇夢境 · AI 生成
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="relative rounded-3xl p-6 text-center"
              style={{
                background: 'linear-gradient(160deg, #0e0f20, #15112e)',
                border: '1px solid rgba(196,168,117,0.10)',
              }}
            >
              <p className="text-sm mb-1" style={{ color: '#8a86a8' }}>
                {isCognitoConfigured && !isLoggedIn
                  ? '登入後可使用 AI 生成夢境故事'
                  : '本週夢境故事尚未生成'}
              </p>
              {isCognitoConfigured && !isLoggedIn && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-3 px-5 py-2 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(196,168,117,0.2)',
                    border: '1px solid rgba(196,168,117,0.3)',
                    color: '#c4a875',
                  }}
                >
                  登入帳號
                </button>
              )}
            </div>
          )}

          {/* Emotions */}
          {report.topEmotions.length > 0 && (
            <GlassCard title="本週情緒分佈">
              <div className="space-y-3">
                {report.topEmotions.map((em, i) => (
                  <div key={em.name} className="flex items-center gap-3">
                    <span className="text-morandi-subtle text-xs w-4 shrink-0 text-right">{i + 1}</span>
                    <span className="text-morandi-text text-sm flex-1">{em.name}</span>
                    <div className="flex gap-1 items-center">
                      {Array.from({ length: em.count }).map((_, j) => (
                        <div key={j} className="w-2 h-2 rounded-full bg-morandi-accent opacity-80" />
                      ))}
                    </div>
                    <span className="text-morandi-subtle text-xs w-7 text-right shrink-0">{em.count}次</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Keywords */}
          {report.topKeywords.length > 0 && (
            <GlassCard title="本週關鍵詞">
              <div className="flex flex-wrap gap-2">
                {report.topKeywords.map((kw, i) => (
                  <span
                    key={kw}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={i === 0
                      ? { background: '#C4815A', color: '#fff', borderColor: '#C4815A' }
                      : i < 3
                      ? { background: 'rgba(196,129,90,0.12)', color: '#C4815A', borderColor: 'rgba(196,129,90,0.3)' }
                      : { background: 'rgba(237,232,222,0.6)', color: '#786E66', borderColor: '#E5DDD3' }
                    }
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Dream types */}
          {report.dreamTypeCounts.length > 0 && (
            <GlassCard title="夢境類型">
              <div className="flex flex-wrap gap-2">
                {report.dreamTypeCounts.map(tc => (
                  <div
                    key={tc.type}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-morandi-border bg-morandi-bg"
                  >
                    <span className="text-morandi-text text-xs font-medium">{tc.type}</span>
                    <span className="text-morandi-subtle text-xs">{tc.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="glass-morandi rounded-2xl p-3 shadow-morandi text-center">
      <p className={`font-bold text-morandi-text truncate ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      <p className="text-morandi-subtle text-xs mt-0.5">{label}</p>
    </div>
  );
}

function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-morandi rounded-2xl p-4 shadow-morandi">
      <h2 className="text-morandi-text text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
