import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import InputPage from './pages/InputPage';
import AnalysisPage from './pages/AnalysisPage';
import DiaryPage from './pages/DiaryPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <main className="max-w-3xl mx-auto px-4 pb-16">
            <Routes>
              <Route path="/" element={<InputPage />} />
              <Route path="/analysis/:id" element={<AnalysisPage />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
