import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncFromCloud } from '../utils/storage';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Pages that use dark background — hide morandi navbar
const DARK_PAGES = ['/landing', '/login'];

export default function Navbar() {
  const { email, isLoggedIn, isCognitoConfigured, syncing: loginSyncing, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for deeper glass blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset sync toast
  useEffect(() => {
    if (syncStatus === 'success' || syncStatus === 'error') {
      const t = setTimeout(() => { setSyncStatus('idle'); setSyncError(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [syncStatus]);

  // Hide on dark pages or if Cognito not configured
  if (!isCognitoConfigured || DARK_PAGES.includes(location.pathname)) return null;

  const handleSync = async () => {
    setSyncStatus('syncing');

    try {
      await syncFromCloud();

      window.location.reload();

    } catch (e) {
      setSyncError(e instanceof Error ? e.message : '同步失敗');
      setSyncStatus('error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const isBusy = syncStatus === 'syncing' || loginSyncing;

  return (
    <div
      className="sticky top-0 z-40 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(237,232,222,0.82)'
          : 'rgba(237,232,222,0.60)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: scrolled ? '1px solid rgba(229,221,211,0.8)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 20px rgba(44,40,37,0.06)' : 'none',
      }}
    >
      <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">

        {/* App name / logo */}
        <button
          onClick={() => navigate('/')}
          className="text-morandi-text font-bold text-sm tracking-wider hover:text-morandi-accent transition-colors"
          style={{ letterSpacing: '0.08em' }}
        >
          瑪麗蓮夢錄
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isBusy}
                title={syncStatus === 'success' ? '已同步' : '從雲端同步'}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-morandi-warm transition-all disabled:opacity-40 text-base"
              >
                {isBusy ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-morandi-muted" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : syncStatus === 'success' ? '✅' : '☁️'}
              </button>

              {/* User chip */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(196,129,90,0.10)',
                  border: '1px solid rgba(196,129,90,0.20)',
                  color: '#C4815A',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-morandi-accent" />
                <span className="truncate max-w-[100px]">{email?.split('@')[0]}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-xs text-morandi-subtle hover:text-morandi-error transition-colors px-2 py-1 rounded-lg hover:bg-morandi-error/8"
              >
                登出
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                background: 'rgba(196,129,90,0.12)',
                border: '1px solid rgba(196,129,90,0.25)',
                color: '#C4815A',
              }}
            >
              登入
            </button>
          )}
        </div>
      </div>

      {/* Sync banners */}
      {(syncStatus === 'error' || loginSyncing) && (
        <div className="max-w-md mx-auto px-4 pb-2">
          {syncStatus === 'error' && (
            <div
              className="text-xs px-3 py-1.5 rounded-xl text-center"
              style={{ background: 'rgba(192,112,112,0.12)', color: '#C07070', border: '1px solid rgba(192,112,112,0.2)' }}
            >
              ⚠️ {syncError}
            </div>
          )}
          {loginSyncing && (
            <div
              className="text-xs px-3 py-1.5 rounded-xl text-center"
              style={{ background: 'rgba(196,168,117,0.12)', color: '#C4815A', border: '1px solid rgba(196,168,117,0.2)' }}
            >
              正在同步雲端資料…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
