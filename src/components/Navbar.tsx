import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncFromCloud } from '../utils/storage';
import { useState, useEffect } from 'react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export default function Navbar() {
  const { email, isLoggedIn, isCognitoConfigured, syncing: loginSyncing, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');

  // Reset sync toast after delay
  useEffect(() => {
    if (syncStatus === 'success' || syncStatus === 'error') {
      const t = setTimeout(() => setSyncStatus('idle'), 2500);
      return () => clearTimeout(t);
    }
  }, [syncStatus]);

  if (!isCognitoConfigured || location.pathname === '/login') return null;

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncError('');
    try {
      await syncFromCloud();
      setSyncStatus('success');
      // Trigger re-render of pages that read from localStorage
      window.dispatchEvent(new Event('dreams-updated'));
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : '同步失敗');
      setSyncStatus('error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isBusy = syncStatus === 'syncing' || loginSyncing;

  return (
    <div className="max-w-md mx-auto px-4 pt-3 space-y-2">
      <div className="flex justify-end items-center gap-3">
        {isLoggedIn ? (
          <>
            <button
              onClick={handleSync}
              disabled={isBusy}
              title="從雲端同步"
              className="text-morandi-subtle hover:text-morandi-accent text-sm transition-colors disabled:opacity-40"
            >
              {isBusy ? '⏳' : syncStatus === 'success' ? '✅' : '☁️'}
            </button>
            <span className="text-morandi-subtle text-xs truncate max-w-[120px] hidden sm:block">
              {email}
            </span>
            <button
              onClick={handleLogout}
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

      {/* Sync error toast */}
      {syncStatus === 'error' && syncError && (
        <div className="bg-morandi-error/10 border border-morandi-error/25 rounded-xl px-3 py-2 text-morandi-error text-xs">
          ⚠️ {syncError}
        </div>
      )}

      {/* Login sync banner */}
      {loginSyncing && (
        <div className="bg-morandi-warm border border-morandi-border rounded-xl px-3 py-2 text-morandi-muted text-xs">
          正在同步雲端資料…
        </div>
      )}
    </div>
  );
}
