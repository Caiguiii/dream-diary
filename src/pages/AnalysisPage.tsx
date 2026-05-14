import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDream, deleteDream } from '../utils/storage';

const EMOTION_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777'];
const CLARITY_LABEL = { fuzzy: '模糊', normal: '普通', clear: '清晰' };

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dream = id ? getDream(id) : undefined;

  if (!dream) {
    return (
      <div className="py-20 text-center text-white/50">
        <div className="text-4xl mb-4">😶‍🌫️</div>
        <p>找不到這個夢境紀錄</p>
        <button onClick={() => navigate('/')} className={btnClass}>
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
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/diary')}
            className="text-white/40 hover:text-white/70 text-sm mb-2 flex items-center gap-1 transition"
          >
            ← 返回日記
          </button>
          <h1 className="text-2xl font-bold text-white">{dream.title || '無題夢境'}</h1>
          <div className="flex flex-wrap gap-2 mt-2 text-sm text-white/50">
            <span>📅 {dream.date}</span>
            {dream.mood && <span>{dream.mood}</span>}
            {dream.dreamType && <span>🏷️ {dream.dreamType}</span>}
            <span>👁️ {CLARITY_LABEL[dream.clarity]}</span>
          </div>
        </div>
        <button onClick={handleDelete} className="text-red-400/60 hover:text-red-400 text-sm transition shrink-0">
          刪除
        </button>
      </div>

      {/* Original Content */}
      <Card title="夢境內容" icon="📝">
        <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{dream.content}</p>
      </Card>

      {!analysis ? (
        <div className="text-center text-white/40 py-8">尚無分析結果</div>
      ) : (
        <>
          {/* AI Summary */}
          <Card title="AI 夢境摘要" icon="✨" gradient>
            <p className="text-white/90 leading-relaxed">{analysis.summary}</p>
          </Card>

          {/* 周公解夢 */}
          <Card title="周公解夢解讀" icon="🔮">
            <p className="text-white/80 leading-relaxed">{analysis.zhougongInterpretation}</p>
          </Card>

          {/* Themes & Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card title="夢境主題" icon="🎯">
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full bg-purple-600/30 text-purple-200 text-sm">
                    {t}
                  </span>
                ))}
              </div>
            </Card>
            <Card title="關鍵字" icon="🔑">
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map(k => (
                  <span key={k} className="px-3 py-1 rounded-full bg-blue-600/30 text-blue-200 text-sm">
                    #{k}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Emotions Pie Chart */}
          <Card title="情緒分析" icon="💫">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.emotions}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {analysis.emotions.map((_, i) => (
                        <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, '']}
                      contentStyle={{ background: '#0d0d38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 flex-1">
                {analysis.emotions.map((em, i) => (
                  <div key={em.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: EMOTION_COLORS[i % EMOTION_COLORS.length] }}
                    />
                    <span className="text-white/80 text-sm">
                      {em.name}
                      <span className="text-white/40 ml-1">{em.percentage}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Symbols */}
          <Card title="象徵元素" icon="🌟">
            <div className="space-y-3">
              {analysis.symbols.map(s => (
                <div key={s.symbol} className="flex gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-purple-300 font-semibold shrink-0">{s.symbol}</span>
                  <span className="text-white/60 text-sm">{s.meaning}</span>
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
  title, icon, gradient, children,
}: {
  title: string; icon: string; gradient?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        gradient
          ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <h2 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

const btnClass =
  'px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition';
