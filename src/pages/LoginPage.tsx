import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Step = 'login' | 'register';

// ── Minimal star bg for login page ───────────────────────────────────────────
function MiniStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${(i * 1.97 * 31.7) % 100}%`,
            top: `${(i * 1.97 * 17.3) % 100}%`,
            width: `${i % 5 === 0 ? 2 : 1}px`,
            height: `${i % 5 === 0 ? 2 : 1}px`,
            opacity: 0.15 + (i % 5) * 0.07,
            animation: `twinkle ${2 + (i % 4)}s ${(i % 6) * 0.5}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login, register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to home
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
        await register(email, password);
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
      style={{
        background: 'linear-gradient(160deg, #050810 0%, #090b1a 35%, #12102e 65%, #050810 100%)',
      }}
    >
      <MiniStars />

      {/* Soft glow beneath card */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(196,168,117,0.07) 0%, transparent 65%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/landing')}
            className="text-dream-subtle text-xs mb-6 hover:text-dream-muted transition-colors tracking-widest block mx-auto"
            style={{ letterSpacing: '0.12em' }}
          >
            ← 返回
          </button>
          <div
            className="text-5xl mb-5 inline-block animate-float"
            style={{ filter: 'drop-shadow(0 0 20px rgba(196,168,117,0.5))' }}
          >
            🌙
          </div>
          <h1 className="text-xl font-bold text-dream-text tracking-wider mb-2">
            {step === 'register' ? '建立夢境帳號' : '進入你的夢境'}
          </h1>
          <p className="text-dream-subtle text-xs tracking-wide">
            {step === 'register'
              ? '開始記錄你的夢境旅程'
              : '登入以同步你的所有夢境'}
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-3xl p-7 shadow-dream"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-3">
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
              <div
                className="rounded-xl px-4 py-2.5 text-xs text-center"
                style={{
                  background: 'rgba(180,80,80,0.15)',
                  border: '1px solid rgba(200,100,100,0.25)',
                  color: '#e8a0a0',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="rounded-xl px-4 py-2.5 text-xs text-center"
                style={{
                  background: 'rgba(196,168,117,0.15)',
                  border: '1px solid rgba(196,168,117,0.3)',
                  color: '#c4a875',
                }}
              >
                ✓ 登入成功，進入夢境中…
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-full font-semibold text-sm tracking-widest transition-all duration-300 mt-1 disabled:opacity-50 active:scale-[0.98]"
              style={{
                background: loading || success
                  ? 'rgba(196,168,117,0.2)'
                  : 'linear-gradient(135deg, rgba(196,168,117,0.25), rgba(196,129,90,0.35))',
                border: '1px solid rgba(196,168,117,0.4)',
                color: '#e8d5a0',
                letterSpacing: '0.12em',
                boxShadow: '0 0 20px rgba(196,168,117,0.2)',
              }}
            >
              {loading ? '驗證身份中…' : success ? '歡迎回來 ✓' : step === 'login' ? '進入夢境' : '建立帳號'}
            </button>
          </form>

          <div
            className="mt-1 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-center text-dream-subtle text-xs tracking-wide">
              {step === 'login' ? '還沒有帳號？' : '已有帳號？'}
              <button
                onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(''); }}
                className="ml-1 transition-colors"
                style={{ color: '#c4a875' }}
              >
                {step === 'login' ? '免費建立' : '前往登入'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p
          className="text-center text-dream-subtle text-xs mt-8 tracking-widest"
          style={{ letterSpacing: '0.12em' }}
        >
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
    style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '1rem',
      padding: '0.875rem 1rem',
      width: '100%',
      fontSize: '0.875rem',
      color: '#e8e4f2',
      outline: 'none',
      transition: 'all 0.2s',
      letterSpacing: '0.04em',
    }}
    onFocus={e => {
      e.target.style.borderColor = 'rgba(196,168,117,0.5)';
      e.target.style.boxShadow = '0 0 0 2px rgba(196,168,117,0.12)';
    }}
    onBlur={e => {
      e.target.style.borderColor = 'rgba(255,255,255,0.12)';
      e.target.style.boxShadow = 'none';
    }}
  />
);
