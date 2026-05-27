import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import Sidebar from './components/Sidebar';
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

  if (isDarkPage) {
    return (
      <Routes>
        <Route path="/landing" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      </Routes>
    );
  }

  return (
    <div className="flex bg-morandi-bg" style={{ height: '100dvh' }}>
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile-only top navbar */}
        <div className="md:hidden">
          <Navbar />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto md:max-w-2xl px-4 pt-2 pb-28 md:pb-8">
            <Routes>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/input" element={<ProtectedRoute><InputPage /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
              <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/weekly" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Mobile-only bottom tab bar */}
        <div className="md:hidden">
          <BottomTabBar />
        </div>
      </div>
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
