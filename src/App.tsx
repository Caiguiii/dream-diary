import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import InputPage from './pages/InputPage';
import AnalysisPage from './pages/AnalysisPage';
import DiaryPage from './pages/DiaryPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import { getDreams } from './utils/storage';

function RecentAnalysisPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const dreams = getDreams();
    if (dreams.length > 0) {
      navigate(`/analysis/${dreams[0].id}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-morandi-bg">
          <Navbar />
          <main className="max-w-md mx-auto px-4 pb-28 pt-2">
            <Routes>
              <Route path="/" element={<InputPage />} />
              <Route path="/analysis" element={<RecentAnalysisPage />} />
              <Route path="/analysis/:id" element={<AnalysisPage />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
          <BottomTabBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
