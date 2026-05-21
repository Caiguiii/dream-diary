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
  d.setDate(d.getDate() - d.getDay()); // Sunday-based week
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { email, isLoggedIn, isCognitoConfigured } = useAuth();
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

  // Build 7-day grid for this week
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
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg;
  }, [weekGrid]);

  const recentDreams = useMemo(() => allDreams.slice(0, 3), [allDreams]);

  const totalCount = allDreams.length;
  const weekCount = weekDreams.length;

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
          {isLoggedIn && email ? email.split('@')[0] + ' 的夢境空間' : '我的夢境空間'}
        </h1>
      </div>

      {/* Weekly mood card */}
      <div className="bg-morandi-surface rounded-2xl p-4 border border-morandi-border shadow-morandi">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-morandi-text text-sm font-semibold">本週心情紀錄</h2>
          <span className="text-morandi-subtle text-xs">{moodLabel}</span>
        </div>

        {/* 7-day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekGrid.map(({ date, dateStr, dream, dayLabel }) => {
            const isToday = formatDate(new Date()) === dateStr;
            const moodScore = dream?.mood ? (MOOD_SCORE[dream.mood] ?? 3) : 0;
            const hasDream = !!dream;
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-morandi-subtle text-xs">{dayLabel}</span>
                <button
                  onClick={() => hasDream ? navigate(`/analysis/${dream!.id}`) : navigate('/input')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${
                    isToday
                      ? 'ring-2 ring-morandi-accent ring-offset-1 ring-offset-morandi-bg'
                      : ''
                  } ${
                    hasDream
                      ? moodScore >= 4
                        ? 'bg-morandi-accent text-white'
                        : moodScore >= 2
                        ? 'bg-morandi-warm border border-morandi-accent/30 text-morandi-accent'
                        : 'bg-morandi-surface2 border border-morandi-border text-morandi-muted'
                      : 'bg-morandi-bg border border-dashed border-morandi-border text-morandi-subtle hover:border-morandi-accent/40'
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
        <div className="flex gap-3 mt-4 pt-4 border-t border-morandi-border">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-text">{weekCount}</p>
            <p className="text-morandi-subtle text-xs">本週記錄</p>
          </div>
          <div className="w-px bg-morandi-border" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-text">{totalCount}</p>
            <p className="text-morandi-subtle text-xs">累計夢境</p>
          </div>
          <div className="w-px bg-morandi-border" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-morandi-accent">
              {weekCount > 0 ? Math.round((weekCount / 7) * 100) + '%' : '0%'}
            </p>
            <p className="text-morandi-subtle text-xs">本週完成率</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/input')}
          className="bg-morandi-accent text-white rounded-2xl p-4 text-left shadow-morandi hover:bg-morandi-accent/90 transition-all active:scale-[0.98]"
        >
          <div className="text-2xl mb-2">✍️</div>
          <p className="font-semibold text-sm">記錄夢境</p>
          <p className="text-white/70 text-xs mt-0.5">寫下今天的夢</p>
        </button>
        <button
          onClick={() => navigate('/weekly')}
          className="bg-morandi-surface border border-morandi-border rounded-2xl p-4 text-left shadow-morandi hover:border-morandi-accent/30 hover:shadow-morandi-md transition-all active:scale-[0.98]"
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
            className="mt-5 px-6 py-3 rounded-full bg-morandi-accent text-white text-sm font-medium hover:bg-morandi-accent/90 transition-all shadow-morandi"
          >
            記錄第一個夢境 ✨
          </button>
        </div>
      )}

      {/* Login prompt */}
      {isCognitoConfigured && !isLoggedIn && totalCount > 0 && (
        <div className="bg-morandi-warm border border-morandi-accent/20 rounded-2xl p-4 text-center">
          <p className="text-morandi-muted text-sm">登入後可同步到雲端，跨裝置存取你的夢境</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-3 px-5 py-2 rounded-full bg-morandi-accent text-white text-xs font-medium hover:bg-morandi-accent/90 transition-all"
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
      className="bg-morandi-surface rounded-2xl p-3.5 border border-morandi-border shadow-morandi hover:shadow-morandi-md hover:border-morandi-accent/30 transition-all cursor-pointer flex gap-3 items-start"
    >
      <div className="w-10 h-10 rounded-xl bg-morandi-warm border border-morandi-accent/20 flex items-center justify-center text-lg shrink-0">
        {dream.mood?.split(' ')[0] ?? '🌙'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-morandi-text text-sm font-semibold truncate">
          {dream.title || '無題夢境'}
        </p>
        <p className="text-morandi-subtle text-xs line-clamp-1 mt-0.5">
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
