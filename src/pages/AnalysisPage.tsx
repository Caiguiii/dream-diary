import { useParams, useNavigate } from 'react-router-dom';
import { getDream, deleteDream } from '../utils/storage';

const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dream = id ? getDream(id) : undefined;

  if (!dream) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl mb-4">😶‍🌫️</div>
        <p className="text-morandi-muted text-sm">找不到這個夢境紀錄</p>
        <button onClick={() => navigate('/')} className={btnClass + ' mt-6'}>
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

  const maxEmotion = analysis?.emotions[0]?.percentage ?? 100;

  return (
    <div className="py-4 space-y-4">
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
        <h1 className="text-xl font-bold text-morandi-text">{dream.title || '無題夢境'}</h1>
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
          {/* AI Summary */}
          <Card title="夢境摘要 🌙">
            <p className="text-morandi-text text-sm leading-relaxed">{analysis.summary}</p>
          </Card>

          {/* 夢境解析 */}
          <Card title="夢境解析">
            <p className="text-morandi-muted text-sm leading-relaxed">
              {analysis.zhougongInterpretation}
            </p>
          </Card>

          {/* Themes + Emotions combined */}
          <Card title="主題與情緒">
            {/* Theme tags */}
            {analysis.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {analysis.themes.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-morandi-accent text-white text-xs font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {/* Emotion progress bars */}
            <div className="space-y-3.5">
              {analysis.emotions.slice(0, 5).map(em => (
                <div key={em.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-morandi-text text-sm">{em.name}</span>
                    <span className="text-morandi-accent text-sm font-medium">{em.percentage}%</span>
                  </div>
                  <div className="h-2 bg-morandi-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-morandi-accent rounded-full transition-all duration-500"
                      style={{ width: `${(em.percentage / maxEmotion) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Symbol elements */}
          <Card title="象徵元素">
            <div className="divide-y divide-morandi-border">
              {analysis.symbols.map((s, i) => (
                <div key={s.symbol} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-morandi-surface2 border border-morandi-border flex items-center justify-center text-morandi-muted text-xs font-medium shrink-0">
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

          {/* Keywords */}
          <div>
            <h3 className="text-morandi-muted text-xs font-medium uppercase tracking-wider mb-3">關鍵字</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map(k => (
                <span
                  key={k}
                  className="px-3 py-1.5 rounded-full bg-morandi-surface border border-morandi-border text-morandi-muted text-xs shadow-morandi"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <button onClick={() => navigate('/')} className={btnClass}>
        記錄新夢境
      </button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-morandi-surface rounded-2xl p-4 border border-morandi-border shadow-morandi">
      <h2 className="text-morandi-text text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

const btnClass =
  'block w-full py-3.5 rounded-full bg-morandi-accent text-white text-sm font-semibold text-center hover:bg-morandi-accent/90 transition-all shadow-morandi';
