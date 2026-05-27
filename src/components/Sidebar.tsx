import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncFromCloud } from '../utils/storage';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const SyncIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const tabs = [
  { label: '首頁',     path: '/',       icon: <HomeIcon />,  match: (p: string) => p === '/' },
  { label: '記錄夢境', path: '/input',  icon: <EditIcon />,  match: (p: string) => p === '/input' },
  { label: '夢境日記', path: '/diary',  icon: <BookIcon />,  match: (p: string) => p.startsWith('/diary') || p.startsWith('/analysis') },
  { label: '統計分析', path: '/stats',  icon: <ChartIcon />, match: (p: string) => p.startsWith('/stats') },
  { label: '夢境週報', path: '/weekly', icon: <StarIcon />,  match: (p: string) => p.startsWith('/weekly') },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, nickname, isLoggedIn, isCognitoConfigured, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      setSynced(true);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const displayName = nickname || email?.split('@')[0] || '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 h-full"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderRight: '1px solid rgba(229,221,211,0.8)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(229,221,211,0.6)' }}>
        {/* <img src="/logo.png" alt="瑪麗蓮夢錄" className="w-14 h-14 object-contain mb-3" /> */}
        <p className="text-morandi-text font-bold text-sm tracking-wider">瑪麗蓮夢錄</p>
        <p className="text-morandi-subtle text-xs mt-0.5">Dream Log & Analysis</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {tabs.map(tab => {
          const active = tab.match(location.pathname);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-morandi-accent text-white shadow-morandi'
                  : 'text-morandi-muted hover:bg-morandi-warm hover:text-morandi-text'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(229,221,211,0.6)' }}>
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-morandi-accent shrink-0"
                style={{ background: 'rgba(196,129,90,0.12)', border: '1px solid rgba(196,129,90,0.2)' }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-morandi-text truncate">{displayName}</p>
                <p className="text-xs text-morandi-subtle truncate">{email}</p>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing || synced}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-morandi-muted hover:bg-morandi-warm hover:text-morandi-text transition-all disabled:opacity-40"
            >
              <SyncIcon />
              {syncing ? '同步中…' : synced ? '✅ 已同步' : '同步雲端資料'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-morandi-subtle hover:text-morandi-error transition-all"
              style={{ '--tw-bg-opacity': '1' } as React.CSSProperties}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              登出
            </button>
          </>
        ) : isCognitoConfigured ? (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C4815A, #b8714e)', boxShadow: '0 4px 12px rgba(196,129,90,0.3)' }}
          >
            登入帳號
          </button>
        ) : null}
      </div>
    </aside>
  );
}
