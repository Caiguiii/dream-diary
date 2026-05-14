import { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn, signUp, signOut,
  getCurrentUserEmail, getIdToken, isConfigured,
} from '../utils/auth';

interface AuthContextValue {
  email: string | null;
  isLoggedIn: boolean;
  isCognitoConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

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
  };

  const register = async (e: string, password: string) => {
    await signUp(e, password);
  };

  const logout = () => {
    signOut();
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{
      email,
      isLoggedIn: !!email,
      isCognitoConfigured: isConfigured(),
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
