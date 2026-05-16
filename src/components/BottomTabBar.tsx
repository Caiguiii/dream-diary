import { useLocation, useNavigate } from 'react-router-dom';
import { getDreams } from '../utils/storage';

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
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
  </svg>
);

const tabs = [
  { label: '輸入', path: '/', icon: <EditIcon />, matchExact: true },
  { label: '分析', path: '/analysis', icon: <SparkleIcon />, matchPrefix: '/analysis' },
  { label: '歷史', path: '/diary', icon: <BookIcon />, matchPrefix: '/diary' },
  { label: '統計', path: '/stats', icon: <ChartIcon />, matchPrefix: '/stats' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login') return null;

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.matchExact) return location.pathname === tab.path;
    return tab.matchPrefix ? location.pathname.startsWith(tab.matchPrefix) : false;
  };

  const handlePress = (tab: typeof tabs[0]) => {
    if (tab.label === '分析') {
      const dreams = getDreams();
      navigate(dreams.length > 0 ? `/analysis/${dreams[0].id}` : '/');
    } else {
      navigate(tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-morandi-surface border-t border-morandi-border shadow-morandi-md">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.label}
              onClick={() => handlePress(tab)}
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
