import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncFromCloud } from '../utils/storage';
import { useState } from 'react';

const links = [
  { to: '/', label: '記錄夢境', icon: '✍️' },
  { to: '/diary', label: '夢境日記', icon: '📖' },
  { to: '/stats', label: '統計分析', icon: '📊' },
];

export default function Navbar() {
  const { email, isLoggedIn, isCognitoConfigured, logout } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      window.location.reload();
    } catch (e) {
      alert('同步失敗：' + (e instanceof Error ? e.message : e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-morandi-surface/95 backdrop-blur-md border-b border-morandi-border shadow-morandi">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">🌙</span>
          <span className="font-semibold text-sm text-morandi-text tracking-wide">
            夢境日記
          </span>
        </div>

        <nav className="flex gap-0.5">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-morandi-purple/12 text-morandi-purple font-medium'
                    : 'text-morandi-muted hover:text-morandi-text hover:bg-morandi-surface2'
                }`
              }
            >
              <span className="text-sm">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isCognitoConfigured && isLoggedIn ? (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                title="從雲端同步夢境"
                className="text-morandi-blue/60 hover:text-morandi-blue text-sm transition-colors disabled:opacity-40"
              >
                {syncing ? '⏳' : '☁️'}
              </button>
              <span className="text-morandi-subtle text-xs hidden sm:block truncate max-w-[100px]">
                {email}
              </span>
              <button
                onClick={logout}
                className="text-morandi-muted hover:text-morandi-text text-xs transition-colors px-2 py-1 rounded-lg hover:bg-morandi-surface2"
              >
                登出
              </button>
            </>
          ) : isCognitoConfigured ? (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-xl text-xs bg-morandi-purple/10 text-morandi-purple hover:bg-morandi-purple/20 transition-colors border border-morandi-purple/20"
            >
              登入
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
