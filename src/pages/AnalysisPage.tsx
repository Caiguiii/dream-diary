import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDream, deleteDream, saveDream } from '../utils/storage';
import { apiGenerateTitle, isApiConfigured } from '../utils/api';

const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dreamData = id ? getDream(id) : undefined;

  const [dream, setDream] = useState(dreamData);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(dream?.title ?? '');
  const [regenLoading, setRegenLoading] = useState(false);

  if (!dream) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl mb-4">😶‍🌫️</div>
        <p className="text-morandi-muted text-sm">找不到這個夢境紀錄</p>
        <button onClick={() => navigate('/input')} className={btnClass + ' mt-6'}>
          回首頁
        </button>
      </div>
    );
  }

  const { analysis } = dream;

  const handleDelete = () => {
    if (confirm('確定要刪除這筆夢境紀錄嗎？')) {
      deleteDream(dream.id);
      navigate('/diary');
    }
  };

  const handleSaveTitle = async (newTitle: string) => {
    setEditingTitle(false);
    if (!newTitle.trim() || newTitle === dream.title) return;
    const updated = { ...dream, title: newTitle.trim() };
    setDream(updated);
    await saveDream(updated);
  };

  const handleRegenTitle = async () => {
    if (!isApiConfigured()) return;
    setRegenLoading(true);
    try {
      const newTitle = await apiGenerateTitle(dream.content, dream.mood, dream.dreamType);
      setTitleDraft(newTitle);
      const updated = { ...dream, title: newTitle };
      setDream(updated);
      await saveDream(updated);
    } catch {
      // keep existing
    } finally {
      setRegenLoading(false);
    }
  };

  const maxEmotion = analysis?.emotions[0]?.percentage ?? 100;

  return (
    <div className="py-4 space-y-4 page-enter">

      {/* Back header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/diary')}
          className="flex items-center gap-1 text-morandi-muted text-sm hover:text-morandi-text transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          分析結果
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-morandi-subtle hover:text-morandi-error transition-colors px-2 py-1 rounded-lg hover:bg-morandi-error/8"
        >
          刪除
        </button>
      </div>

      {/* Dream title & meta */}
      <div>
        <div className="flex items-start gap-2">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={() => handleSaveTitle(titleDraft)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTitle(titleDraft);
                if (e.key === 'Escape') { setTitleDraft(dream.title); setEditingTitle(false); }
              }}
              className="flex-1 text-xl font-bold text-morandi-text bg-transparent border-b-2 border-morandi-accent outline-none pb-0.5"
            />
          ) : (
            <h1
              className="flex-1 text-xl font-bold text-morandi-text cursor-pointer hover:text-morandi-accent/80 transition-colors"
              onClick={() => { setTitleDraft(dream.title); setEditingTitle(true); }}
              title="點擊編輯標題"
            >
              {dream.title || '無題夢境'}
            </h1>
          )}

          {isApiConfigured() && !editingTitle && (
            <button
              onClick={handleRegenTitle}
              disabled={regenLoading}
              title="重新生成標題"
              className="shrink-0 mt-0.5 text-morandi-subtle hover:text-morandi-accent text-xs glass-morandi px-2 py-1 rounded-full transition-all disabled:opacity-40 flex items-center gap-1 shadow-morandi"
            >
              {regenLoading ? <Spinner /> : '↻'} 重生成
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-morandi-subtle text-sm">{dream.date}</span>
          {dream.mood && <span className="text-sm">{dream.mood}</span>}
          {dream.dreamType && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-morandi-accent text-white font-medium">
              {dream.dreamType}
            </span>
          )}
          <span className="text-morandi-subtle text-xs">{CLARITY_LABEL[dream.clarity]}</span>
        </div>
      </div>

      {/* Original dream content */}
      <Card title="夢境內容">
        <p className="text-morandi-muted text-sm leading-relaxed whitespace-pre-wrap">
          {dream.content}
        </p>
      </Card>

      {!analysis ? (
        <div className="text-center py-8 text-morandi-subtle text-sm">尚無分析結果</div>
      ) : (
        <>
          <Card title="夢境摘要 🌙">
            <p className="text-morandi-text text-sm leading-relaxed">{analysis.summary}</p>
          </Card>

          <Card title="夢境解析">
            <p className="text-morandi-muted text-sm leading-relaxed">
              {analysis.zhougongInterpretation}
            </p>
          </Card>

          <Card title="主題與情緒">
            {analysis.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {analysis.themes.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full bg-morandi-accent text-white text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-3.5">
              {analysis.emotions.slice(0, 5).map(em => (
                <div key={em.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-morandi-text text-sm">{em.name}</span>
                    <span className="text-morandi-accent text-sm font-medium">{em.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-morandi-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-morandi-accent rounded-full animate-data-load"
                      style={{ width: `${(em.percentage / maxEmotion) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="象徵元素">
            <div className="divide-y divide-morandi-border/60">
              {analysis.symbols.map((s, i) => (
                <div key={s.symbol} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-morandi-warm border border-morandi-accent/15 flex items-center justify-center text-morandi-accent text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-morandi-text text-sm font-medium">{s.symbol}</p>
                    <p className="text-morandi-muted text-xs mt-0.5 leading-relaxed">{s.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div>
            <h3 className="text-morandi-muted text-xs font-medium uppercase tracking-wider mb-3">關鍵字</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map(k => (
                <span key={k} className="px-3 py-1.5 rounded-full glass-morandi text-morandi-muted text-xs shadow-morandi">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <button onClick={() => navigate('/input')} className={btnClass}>
        記錄新夢境
      </button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-morandi rounded-2xl p-4 shadow-morandi-md">
      <h2 className="text-morandi-text text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const btnClass =
  'block w-full py-3.5 rounded-full bg-morandi-accent text-white text-sm font-semibold text-center hover:bg-morandi-accent/90 transition-all active:scale-[0.98]';
