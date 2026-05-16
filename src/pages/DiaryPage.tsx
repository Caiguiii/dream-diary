import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDreams, deleteDream } from '../utils/storage';
import type { Dream } from '../types';

const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

export default function DiaryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dreams, setDreams] = useState<Dream[]>(() => getDreams());

  const reload = () => setDreams(getDreams());

  const filtered = dreams.filter(d => {
    const q = query.toLowerCase();
    return (
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.mood.toLowerCase().includes(q) ||
      (d.analysis?.themes.some(t => t.includes(q)) ?? false) ||
      (d.analysis?.keywords.some(k => k.toLowerCase().includes(q)) ?? false)
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('確定要刪除這筆夢境紀錄嗎？')) {
      deleteDream(id);
      reload();
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-morandi-text">夢境日記</h1>
        <span className="text-morandi-subtle text-xs">{filtered.length} 則夢境</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-morandi-subtle text-sm">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋夢境內容、情緒、主題..."
          className="w-full bg-morandi-surface border border-morandi-border rounded-2xl pl-10 pr-4 py-3 text-sm text-morandi-text placeholder-morandi-subtle focus:outline-none focus:border-morandi-purple/40 focus:ring-2 focus:ring-morandi-purple/8 transition-all shadow-morandi"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-morandi-subtle">
          <div className="text-4xl mb-3">🌌</div>
          <p className="text-morandi-muted text-sm">
            {query ? '找不到符合的夢境' : '還沒有任何夢境記錄'}
          </p>
          {!query && (
            <button
              onClick={() => navigate('/')}
              className="mt-5 px-6 py-2.5 rounded-2xl bg-morandi-text text-white text-sm font-medium hover:bg-morandi-text/90 transition-all shadow-morandi"
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
  dream,
  onClick,
  onDelete,
}: {
  dream: Dream;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const mainEmotion = dream.analysis?.emotions[0]?.name;
  const firstTheme = dream.analysis?.themes[0];

  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-2xl bg-morandi-surface border border-morandi-border hover:border-morandi-purple/30 hover:shadow-morandi-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-morandi-text font-medium text-sm truncate">
              {dream.title || '無題夢境'}
            </span>
            {dream.dreamType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-morandi-purple/10 text-morandi-purple border border-morandi-purple/15 shrink-0">
                {dream.dreamType}
              </span>
            )}
          </div>
          <p className="text-morandi-subtle text-xs line-clamp-2 mb-2.5 leading-relaxed">
            {dream.content}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-morandi-subtle">
            <span>{dream.date}</span>
            {dream.mood && <span>{dream.mood}</span>}
            <span>{CLARITY_LABEL[dream.clarity]}</span>
            {mainEmotion && (
              <span className="text-morandi-purple">● {mainEmotion}</span>
            )}
            {firstTheme && (
              <span className="text-morandi-blue">#{firstTheme}</span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-morandi-subtle hover:text-morandi-error text-xs transition-all shrink-0 pt-0.5 px-2 py-1 rounded-lg hover:bg-morandi-error/8"
        >
          刪除
        </button>
      </div>
    </div>
  );
}
