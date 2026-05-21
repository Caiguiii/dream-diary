import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import HomePage from './pages/HomePage';
import InputPage from './pages/InputPage';
import AnalysisPage from './pages/AnalysisPage';
import DiaryPage from './pages/DiaryPage';
import StatsPage from './pages/StatsPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-morandi-bg">
          <Navbar />
          <main className="max-w-md mx-auto px-4 pb-28 pt-2">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/input" element={<InputPage />} />
              <Route path="/analysis/:id" element={<AnalysisPage />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/weekly" element={<WeeklyReportPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
          <BottomTabBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
