import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Step = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (step === 'login') {
        await login(email, password);
        navigate('/');
      } else {
        await register(email, password);
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🌙</div>
          <h1 className="text-xl font-semibold text-morandi-text">
            {step === 'register' ? '建立帳號' : '登入夢境日記'}
          </h1>
          <p className="text-morandi-subtle text-xs mt-1.5">
            {step === 'register' ? '開始記錄你的夢境旅程' : '登入後夢境資料將同步至雲端'}
          </p>
        </div>

        <div className="bg-morandi-surface border border-morandi-border rounded-3xl p-6 shadow-morandi-md">
          <form onSubmit={handle} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="電子信箱"
              required
              className={inputClass}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="密碼（至少 8 字元）"
              required
              minLength={8}
              className={inputClass}
            />

            {error && (
              <p className="text-morandi-error text-xs text-center py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-morandi-text text-white text-sm font-medium disabled:opacity-35 hover:bg-morandi-text/90 transition-all mt-1"
            >
              {loading ? '處理中...' : step === 'login' ? '登入' : '建立帳號'}
            </button>
          </form>

          <p className="text-center text-morandi-subtle text-xs mt-5">
            {step === 'login' ? '還沒有帳號？' : '已有帳號？'}
            <button
              onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-morandi-purple hover:text-morandi-purple/80 ml-1 transition-colors"
            >
              {step === 'login' ? '免費註冊' : '前往登入'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('UserNotFoundException') || msg.includes('NotAuthorizedException')) return '信箱或密碼錯誤';
  if (msg.includes('UsernameExistsException')) return '此信箱已被註冊';
  if (msg.includes('InvalidPasswordException')) return '密碼需至少 8 個字元';
  return msg || '發生錯誤，請再試一次';
}

const inputClass =
  'w-full bg-morandi-bg border border-morandi-border rounded-2xl px-4 py-3 text-sm text-morandi-text placeholder-morandi-subtle focus:outline-none focus:border-morandi-purple/40 focus:ring-2 focus:ring-morandi-purple/8 transition-all';
