import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDream } from '../utils/storage';
import type { Dream, Clarity } from '../types';

const MOODS = ['😊 愉快', '😌 平靜', '😨 害怕', '😰 緊張', '😢 悲傷', '😲 驚訝', '😐 茫然'];
const CLARITY_OPTIONS: { value: Clarity; label: string }[] = [
  { value: 'fuzzy', label: '模糊' },
  { value: 'normal', label: '普通' },
  { value: 'clear', label: '清晰' },
];
const DREAM_TYPES = ['日常', '奇幻', '驚悚', '懷舊', '浪漫', '冒險', '靈異', '其他'];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function InputPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: '',
    clarity: 'normal' as Clarity,
    dreamType: '',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '分析失敗');
      const dream: Dream = {
        id: uid(),
        ...form,
        analysis: data.analysis,
        createdAt: new Date().toISOString(),
      };
      saveDream(dream);
      navigate(`/analysis/${dream.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌙</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-2">
          記錄你的夢境
        </h1>
        <p className="text-white/50 text-sm">將昨晚的夢境告訴我，AI 將以周公解夢為你深度解析</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 標題 */}
        <Field label="夢境標題">
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="為這個夢境命名..."
            className={inputClass}
          />
        </Field>

        {/* 日期 */}
        <Field label="做夢日期">
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={inputClass}
          />
        </Field>

        {/* 內容 */}
        <Field label="夢境內容" required>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="詳細描述你的夢境內容，越詳細 AI 分析越準確..."
            rows={8}
            className={`${inputClass} resize-none`}
            required
          />
        </Field>

        {/* 心情 */}
        <Field label="醒來後心情">
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => (
              <ToggleBtn
                key={mood}
                active={form.mood === mood}
                onClick={() => set('mood', form.mood === mood ? '' : mood)}
                color="purple"
              >
                {mood}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        {/* 清晰度 */}
        <Field label="夢境清晰度">
          <div className="flex gap-3">
            {CLARITY_OPTIONS.map(c => (
              <ToggleBtn
                key={c.value}
                active={form.clarity === c.value}
                onClick={() => set('clarity', c.value)}
                color="blue"
                className="flex-1 justify-center"
              >
                {c.label}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        {/* 類型 */}
        <Field label="夢境類型">
          <div className="flex flex-wrap gap-2">
            {DREAM_TYPES.map(type => (
              <ToggleBtn
                key={type}
                active={form.dreamType === type}
                onClick={() => set('dreamType', form.dreamType === type ? '' : type)}
                color="indigo"
              >
                {type}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.content.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg disabled:opacity-40 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-900/40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> AI 正在解析夢境...
            </span>
          ) : (
            '🔮 送出分析'
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-blue-200 text-sm mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleBtn({
  active, onClick, color, className = '', children,
}: {
  active: boolean; onClick: () => void; color: 'purple' | 'blue' | 'indigo'; className?: string; children: React.ReactNode;
}) {
  const colors = {
    purple: 'bg-purple-600 text-white',
    blue: 'bg-blue-600 text-white',
    indigo: 'bg-indigo-600 text-white',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm transition flex items-center ${className} ${
        active ? colors[color] : 'bg-white/5 text-white/60 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition';
