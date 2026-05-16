import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDream } from '../utils/storage';
import { apiAnalyzeDream, isApiConfigured } from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
    <div className="py-10">
      <div className="text-center mb-10">
        <div className="text-4xl mb-4">🌙</div>
        <h1 className="text-2xl font-semibold text-morandi-text mb-2 tracking-tight">
          記錄你的夢境
        </h1>
        <p className="text-morandi-muted text-sm">
          將昨晚的夢境告訴我，AI 將以周公解夢為你深度解析
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="夢境標題">
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="為這個夢境命名..."
            className={inputClass}
          />
        </Field>

        <Field label="做夢日期">
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={inputClass}
          />
        </Field>

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

        <Field label="醒來後心情">
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => (
              <ToggleBtn
                key={mood}
                active={form.mood === mood}
                onClick={() => set('mood', form.mood === mood ? '' : mood)}
              >
                {mood}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        <Field label="夢境清晰度">
          <div className="flex gap-2">
            {CLARITY_OPTIONS.map(c => (
              <ToggleBtn
                key={c.value}
                active={form.clarity === c.value}
                onClick={() => set('clarity', c.value)}
                className="flex-1 justify-center"
              >
                {c.label}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        <Field label="夢境類型">
          <div className="flex flex-wrap gap-2">
            {DREAM_TYPES.map(type => (
              <ToggleBtn
                key={type}
                active={form.dreamType === type}
                onClick={() => set('dreamType', form.dreamType === type ? '' : type)}
              >
                {type}
              </ToggleBtn>
            ))}
          </div>
        </Field>

        {error && (
          <div className="bg-morandi-error/8 border border-morandi-error/25 rounded-2xl p-4 text-morandi-error text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.content.trim()}
          className="w-full py-3.5 rounded-2xl bg-morandi-text text-white font-medium text-base disabled:opacity-35 hover:bg-morandi-text/90 transition-all shadow-morandi"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> AI 正在解析夢境...
            </span>
          ) : needsLogin ? '請先登入才能分析' : '送出分析'}
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-morandi-text text-sm font-medium mb-2">
        {label}
        {required && <span className="text-morandi-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, className = '', children }: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center border ${className} ${
        active
          ? 'bg-morandi-purple/15 text-morandi-purple border-morandi-purple/30 font-medium'
          : 'bg-morandi-surface text-morandi-muted border-morandi-border hover:border-morandi-purple/30 hover:text-morandi-text'
      }`}
    >
      {children}
    </button>
  );
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
  'w-full bg-morandi-surface border border-morandi-border rounded-2xl px-4 py-3 text-morandi-text placeholder-morandi-subtle focus:outline-none focus:border-morandi-purple/40 focus:ring-2 focus:ring-morandi-purple/8 transition-all';
