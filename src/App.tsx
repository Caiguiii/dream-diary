import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import InputPage from './pages/InputPage';
import AnalysisPage from './pages/AnalysisPage';
import DiaryPage from './pages/DiaryPage';
import StatsPage from './pages/StatsPage';
import WeeklyReportPage from './pages/WeeklyReportPage';

// ── Auth gate: redirect to /landing if Cognito configured but not logged in ──
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isCognitoConfigured } = useAuth();
  if (isCognitoConfigured && !isLoggedIn) {
    return <Navigate to="/landing" replace />;
  }
  return <>{children}</>;
}

// ── Public routes redirect to / if already logged in ──────────────────────────
function PublicRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isCognitoConfigured } = useAuth();
  if (isCognitoConfigured && isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const isDarkPage = location.pathname === '/landing' || location.pathname === '/login';

  return (
    <div className={isDarkPage ? '' : 'min-h-screen bg-morandi-bg'}>
      {/* Navbar hidden on dark full-screen pages */}
      {!isDarkPage && <Navbar />}

      {isDarkPage ? (
        // Full-screen dark pages — no wrapper constraints
        <Routes>
          <Route path="/landing" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        </Routes>
      ) : (
        // App shell with bottom tab
        <>
          <main className="max-w-md mx-auto px-4 pb-28 pt-2">
            <Routes>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/input" element={<ProtectedRoute><InputPage /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
              <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/weekly" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomTabBar />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
