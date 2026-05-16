import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncFromCloud } from '../utils/storage';
import { useState } from 'react';

export default function Navbar() {
  const { email, isLoggedIn, isCognitoConfigured, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);

  if (!isCognitoConfigured || location.pathname === '/login') return null;

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
    <div className="max-w-md mx-auto px-4 pt-3 flex justify-end items-center gap-3">
      {isLoggedIn ? (
        <>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="從雲端同步"
            className="text-morandi-subtle hover:text-morandi-accent text-sm transition-colors disabled:opacity-40"
          >
            {syncing ? '⏳' : '☁️'}
          </button>
          <span className="text-morandi-subtle text-xs truncate max-w-[120px] hidden sm:block">{email}</span>
          <button
            onClick={logout}
            className="text-xs text-morandi-subtle hover:text-morandi-muted transition-colors px-2 py-1 rounded-lg hover:bg-morandi-surface"
          >
            登出
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-morandi-accent hover:text-morandi-accent/80 transition-colors"
        >
          登入
        </button>
      )}
    </div>
  );
}
