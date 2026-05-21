import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Star particles ────────────────────────────────────────────────────────────
interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function StarField() {
  const stars = useMemo<Star[]>(() => {
    // Seed-based pseudo-random for SSR consistency
    return Array.from({ length: 120 }, (_, i) => {
      const seed = i * 1.618033;
      return {
        id: i,
        left: ((seed * 31.7) % 100),
        top: ((seed * 17.3) % 100),
        size: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.1,
        duration: 2 + (i % 4) * 1.2,
        delay: (i % 8) * 0.4,
        opacity: 0.3 + (i % 5) * 0.14,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Nebula orbs ────────────────────────────────────────────────────────────────
function NebulaOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Purple nebula - top left */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(120,40,220,0.20) 0%, rgba(80,20,180,0.08) 50%, transparent 70%)',
          animation: 'float 14s ease-in-out infinite',
          filter: 'blur(1px)',
        }}
      />
      {/* Blue nebula - top right */}
      <div
        className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(40,80,220,0.15) 0%, rgba(20,50,180,0.06) 50%, transparent 70%)',
          animation: 'float 18s 2s ease-in-out infinite',
          filter: 'blur(1px)',
        }}
      />
      {/* Gold nebula - center bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(196,168,117,0.08) 0%, rgba(196,129,90,0.04) 50%, transparent 70%)',
          animation: 'float 20s 4s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />
      {/* Small teal accent - mid left */}
      <div
        className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(40,160,200,0.12) 0%, transparent 60%)',
          animation: 'float 12s 1s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ── Floating particles ─────────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 10 + (i * 4.5) % 80,
      startY: 80 + (i * 2.7) % 20,
      size: 1 + (i % 3) * 0.8,
      duration: 8 + (i % 6) * 2,
      delay: (i % 8) * 0.6,
      opacity: 0.2 + (i % 4) * 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.startY}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.id % 3 === 0 ? 'rgba(196,168,117,0.6)' : 'rgba(255,255,255,0.4)',
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
            opacity: p.opacity,
          }}
        />
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
    setTimeout(() => navigate('/login'), 700);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #050810 0%, #090b1a 35%, #12102e 65%, #050810 100%)',
      }}
    >
      {/* Background layers */}
      <StarField />
      <NebulaOrbs />
      <FloatingParticles />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm w-full">

        {/* Moon glyph */}
        <div
          className="text-7xl mb-8 animate-float select-none"
          style={{ filter: 'drop-shadow(0 0 28px rgba(196,168,117,0.6)) drop-shadow(0 0 60px rgba(196,168,117,0.2))' }}
        >
          🌙
        </div>

        {/* Title */}
        <h1
          className="text-[3rem] font-bold tracking-[0.2em] mb-3 animate-slide-up text-gradient-gold"
          style={{ lineHeight: 1.15 }}
        >
          夢境日記
        </h1>

        {/* Divider line */}
        <div
          className="w-16 h-px mb-6 animate-slide-up-delay"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,168,117,0.6), transparent)' }}
        />

        {/* Tagline */}
        <p className="text-dream-muted text-sm leading-relaxed mb-2 animate-slide-up-delay" style={{ letterSpacing: '0.05em' }}>
          潛入潛意識的深處
        </p>
        <p className="text-dream-muted text-sm leading-relaxed mb-12 animate-slide-up-delay" style={{ letterSpacing: '0.05em' }}>
          在夢境的語言中，尋找靈魂的輪廓
        </p>

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          disabled={leaving}
          className="animate-slide-up-delay2 relative group w-full max-w-xs py-4 rounded-full font-semibold text-base tracking-widest transition-all duration-300 select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(196,168,117,0.18) 0%, rgba(196,129,90,0.25) 100%)',
            border: '1px solid rgba(196,168,117,0.45)',
            backdropFilter: 'blur(16px)',
            color: '#e8d5a0',
            animation: leaving ? undefined : 'glowPulse 2.5s ease-in-out infinite',
            boxShadow: '0 0 24px rgba(196,168,117,0.3), 0 0 60px rgba(196,168,117,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
            letterSpacing: '0.15em',
          }}
        >
          <span className="relative z-10">
            {leaving ? '進入夢境中…' : '開始進入夢境'}
          </span>

          {/* Button inner glow on hover */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'rgba(196,168,117,0.08)' }}
          />
        </button>

        {/* Subtext */}
        <p
          className="text-dream-subtle text-xs mt-8 animate-slide-up-delay3"
          style={{ letterSpacing: '0.08em' }}
        >
          每一個夢，都是靈魂的低語
        </p>
      </div>

      {/* Fade-to-black overlay on leave */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: leaving ? 1 : 0,
          transition: 'opacity 0.65s ease-in',
        }}
      />
    </div>
  );
}
