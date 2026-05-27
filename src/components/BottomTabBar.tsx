import { useLocation, useNavigate } from 'react-router-dom';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const tabs = [
  { label: '首頁', path: '/', icon: <HomeIcon />, match: (p: string) => p === '/' },
  { label: '記錄', path: '/input', icon: <EditIcon />, match: (p: string) => p === '/input' },
  { label: '歷史', path: '/diary', icon: <BookIcon />, match: (p: string) => p.startsWith('/diary') || p.startsWith('/analysis') },
  { label: '統計', path: '/stats', icon: <ChartIcon />, match: (p: string) => p.startsWith('/stats') },
  { label: '週報', path: '/weekly', icon: <StarIcon />, match: (p: string) => p.startsWith('/weekly') },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login') return null;

  return (
    <div className="
        fixed bottom-0 left-0 right-0 z-50
        bg-morandi-surface
        border-t border-morandi-border
        shadow-morandi-md
        rounded-t-3xl
      "
    >
    {/* <div className="bg-morandi-surface border border-morandi-border shadow-morandi-md rounded-t-3xl"> */}
      {/* <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2 pb-2"> */}
        <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2 pb-safe">
        {tabs.map(tab => {
          const active = tab.match(location.pathname);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 flex-1 py-1"
            >
              <div
                className={`px-5 py-1.5 rounded-2xl transition-all ${
                  active ? 'bg-morandi-accent text-white' : 'text-morandi-subtle'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-xs transition-colors ${
                  active ? 'text-morandi-accent font-medium' : 'text-morandi-subtle'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
