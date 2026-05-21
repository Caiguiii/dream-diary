import { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn, signUp, signOut,
  getCurrentUserEmail, getIdToken, isConfigured,
} from '../utils/auth';
import { clearLocalDreams } from '../utils/storage';

interface AuthContextValue {
  email: string | null;
  isLoggedIn: boolean;
  isCognitoConfigured: boolean;
  syncing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isConfigured()) return;
    const e = getCurrentUserEmail();
    if (!e) return;
    getIdToken().then(token => {
      if (token) setEmail(e);
    });
  }, []);

  const login = async (e: string, password: string) => {
    await signIn(e, password);
    setEmail(e);
    setSyncing(true);
    try {
      const { syncFromCloud } = await import('../utils/storage');
      await syncFromCloud();
    } catch {
      // silent — user still logged in
    } finally {
      setSyncing(false);
    }
  };

  const register = async (e: string, password: string) => {
    await signUp(e, password);
  };

  const logout = () => {
    signOut();
    clearLocalDreams();
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{
      email,
      isLoggedIn: !!email,
      isCognitoConfigured: isConfigured(),
      syncing,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
