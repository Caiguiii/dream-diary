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
          <div className="text-5xl mb-3">🌙</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            {step === 'register' ? '建立帳號' : '登入夢境日記'}
          </h1>
        </div>

        <form onSubmit={handle} className="space-y-4">
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

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-40 hover:from-blue-500 hover:to-purple-500 transition"
          >
            {loading ? '處理中...' : step === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          {step === 'login' ? '還沒有帳號？' : '已有帳號？'}
          <button
            onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-purple-300 hover:text-purple-200 ml-1"
          >
            {step === 'login' ? '免費註冊' : '前往登入'}
          </button>
        </p>

        <p className="text-center text-white/20 text-xs mt-8">
          登入後夢境資料將同步至雲端
        </p>
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
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition';
