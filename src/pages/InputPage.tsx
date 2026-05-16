import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDream } from '../utils/storage';
import { apiAnalyzeDream, isApiConfigured } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { Dream, Clarity } from '../types';

const MOODS = [
  { emoji: '😊', label: '愉快' },
  { emoji: '😌', label: '平靜' },
  { emoji: '😨', label: '害怕' },
  { emoji: '😰', label: '緊張' },
  { emoji: '😢', label: '悲傷' },
  { emoji: '😲', label: '驚訝' },
  { emoji: '😐', label: '茫然' },
];

const CLARITY_OPTIONS: { value: Clarity; label: string }[] = [
  { value: 'fuzzy', label: '模糊' },
  { value: 'normal', label: '普通' },
  { value: 'clear', label: '清晰' },
];

const DREAM_TYPES = ['日常', '奇幻', '驚悚', '懷舊', '浪漫', '冒險', '靈異', '其他'];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function InputPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isCognitoConfigured } = useAuth();
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

  const needsLogin = isCognitoConfigured && !isLoggedIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    if (needsLogin) { setError('請先登入才能使用 AI 分析'); return; }

    setLoading(true);
    setError('');
    try {
      const analysis = isApiConfigured()
        ? await apiAnalyzeDream(form)
        : await localAnalyze(form);

      const dream: Dream = {
        id: uid(),
        ...form,
        analysis,
        createdAt: new Date().toISOString(),
      };
      await saveDream(dream);
      navigate(`/analysis/${dream.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-morandi-text">記錄你的夢境</h1>
        <p className="text-morandi-muted text-sm mt-1">寫下你的夢境，讓 AI 為你解析</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="夢境標題..."
          className={inputClass}
        />

        <textarea
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="描述你的夢境內容..."
          rows={6}
          className={`${inputClass} resize-none`}
          required
        />

        {/* Date + Clarity row */}
        <div className="flex gap-2">
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <div className="flex gap-1">
            {CLARITY_OPTIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('clarity', c.value)}
                className={`px-3 py-3 rounded-2xl text-sm transition-all ${
                  form.clarity === c.value
                    ? 'bg-morandi-accent text-white font-medium'
                    : 'bg-morandi-surface text-morandi-muted border border-morandi-border'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood — circular emoji buttons */}
        <div>
          <label className="block text-morandi-text text-sm font-medium mb-3">心情</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => {
              const val = `${m.emoji} ${m.label}`;
              const active = form.mood === val;
              return (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => set('mood', active ? '' : val)}
                  title={m.label}
                  className={`w-11 h-11 rounded-full text-xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-morandi-accent ring-2 ring-morandi-accent ring-offset-2 ring-offset-morandi-bg'
                      : 'bg-morandi-surface border border-morandi-border hover:border-morandi-accent/50'
                  }`}
                >
                  {m.emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dream type — pill chips */}
        <div>
          <label className="block text-morandi-text text-sm font-medium mb-3">夢境類型</label>
          <div className="flex flex-wrap gap-2">
            {DREAM_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => set('dreamType', form.dreamType === type ? '' : type)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  form.dreamType === type
                    ? 'bg-morandi-accent text-white font-medium'
                    : 'bg-morandi-surface text-morandi-muted border border-morandi-border hover:border-morandi-accent/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-morandi-error/10 border border-morandi-error/25 rounded-2xl p-3 text-morandi-error text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.content.trim()}
          className="w-full py-4 rounded-full bg-morandi-accent text-white font-semibold text-base disabled:opacity-40 hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> AI 正在解析夢境...
            </span>
          ) : needsLogin ? '請先登入才能分析' : 'AI 分析夢境'}
        </button>
      </form>
    </div>
  );
}

async function localAnalyze(form: object) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json'))
    throw new Error('無法連線到本機 Ollama，請確認已執行 npm run dev');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '分析失敗');
  return data.analysis;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const inputClass =
  'w-full bg-morandi-surface border border-morandi-border rounded-2xl px-4 py-3 text-morandi-text placeholder-morandi-subtle focus:outline-none focus:border-morandi-accent/50 focus:ring-2 focus:ring-morandi-accent/10 transition-all shadow-morandi';
