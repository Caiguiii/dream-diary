import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Step = 'login' | 'register';

export default function LoginPage() {
  const { login, register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (step === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nickname);
        await login(email, password);
      }
      setSuccess(true);
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #EDE8DE 0%, #E8E0D5 45%, #EDE8DE 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,168,117,0.08) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,129,90,0.06) 0%, transparent 65%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/landing')}
            className="text-morandi-subtle text-xs mb-6 hover:text-morandi-muted transition-colors tracking-widest block mx-auto"
            style={{ letterSpacing: '0.10em' }}
          >
            ← 返回
          </button>
          <div className="text-5xl mb-5 inline-block animate-float"
            style={{ filter: 'drop-shadow(0 4px 16px rgba(196,129,90,0.2))' }}>
            🌙
          </div>
          <h1 className="text-xl font-bold text-morandi-text tracking-wider mb-2">
            {step === 'register' ? '建立夢境帳號' : '進入你的夢境'}
          </h1>
          <p className="text-morandi-subtle text-xs tracking-wide">
            {step === 'register' ? '開始記錄你的夢境旅程' : '登入以同步你的所有夢境'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-morandi-strong rounded-3xl p-7 shadow-morandi-md">
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-3">
              {step === 'register' && (
                <LoginInput
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="顯示名稱"
                  required
                  autoComplete="nickname"
                />
              )}
              <LoginInput
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="電子信箱"
                required
                autoComplete="email"
              />
              <LoginInput
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="密碼（至少 8 字元）"
                required
                minLength={8}
                autoComplete={step === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-xs text-center text-morandi-error"
                style={{ background: 'rgba(192,112,112,0.08)', border: '1px solid rgba(192,112,112,0.2)' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl px-4 py-2.5 text-xs text-center"
                style={{ background: 'rgba(196,168,117,0.10)', border: '1px solid rgba(196,168,117,0.25)', color: '#C4815A' }}>
                ✓ 登入成功，進入夢境中…
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-full font-semibold text-sm tracking-widest transition-all duration-300 mt-1 disabled:opacity-50 active:scale-[0.98]"
              style={{
                background: loading || success
                  ? 'rgba(196,129,90,0.25)'
                  : 'linear-gradient(135deg, #C4815A, #b8714e)',
                color: '#fff',
                letterSpacing: '0.10em',
                boxShadow: loading || success ? 'none' : '0 6px 20px rgba(196,129,90,0.3)',
                border: 'none',
              }}
            >
              {loading ? '驗證身份中…' : success ? '歡迎回來 ✓' : step === 'login' ? '進入夢境' : '建立帳號'}
            </button>
          </form>

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(229,221,211,0.8)' }}>
            <p className="text-center text-morandi-subtle text-xs tracking-wide">
              {step === 'login' ? '還沒有帳號？' : '已有帳號？'}
              <button
                onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(''); setNickname(''); }}
                className="ml-1 text-morandi-accent hover:text-morandi-accent/80 transition-colors"
              >
                {step === 'login' ? '免費建立' : '前往登入'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-morandi-subtle text-xs mt-8 tracking-widest"
          style={{ letterSpacing: '0.10em' }}>
          每一個夢，都值得被記錄
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

const LoginInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full glass-morandi rounded-2xl px-4 py-3.5 text-sm text-morandi-text placeholder-morandi-subtle focus:outline-none focus:ring-2 focus:ring-morandi-accent/20 transition-all"
  />
);
