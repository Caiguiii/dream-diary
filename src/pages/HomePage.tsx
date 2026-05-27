import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import type { Dream } from '../types';

const MOOD_SCORE: Record<string, number> = {
  '😊 愉快': 5, '😌 平靜': 4, '😲 驚訝': 3, '😐 茫然': 2,
  '😰 緊張': 2, '😢 悲傷': 1, '😨 害怕': 1,
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getWeekStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { email, nickname, isLoggedIn, isCognitoConfigured } = useAuth();
  const allDreams = useMemo(() => getDreams(), []);

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const weekDreams = useMemo(() => {
    const start = formatDate(weekStart);
    const end = formatDate(weekEnd);
    return allDreams.filter(d => d.date >= start && d.date <= end);
  }, [allDreams, weekStart, weekEnd]);

  const weekGrid = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      const dream = weekDreams.find(dr => dr.date === dateStr);
      return { date: d, dateStr, dream, dayLabel: WEEKDAYS[d.getDay()] };
    });
  }, [weekStart, weekDreams]);

  const moodTrend = useMemo(() => {
    const scores = weekGrid
      .filter(g => g.dream?.mood)
      .map(g => MOOD_SCORE[g.dream!.mood] ?? 3);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [weekGrid]);

  const recentDreams = useMemo(() => allDreams.slice(0, 3), [allDreams]);
  const todayStr = formatDate(new Date());
  const todayEntry = useMemo(() => weekGrid.find(g => g.dateStr === todayStr), [weekGrid, todayStr]);

  const totalCount = allDreams.length;
  const weekCount = weekDreams.length;
  const weekDays = useMemo(() => new Set(weekDreams.map(d => d.date)).size, [weekDreams]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了，還記得剛才的夢嗎？';
    if (h < 12) return '早安，今天醒來記得哪些夢境？';
    if (h < 18) return '下午好，昨晚的夢還留著嗎？';
    return '晚上好，今晚會做什麼夢呢？';
  }, []);

  const moodLabel = moodTrend === null
    ? '尚無紀錄'
    : moodTrend >= 4 ? '😊 本週心情不錯'
    : moodTrend >= 3 ? '😌 本週平靜穩定'
    : moodTrend >= 2 ? '😐 本週有些低落'
    : '😨 本週情緒較複雜';

  return (
    <div className="py-4 space-y-5">

      {/* Greeting */}
      <div>
        <p className="text-morandi-subtle text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold text-morandi-text mt-1">
          {isLoggedIn && (nickname || email) ? (nickname || email!.split('@')[0]) + ' 的夢境空間' : '我的夢境空間'}
        </h1>
      </div>

      {/* Weekly mood card */}
      <div className="glass-morandi rounded-2xl p-4 shadow-morandi-md">
        <div className="flex items-center gap-3 mb-4 pb-3.5" style={{ borderBottom: '1px solid rgba(229,221,211,0.55)' }}>
          <div className="text-4xl leading-none select-none">
            {todayEntry?.dream?.mood?.split(' ')[0] ?? '🌙'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-morandi-text text-sm font-semibold">今日心情</h2>
            <p className="text-morandi-subtle text-xs mt-0.5 truncate">
              {todayEntry?.dream?.mood?.split(' ')[1]
                ? todayEntry.dream!.mood.split(' ')[1]
                : '尚未記錄今日夢境'}
            </p>
          </div>
          <span className="text-morandi-subtle text-xs shrink-0">{moodLabel}</span>
        </div>

        {/* 7-day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekGrid.map(({ date, dateStr, dream, dayLabel }) => {
            const isToday = formatDate(new Date()) === dateStr;
            const hasDream = !!dream;
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-morandi-subtle text-xs">{dayLabel}</span>
                <button
                  onClick={() => hasDream ? navigate(`/analysis/${dream!.id}`) : navigate('/input')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all active:scale-95 ${
                    isToday ? 'ring-2 ring-morandi-accent ring-offset-2 ring-offset-white' : ''
                  } ${
                    hasDream
                      ? 'bg-morandi-warm border border-morandi-accent/30 text-morandi-accent shadow-morandi'
                      : 'bg-morandi-bg border border-dashed border-morandi-border/70 text-morandi-subtle hover:border-morandi-accent/40 hover:bg-morandi-warm'
                  }`}
                >
                  {hasDream ? (dream!.mood?.split(' ')[0] ?? '🌙') : date.getDate()}
                </button>
                <span className="text-morandi-subtle text-xs">{date.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-morandi-border/60">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-text">{weekCount}</p>
            <p className="text-morandi-subtle text-xs">本週記錄</p>
          </div>
          <div className="w-px bg-morandi-border/60" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-text">{totalCount}</p>
            <p className="text-morandi-subtle text-xs">累計夢境</p>
          </div>
          <div className="w-px bg-morandi-border/60" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-accent">
              {weekDays}<span className="text-sm font-medium text-morandi-subtle">/7</span>
            </p>
            <p className="text-morandi-subtle text-xs">本週天數</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/input')}
          className="rounded-2xl p-4 text-left shadow-morandi-md transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #C4815A, #b8714e)',
            boxShadow: '0 4px 20px rgba(196,129,90,0.28)',
          }}
        >
          <div className="text-2xl mb-2">✍️</div>
          <p className="font-semibold text-sm text-white">記錄夢境</p>
          <p className="text-white/65 text-xs mt-0.5">寫下今天的夢</p>
        </button>
        <button
          onClick={() => navigate('/weekly')}
          className="glass-morandi rounded-2xl p-4 text-left shadow-morandi-md hover:shadow-morandi transition-all active:scale-[0.97]"
          style={{ border: '1px solid rgba(196,168,117,0.25)' }}
        >
          <div className="text-2xl mb-2">📖</div>
          <p className="font-semibold text-sm text-morandi-text">夢境週報</p>
          <p className="text-morandi-subtle text-xs mt-0.5">AI 生成本週故事</p>
        </button>
      </div>

      {/* Recent dreams */}
      {recentDreams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-morandi-text text-sm font-semibold">最近夢境</h2>
            <button
              onClick={() => navigate('/diary')}
              className="text-morandi-subtle text-xs hover:text-morandi-accent transition-colors"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-2.5">
            {recentDreams.map(dream => (
              <RecentDreamCard
                key={dream.id}
                dream={dream}
                onClick={() => navigate(`/analysis/${dream.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">🌙</div>
          <p className="text-morandi-muted text-sm font-medium">開始記錄你的第一個夢境吧</p>
          <p className="text-morandi-subtle text-xs mt-1">每個夢境都是靈魂的低語</p>
          <button
            onClick={() => navigate('/input')}
            className="mt-5 px-6 py-3 rounded-full bg-morandi-accent text-white text-sm font-medium hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]"
          >
            記錄第一個夢境 ✨
          </button>
        </div>
      )}

      {/* Login prompt */}
      {isCognitoConfigured && !isLoggedIn && totalCount > 0 && (
        <div
          className="glass-morandi rounded-2xl p-4 text-center shadow-morandi"
          style={{ border: '1px solid rgba(196,168,117,0.2)' }}
        >
          <p className="text-morandi-muted text-sm">登入後可同步到雲端，跨裝置存取你的夢境</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-3 px-5 py-2 rounded-full bg-morandi-accent text-white text-xs font-medium hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]"
          >
            登入帳號
          </button>
        </div>
      )}
    </div>
  );
}

function RecentDreamCard({ dream, onClick }: { dream: Dream; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass-morandi rounded-2xl p-3.5 shadow-morandi hover:shadow-morandi-md transition-all cursor-pointer flex gap-3 items-start active:scale-[0.99]"
      style={{ borderColor: 'rgba(229,221,211,0.7)' }}
    >
      <div className="w-10 h-10 rounded-xl bg-morandi-warm border border-morandi-accent/15 flex items-center justify-center text-lg shrink-0">
        {dream.mood?.split(' ')[0] ?? '🌙'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-morandi-text text-sm font-semibold truncate">
          {dream.title || '無題夢境'}
        </p>
        <p className="text-morandi-subtle text-xs line-clamp-1 mt-0.5 leading-relaxed">
          {dream.content}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-morandi-subtle text-xs">{dream.date}</span>
          {dream.dreamType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-morandi-accent text-white font-medium">
              {dream.dreamType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
