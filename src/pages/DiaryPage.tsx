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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          夢境日記
        </h1>
        <span className="text-white/40 text-sm">{filtered.length} 則夢境</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋夢境內容、情緒、主題..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-4xl mb-3">🌌</div>
          <p>{query ? '找不到符合的夢境' : '還沒有任何夢境記錄'}</p>
          {!query && (
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm hover:from-blue-500 hover:to-purple-500 transition"
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
  dream: Dream;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const mainEmotion = dream.analysis?.emotions[0]?.name;
  const firstTheme = dream.analysis?.themes[0];

  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium truncate">{dream.title || '無題夢境'}</span>
            {dream.dreamType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 shrink-0">
                {dream.dreamType}
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm line-clamp-2 mb-2">{dream.content}</p>
          <div className="flex flex-wrap gap-2 text-xs text-white/40">
            <span>📅 {dream.date}</span>
            {dream.mood && <span>{dream.mood}</span>}
            <span>👁️ {CLARITY_LABEL[dream.clarity]}</span>
            {mainEmotion && <span className="text-purple-300">● {mainEmotion}</span>}
            {firstTheme && <span className="text-blue-300">#{firstTheme}</span>}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-xs transition shrink-0 pt-1"
        >
          刪除
        </button>
      </div>
    </div>
  );
}
