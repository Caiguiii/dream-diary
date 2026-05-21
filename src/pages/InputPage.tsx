import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDream } from '../utils/storage';
import { apiAnalyzeDream, apiGenerateTitle, isApiConfigured } from '../utils/api';
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

type Step = 'form' | 'title-preview';

export default function InputPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isCognitoConfigured } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'local'>('idle');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: '',
    clarity: 'normal' as Clarity,
    dreamType: '',
  });

  // Pending dream waiting for title confirmation
  const [pendingDream, setPendingDream] = useState<Dream | null>(null);
  const [aiTitle, setAiTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

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
      const { analysis, title } = isApiConfigured()
        ? await apiAnalyzeDream(form)
        : await localAnalyze(form);

      const dream: Dream = {
        id: uid(),
        title: title || '無題夢境',
        ...form,
        analysis,
        createdAt: new Date().toISOString(),
      };

      setPendingDream(dream);
      setAiTitle(dream.title);
      setStep('title-preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenTitle = async () => {
    if (!pendingDream || !isApiConfigured()) return;
    setRegenLoading(true);
    try {
      const newTitle = await apiGenerateTitle(form.content, form.mood, form.dreamType);
      setAiTitle(newTitle);
    } catch {
      // keep existing
    } finally {
      setRegenLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pendingDream) return;
    const dreamToSave = { ...pendingDream, title: aiTitle || pendingDream.title };
    const { synced } = await saveDream(dreamToSave);
    setSyncStatus(synced ? 'synced' : 'local');
    navigate(`/analysis/${dreamToSave.id}`);
  };

  if (step === 'title-preview' && pendingDream) {
    return (
      <div className="py-4 space-y-5 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-morandi-text">AI 生成標題</h1>
          <p className="text-morandi-muted text-sm mt-1">可以編輯或重新生成標題</p>
        </div>

        {/* Title card */}
        <div className="bg-morandi-surface rounded-2xl p-5 border border-morandi-border shadow-morandi-md">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-morandi-warm flex items-center justify-center text-lg shrink-0">
              ✨
            </div>
            <span className="text-morandi-subtle text-xs self-center">AI 生成標題</span>
          </div>

          {editingTitle ? (
            <input
              autoFocus
              value={aiTitle}
              onChange={e => setAiTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              className="w-full text-xl font-bold text-morandi-text bg-transparent border-b-2 border-morandi-accent outline-none pb-1"
            />
          ) : (
            <p
              className="text-xl font-bold text-morandi-text leading-snug cursor-pointer hover:text-morandi-accent transition-colors"
              onClick={() => setEditingTitle(true)}
              title="點擊編輯"
            >
              {aiTitle || '無題夢境'}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setEditingTitle(true)}
              className="text-xs text-morandi-subtle hover:text-morandi-muted border border-morandi-border px-3 py-1.5 rounded-full transition-colors"
            >
              手動編輯
            </button>
            {isApiConfigured() && (
              <button
                onClick={handleRegenTitle}
                disabled={regenLoading}
                className="text-xs text-morandi-accent hover:text-morandi-accent/80 border border-morandi-accent/30 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                {regenLoading ? <Spinner /> : '↻'} 重新生成
              </button>
            )}
          </div>
        </div>

        {/* Dream preview */}
        <div className="bg-morandi-surface rounded-2xl p-4 border border-morandi-border shadow-morandi">
          <p className="text-morandi-subtle text-xs mb-2">夢境內容預覽</p>
          <p className="text-morandi-muted text-sm line-clamp-3 leading-relaxed">
            {form.content}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {form.mood && <span className="text-xs">{form.mood}</span>}
            {form.dreamType && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-morandi-accent text-white font-medium">
                {form.dreamType}
              </span>
            )}
            <span className="text-morandi-subtle text-xs">{form.date}</span>
          </div>
        </div>

        {syncStatus === 'local' && (
          <p className="text-morandi-subtle text-xs text-center">
            ☁️ 已儲存到本機（雲端同步失敗，稍後可手動同步）
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex-1 py-3.5 rounded-full border border-morandi-border text-morandi-muted text-sm font-medium hover:bg-morandi-surface transition-all"
          >
            ← 返回修改
          </button>
          <button
            onClick={handleSave}
            className="flex-2 flex-grow py-3.5 rounded-full bg-morandi-accent text-white font-semibold text-sm hover:bg-morandi-accent/90 transition-all shadow-morandi active:scale-[0.98]"
          >
            儲存並查看分析 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-morandi-text">記錄你的夢境</h1>
        <p className="text-morandi-muted text-sm mt-1">寫下夢境，讓 AI 為你解析並命名</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="描述你的夢境內容... AI 會自動生成詩意標題"
          rows={7}
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

        {/* Mood */}
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

        {/* Dream type */}
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
              <Spinner /> AI 正在解析夢境…
            </span>
          ) : needsLogin ? '請先登入才能分析' : 'AI 分析夢境 ✨'}
        </button>
      </form>
    </div>
  );
}

async function localAnalyze(form: object): Promise<{ analysis: import('../types').DreamAnalysis; title: string }> {
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
  return { analysis: data.analysis, title: data.title || '' };
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
