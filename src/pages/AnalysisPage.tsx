import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDream, deleteDream } from '../utils/storage';

const EMOTION_COLORS = ['#8EA8B8', '#8FAF9A', '#BFA07A', '#9B8FAA', '#B8A0A0', '#8AB0A8', '#C0B090'];
const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

const tooltipStyle = {
  background: '#FAFAF8',
  border: '1px solid #E0DCD7',
  borderRadius: '12px',
  color: '#3A3835',
  boxShadow: '0 4px 16px rgba(58,56,53,0.08)',
  fontSize: '13px',
};

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dream = id ? getDream(id) : undefined;

  if (!dream) {
    return (
      <div className="py-20 text-center text-morandi-subtle">
        <div className="text-4xl mb-4">😶‍🌫️</div>
        <p className="text-morandi-muted">找不到這個夢境紀錄</p>
        <button onClick={() => navigate('/')} className={btnClass + ' mt-6 inline-block'}>
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

  return (
    <div className="py-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/diary')}
            className="text-morandi-subtle hover:text-morandi-muted text-sm mb-3 flex items-center gap-1 transition-colors"
          >
            ← 返回日記
          </button>
          <h1 className="text-xl font-semibold text-morandi-text">{dream.title || '無題夢境'}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-morandi-subtle">
            <span>{dream.date}</span>
            {dream.mood && <span>{dream.mood}</span>}
            {dream.dreamType && (
              <span className="px-2 py-0.5 rounded-full bg-morandi-purple/10 text-morandi-purple border border-morandi-purple/20">
                {dream.dreamType}
              </span>
            )}
            <span>{CLARITY_LABEL[dream.clarity]}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="text-morandi-subtle hover:text-morandi-error text-xs transition-colors shrink-0 px-3 py-1.5 rounded-xl border border-morandi-border hover:border-morandi-error/30 hover:bg-morandi-error/5"
        >
          刪除
        </button>
      </div>

      {/* Original Content */}
      <Card title="夢境內容" icon="📝">
        <p className="text-morandi-muted leading-relaxed whitespace-pre-wrap text-sm">
          {dream.content}
        </p>
      </Card>

      {!analysis ? (
        <div className="text-center text-morandi-subtle py-8">尚無分析結果</div>
      ) : (
        <>
          {/* AI Summary */}
          <Card title="AI 夢境摘要" icon="✨" accent>
            <p className="text-morandi-text leading-relaxed text-sm">{analysis.summary}</p>
          </Card>

          {/* 周公解夢 */}
          <Card title="周公解夢解讀" icon="🔮">
            <p className="text-morandi-muted leading-relaxed text-sm">
              {analysis.zhougongInterpretation}
            </p>
          </Card>

          {/* Themes & Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card title="夢境主題" icon="🎯">
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-morandi-purple/10 text-morandi-purple border border-morandi-purple/20 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
            <Card title="關鍵字" icon="🔑">
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map(k => (
                  <span
                    key={k}
                    className="px-3 py-1 rounded-full bg-morandi-blue/10 text-morandi-blue border border-morandi-blue/20 text-xs"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Emotions Pie Chart */}
          <Card title="情緒分析" icon="💫">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-44 h-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.emotions}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={64}
                      strokeWidth={0}
                    >
                      {analysis.emotions.map((_, i) => (
                        <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, '']}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 flex-1">
                {analysis.emotions.map((em, i) => (
                  <div key={em.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: EMOTION_COLORS[i % EMOTION_COLORS.length] }}
                    />
                    <span className="text-morandi-muted text-xs">
                      {em.name}
                      <span className="text-morandi-subtle ml-1">{em.percentage}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Symbols */}
          <Card title="象徵元素" icon="🌟">
            <div className="space-y-2">
              {analysis.symbols.map(s => (
                <div
                  key={s.symbol}
                  className="flex gap-3 p-3 rounded-xl bg-morandi-surface2 border border-morandi-border"
                >
                  <span className="text-morandi-purple font-medium text-sm shrink-0">{s.symbol}</span>
                  <span className="text-morandi-muted text-sm">{s.meaning}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => navigate('/')} className={btnClass}>
          記錄新夢境
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border shadow-morandi ${
        accent
          ? 'bg-gradient-to-br from-morandi-purple/8 to-morandi-blue/8 border-morandi-purple/20'
          : 'bg-morandi-surface border-morandi-border'
      }`}
    >
      <h2 className="text-xs font-medium text-morandi-subtle mb-3 flex items-center gap-2 uppercase tracking-wider">
        <span className="text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

const btnClass =
  'px-6 py-2.5 rounded-2xl bg-morandi-text text-white text-sm font-medium hover:bg-morandi-text/90 transition-all shadow-morandi';
