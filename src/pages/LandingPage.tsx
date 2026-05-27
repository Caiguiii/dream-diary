import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Warm floating orbs ────────────────────────────────────────────────────────
function WarmOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,168,117,0.10) 0%, transparent 65%)', animation: 'float 18s ease-in-out infinite' }} />
      <div className="absolute -top-16 -right-24 w-[360px] h-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,129,90,0.07) 0%, transparent 65%)', animation: 'float 14s 2s ease-in-out infinite' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(196,168,117,0.06) 0%, transparent 65%)', animation: 'float 20s 4s ease-in-out infinite' }} />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,129,90,0.05) 0%, transparent 60%)', animation: 'float 12s 1s ease-in-out infinite' }} />
    </div>
  );
}

// ── Subtle warm particles ─────────────────────────────────────────────────────
function WarmParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: 5 + (i * 3.7 * 1.618) % 90,
      top: 5 + (i * 2.3 * 1.618) % 90,
      size: 1 + (i % 3) * 0.6,
      duration: 10 + (i % 6) * 2,
      delay: (i % 8) * 0.7,
      opacity: 0.12 + (i % 4) * 0.07,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{
            left: `${p.left}%`, top: `${p.top}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.id % 3 === 0 ? '#C4815A' : '#C4A875',
            opacity: p.opacity,
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(() => navigate('/login'), 550);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#E5DDD3' }}
    >
      <WarmOrbs />
      <WarmParticles />

      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(196,168,117,0.04) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm w-full">

        {/* Logo */}
        {/* <img
          src="MerryLogo.png"
          alt="瑪麗蓮夢錄"
          className="w-64 h-64 object-contain mb-4 animate-float select-none"
        /> */}
        <img
          src="MerryLogo.png"
          alt="瑪麗蓮夢錄"
          className="w-52 h-52 object-contain mt-10 mb-4 animate-float select-none"
        />

        {/* Title */}
        {/* <h1 className="text-[3rem] font-bold tracking-[0.18em] mb-3 animate-slide-up"
          style={{ lineHeight: 1.15, color: '#2C2825', letterSpacing: '0.18em' }}>
          瑪莉蓮夢錄
        </h1> */}

        {/* Divider */}
        <div className="w-16 h-px mb-6 animate-slide-up-delay"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,129,90,0.5), transparent)' }} />

        {/* Tagline */}
        {/* <p className="text-morandi-muted text-sm leading-relaxed mb-2 animate-slide-up-delay"
          style={{ letterSpacing: '0.05em' }}>
          潛入潛意識的深處
        </p> */}
        {/* <p className="text-morandi-muted text-sm leading-relaxed mb-12 animate-slide-up-delay"
          style={{ letterSpacing: '0.05em' }}>
          你的夢境比電影還經典
        </p> */}

        {/* CTA */}
        <button
          onClick={handleEnter}
          disabled={leaving}
          className="animate-slide-up-delay2 w-full max-w-xs py-4 rounded-full font-semibold text-sm transition-all duration-300 select-none active:scale-[0.98]"
          style={{
            background: leaving
              ? 'rgba(196,129,90,0.15)'
              : 'linear-gradient(135deg, #C4815A, #b8714e)',
            color: '#fff',
            letterSpacing: '0.12em',
            boxShadow: leaving ? 'none' : '0 6px 24px rgba(196,129,90,0.35)',
            border: 'none',
          }}
        >
          {leaving ? '進入中…' : '開始進入夢境'}
        </button>

        <p className="text-morandi-subtle text-xs mt-8 animate-slide-up-delay3"
          style={{ letterSpacing: '0.08em' }}>
          你的夢境比電影還經典
        </p>
      </div>

      {/* Fade overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: '#EDE8DE',
          opacity: leaving ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }} />
    </div>
  );
}
