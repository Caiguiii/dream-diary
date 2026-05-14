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
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 bg-night-900/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🌙</span>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            夢境日記
          </span>
        </div>

        <nav className="flex gap-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-purple-600/50 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span>{icon}</span>
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
                className="text-blue-300/60 hover:text-blue-300 text-xs transition disabled:opacity-40"
              >
                {syncing ? '⏳' : '☁️'}
              </button>
              <span className="text-white/30 text-xs hidden sm:block truncate max-w-[100px]">{email}</span>
              <button
                onClick={logout}
                className="text-white/40 hover:text-white/70 text-xs transition"
              >
                登出
              </button>
            </>
          ) : isCognitoConfigured ? (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-lg text-xs bg-purple-600/40 text-purple-200 hover:bg-purple-600/60 transition"
            >
              登入
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
