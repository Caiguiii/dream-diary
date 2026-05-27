import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams, deleteDream } from '../utils/storage';
import type { Dream } from '../types';

const DREAM_TYPES = ['日常', '奇幻', '驚悚', '懷舊', '浪漫', '冒險', '靈異', '其他'];
const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

export default function DiaryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [dreams, setDreams] = useState<Dream[]>(() => getDreams());

  const reload = () => setDreams(getDreams());

  const filtered = dreams
    .filter(d => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.mood.toLowerCase().includes(q) ||
        (d.analysis?.themes.some(t => t.includes(q)) ?? false) ||
        (d.analysis?.keywords.some(k => k.toLowerCase().includes(q)) ?? false);
      const matchesType = typeFilter === '全部' || d.dreamType === typeFilter;
      return matchesQuery && matchesType;
    })
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('確定要刪除這筆夢境紀錄嗎？')) {
      deleteDream(id);
      reload();
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-morandi-text">夢境日記</h1>
        <p className="text-morandi-muted text-sm mt-1">回顧你的每一場夢</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-morandi-subtle"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋夢境..."
          className="w-full glass-morandi rounded-2xl pl-10 pr-4 py-3 text-sm text-morandi-text placeholder-morandi-subtle focus:outline-none focus:border-morandi-accent/50 focus:ring-2 focus:ring-morandi-accent/10 transition-all shadow-morandi"
        />
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {['全部', ...DREAM_TYPES].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
              typeFilter === type
                ? 'bg-morandi-accent text-white font-medium shadow-morandi'
                : 'glass-morandi text-morandi-muted hover:text-morandi-accent hover:border-morandi-accent/40'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🌌</div>
          <p className="text-morandi-muted text-sm">
            {query || typeFilter !== '全部' ? '找不到符合的夢境' : '還沒有任何夢境記錄'}
          </p>
          {!query && typeFilter === '全部' && (
            <button
              onClick={() => navigate('/input')}
              className="mt-5 px-6 py-3 rounded-full bg-morandi-accent text-white text-sm font-medium hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]"
            >
              記錄第一個夢境
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dream => (
            <DreamCard
              key={dream.id}
              dream={dream}
              onClick={() => navigate(`/analysis/${dream.id}`)}
              onDelete={e => handleDelete(e, dream.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DreamCard({
  dream, onClick, onDelete,
}: {
  dream: Dream; onClick: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const topEmotions = dream.analysis?.emotions.slice(0, 2) ?? [];

  return (
    <div
      onClick={onClick}
      className="group glass-morandi rounded-2xl p-4 shadow-morandi hover:shadow-morandi-md transition-all cursor-pointer active:scale-[0.99]"
      style={{ borderColor: 'rgba(229,221,211,0.7)' }}
    >
      {/* Date + type badge row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-morandi-subtle text-xs">{dream.date}</span>
        <div className="flex items-center gap-2">
          {dream.dreamType && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-morandi-accent text-white font-medium">
              {dream.dreamType}
            </span>
          )}
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-morandi-subtle hover:text-morandi-error text-xs transition-all px-1.5 py-0.5 rounded-lg hover:bg-morandi-error/8"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-morandi-text font-semibold text-sm mb-1.5 truncate">
        {dream.title || '無題夢境'}
      </p>

      {/* Content preview */}
      <p className="text-morandi-subtle text-xs line-clamp-2 leading-relaxed mb-3">
        {dream.content}
      </p>

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        {dream.mood && <span className="text-xs">{dream.mood.split(' ')[0]}</span>}
        <span className="text-morandi-subtle text-xs">{CLARITY_LABEL[dream.clarity]}</span>
        {topEmotions.map(em => (
          <span key={em.name}
            className="text-xs px-2.5 py-0.5 rounded-full bg-morandi-warm text-morandi-accent border border-morandi-accent/20">
            {em.name}
          </span>
        ))}
      </div>
    </div>
  );
}
