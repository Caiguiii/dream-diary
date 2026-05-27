import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams, getCachedWeeklyReport, setCachedWeeklyReport } from '../utils/storage';
import { apiGetWeeklyReport, isApiConfigured } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { WeeklyReportData } from '../types';

// ── Date helpers ──────────────────────────────────────────────────────────────
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getWeekStart(offset = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  return localDateStr(d);
}
function getWeekEnd(start: string): string {
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return localDateStr(d);
}
function fmtWeek(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  return `${s.getMonth() + 1}月${s.getDate()}日 – ${e.getMonth() + 1}月${e.getDate()}日`;
}
function getWeekId(weekStart: string): string {
  const d = new Date(weekStart);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
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

// ── Loading animation ─────────────────────────────────────────────────────────
function StoryLoader() {
  return (
    <div className="glass-morandi rounded-2xl p-10 text-center shadow-morandi-md"
      style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-4xl mb-5 animate-float">🌙</div>
      <p className="text-morandi-muted text-sm mb-1.5 font-medium">AI 正在編寫你的夢境故事…</p>
      <p className="text-morandi-subtle text-xs">這可能需要 15–30 秒</p>
      <div className="flex gap-2 mt-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-morandi-accent animate-twinkle"
            style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Waiting screen (Mon–Sat of current week) ──────────────────────────────────
function WaitingScreen({ ws, we, daysLeft }: { ws: string; we: string; daysLeft: number }) {
  const navigate = useNavigate();
  const weekDreams = useMemo(() => getDreams().filter(d => d.date >= ws && d.date <= we), [ws, we]);
  const topEmotion = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of weekDreams) for (const e of d.analysis?.emotions ?? []) {
      map[e.name] = (map[e.name] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [weekDreams]);

  // const todayDay = new Date().getDay();
  const rawDay = new Date().getDay();

  const todayDay =
    rawDay === 0
      ? 6
      : rawDay - 1;
  const DAYS_ZH = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="glass-morandi rounded-2xl p-6 shadow-morandi-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-4 inline-block animate-float">🌒</div>
        <h3 className="font-bold text-base text-morandi-text mb-1">本週回顧即將解鎖</h3>
        <p className="text-morandi-subtle text-xs">
          再 {daysLeft} 天（週日）才能生成本週夢境週報
        </p>
      </div>

      {/* Week day progress */}
      <div className="flex gap-1.5 mb-6">
        {DAYS_ZH.map((label, i) => {
          const isPast = i < todayDay;
          const isToday = i === todayDay;
          const isSunEnd = i === 6;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-1 rounded-full transition-all"
                style={{
                  background: isSunEnd
                    ? 'rgba(196,129,90,0.25)'
                    : isPast || isToday
                    ? '#C4815A'
                    : 'rgba(196,129,90,0.12)',
                  opacity: isToday ? 1 : isPast ? 0.7 : 0.4,
                  boxShadow: isToday ? '0 0 6px rgba(196,129,90,0.4)' : 'none',
                }} />
              <span className="text-xs"
                style={{
                  color: isToday ? '#C4815A' : isSunEnd ? 'rgba(196,129,90,0.6)' : '#ADA39A',
                  fontWeight: isToday ? '600' : '400',
                }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Accumulation */}
      <div className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(196,129,90,0.05)', border: '1px solid rgba(196,129,90,0.12)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-morandi-muted">本週累積</span>
          {topEmotion && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-morandi-warm text-morandi-accent border border-morandi-accent/20 font-medium">
              {topEmotion}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-morandi-text">{weekDreams.length}</span>
          <span className="text-sm text-morandi-subtle mb-0.5">篇夢境</span>
        </div>
        {weekDreams.length === 0 && (
          <p className="text-xs text-morandi-subtle mt-1.5">還沒有記錄，趁週日前多記幾個夢吧</p>
        )}
      </div>

      {/* Locked button */}
      <button disabled
        className="w-full py-3.5 rounded-full text-sm font-medium opacity-40 cursor-not-allowed"
        style={{ background: 'rgba(196,129,90,0.10)', border: '1px solid rgba(196,129,90,0.2)', color: '#C4815A', letterSpacing: '0.06em' }}>
        🔒 週日才能生成週報
      </button>

      {weekDreams.length === 0 && (
        <button onClick={() => navigate('/input')}
          className="w-full mt-3 py-3 rounded-full text-sm text-morandi-subtle hover:text-morandi-muted glass-morandi transition-all">
          先去記錄夢境 ✍️
        </button>
      )}
    </div>
  );
}

// ── Sunday unlock screen ──────────────────────────────────────────────────────
function SundayUnlockScreen({ ws, we, onGenerate, loading }: {
  ws: string; we: string; onGenerate: () => void; loading: boolean;
}) {
  const weekDreams = useMemo(() => getDreams().filter(d => d.date >= ws && d.date <= we), [ws, we]);
  const navigate = useNavigate();

  if (weekDreams.length === 0) {
    return (
      <div className="glass-morandi rounded-2xl p-8 text-center shadow-morandi-md">
        <div className="text-4xl mb-4">🌑</div>
        <p className="text-morandi-muted text-sm mb-1">這週還沒有夢境紀錄</p>
        <p className="text-morandi-subtle text-xs mb-5">先記錄夢境，再來生成本週故事吧</p>
        <button onClick={() => navigate('/input')}
          className="px-6 py-2.5 rounded-full text-sm font-medium bg-morandi-accent text-white hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]">
          記錄夢境 ✨
        </button>
      </div>
    );
  }

  return (
    <div className="glass-morandi-strong rounded-2xl shadow-morandi-md overflow-hidden"
      style={{ border: '1px solid rgba(196,129,90,0.25)' }}>
      {/* Top accent stripe */}
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #C4815A, #C4A875, #C4815A, transparent)' }} />
      <div className="p-7 text-center">
        <div className="text-5xl mb-5 inline-block animate-float"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(196,129,90,0.25))' }}>
          🌙
        </div>
        <h3 className="font-bold text-lg text-morandi-text mb-1.5">本週回顧解鎖</h3>
        <p className="text-morandi-muted text-sm mb-1">
          本週共 <span className="text-morandi-accent font-semibold">{weekDreams.length} 篇</span> 夢境等待 AI 編織成故事
        </p>
        <p className="text-morandi-subtle text-xs mb-7">生成後將永久保存，無法重新生成</p>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full py-4 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
          style={{
            background: loading ? 'rgba(196,129,90,0.2)' : 'linear-gradient(135deg, #C4815A, #b8714e)',
            color: '#fff',
            letterSpacing: '0.08em',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(196,129,90,0.3)',
            border: 'none',
          }}>
          {loading ? 'AI 正在生成…' : '✨ 生成本週夢境週報'}
        </button>
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
  const weekId = useMemo(() => getWeekId(ws), [ws]);

  const today = new Date();
  const todayDow = today.getDay();
  const isCurrentWeek = offset === 0;
  const isSunday = todayDow === 0;
  const isLocked = isCurrentWeek && !isSunday;
  const daysUntilSunday = isCurrentWeek && !isSunday ? (7 - todayDow) % 7 : 0;

  useEffect(() => {
    setReport(null);
    setError('');
    const cached = getCachedWeeklyReport(ws);
    if (cached?.generated) { setReport(cached.reportData); return; }
    // Auto-load: past weeks always, current week only on Sunday (may already be generated in DynamoDB)
    const shouldAutoLoad = isApiConfigured() && isLoggedIn && (!isCurrentWeek || isSunday);
    if (shouldAutoLoad) {
      setLoading(true);
      apiGetWeeklyReport(ws).then(data => {
        if (data.dreamCount > 0 || !isCurrentWeek) {
          setCachedWeeklyReport(ws, { weekId, generated: true, generatedAt: new Date().toISOString(), reportData: data });
          setReport(data);
        }
      }).catch(() => {
        // silent — user can manually retry via button
      }).finally(() => setLoading(false));
    }
  }, [ws, isCurrentWeek, isSunday, isLoggedIn, weekId]);

  const generate = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      let data: WeeklyReportData;
      if (isApiConfigured() && isLoggedIn) {
        data = await apiGetWeeklyReport(ws);
      } else {
        data = buildLocal(ws, we);
      }
      setCachedWeeklyReport(ws, {
        weekId, generated: true,
        generatedAt: new Date().toISOString(),
        reportData: data,
      });
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失敗，請稍後再試');
      setReport(buildLocal(ws, we));
    } finally {
      setLoading(false);
    }
  }, [ws, we, weekId, isLoggedIn]);

  const cached = getCachedWeeklyReport(ws);
  const isGenerated = !!cached?.generated;

  return (
    <div className="py-4 space-y-4 page-enter">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-morandi-text">夢境週報</h1>
          <p className="text-morandi-muted text-sm mt-0.5">每週一頁，你的夢境小說</p>
        </div>
        {isCurrentWeek && !isSunday && (
          <span className="text-xs px-3 py-1.5 rounded-full shrink-0 mt-0.5 font-medium bg-morandi-warm text-morandi-accent border border-morandi-accent/20">
            週日解鎖
          </span>
        )}
        {isCurrentWeek && isSunday && !isGenerated && (
          <span className="text-xs px-3 py-1.5 rounded-full shrink-0 mt-0.5 font-medium bg-morandi-accent text-white shadow-morandi">
            ✨ 今日可生成
          </span>
        )}
      </div>

      {/* Week navigator */}
      <div className="glass-morandi flex items-center justify-between rounded-2xl px-4 py-3 shadow-morandi-md">
        <button onClick={() => setOffset(o => o - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-morandi-warm transition-all text-morandi-muted hover:text-morandi-accent text-xl font-light">
          ‹
        </button>
        <div className="text-center">
          <p className="text-morandi-text font-semibold text-sm">{weekLabel}</p>
          <p className="text-morandi-subtle text-xs mt-0.5">
            {offset === 0 ? '本週' : `${Math.abs(offset)} 週前`}
            {isGenerated ? ' · 已生成' : ''}
          </p>
        </div>
        <button onClick={() => setOffset(o => o + 1)} disabled={offset >= 0}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-morandi-warm transition-all text-morandi-muted hover:text-morandi-accent text-xl font-light disabled:opacity-25">
          ›
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="glass-morandi border border-morandi-error/25 rounded-2xl p-4 text-morandi-error text-sm text-center shadow-morandi">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && <StoryLoader />}

      {!loading && (
        <>
          {/* Report: has content */}
          {report && report.dreamCount > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <MiniStat value={String(report.dreamCount)} label="夢境數量" />
                <MiniStat value={report.topEmotions[0]?.name ?? '—'} label="主要情緒" small />
                <MiniStat value={report.topKeywords[0] ?? '—'} label="高頻詞" small />
              </div>

              {/* Story card */}
              {report.dreamStory ? (
                <div className="glass-morandi-strong rounded-2xl shadow-morandi-md overflow-hidden animate-fade-in"
                  style={{ border: '1px solid rgba(196,129,90,0.2)' }}>
                  {/* Top accent */}
                  <div className="h-0.5 w-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(196,129,90,0.6), rgba(196,168,117,0.8), rgba(196,129,90,0.6), transparent)' }} />

                  <div className="p-6">
                    {/* Story header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="text-2xl animate-float"
                        style={{ filter: 'drop-shadow(0 2px 8px rgba(196,129,90,0.2))' }}>
                        🌙
                      </div>
                      <div>
                        <p className="font-bold text-base text-morandi-text">本週夢境故事</p>
                        {report.moodSummary && (
                          <p className="text-xs mt-0.5 text-morandi-subtle">{report.moodSummary}</p>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-5"
                      style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,129,90,0.3), transparent)' }} />

                    {/* Story text */}
                    <p className="text-sm leading-[2.1] whitespace-pre-wrap text-morandi-muted"
                      style={{ fontFamily: "'PingFang TC', 'Noto Serif TC', 'Georgia', serif", letterSpacing: '0.04em' }}>
                      {report.dreamStory}
                    </p>

                    {/* Footer */}
                    <div className="mt-6 pt-4 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(229,221,211,0.8)' }}>
                      <span className="text-xs text-morandi-subtle">{weekLabel}</span>
                      <span className="text-xs text-morandi-subtle">
                        共 {report.dreamCount} 篇 · AI 生成 · {weekId}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-morandi rounded-2xl p-6 text-center shadow-morandi">
                  <p className="text-morandi-muted text-sm mb-1">
                    {isCognitoConfigured && !isLoggedIn ? '登入後可使用 AI 生成夢境故事' : '本週夢境故事尚未生成'}
                  </p>
                  {isCognitoConfigured && !isLoggedIn && (
                    <button onClick={() => navigate('/login')}
                      className="mt-3 px-5 py-2 rounded-full text-xs font-medium bg-morandi-accent text-white hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]">
                      登入帳號
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty: no dreams this week */}
          {report && report.dreamCount === 0 && (
            <div className="glass-morandi rounded-2xl p-8 text-center shadow-morandi-md">
              <div className="text-4xl mb-4">🌑</div>
              <p className="text-morandi-muted text-sm mb-1">這週沒有夢境紀錄</p>
              <p className="text-morandi-subtle text-xs mb-5">記錄夢境後，AI 會為你生成本週故事</p>
              <button onClick={() => navigate('/input')}
                className="px-6 py-2.5 rounded-full text-sm font-medium bg-morandi-accent text-white hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]">
                記錄夢境 ✨
              </button>
            </div>
          )}

          {/* Not generated yet */}
          {!report && !loading && (
            isLocked
              ? <WaitingScreen ws={ws} we={we} daysLeft={daysUntilSunday} />
              : isCurrentWeek && isSunday
              ? <SundayUnlockScreen ws={ws} we={we} onGenerate={generate} loading={loading} />
              : /* Past week */
                <div className="glass-morandi rounded-2xl p-7 text-center shadow-morandi-md">
                  <div className="text-4xl mb-4 animate-float">🌙</div>
                  <p className="text-morandi-muted text-sm mb-1">這週的夢境尚未整理</p>
                  <p className="text-morandi-subtle text-xs mb-6">生成後永久保存，不可重新生成</p>
                  <button onClick={generate}
                    className="px-8 py-3 rounded-full text-sm font-medium bg-morandi-accent text-white hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]">
                    生成這週的週報
                  </button>
                </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="glass-morandi rounded-2xl p-3 shadow-morandi-md text-center">
      <p className={`font-bold text-morandi-text truncate ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      <p className="text-morandi-subtle text-xs mt-0.5">{label}</p>
    </div>
  );
}
