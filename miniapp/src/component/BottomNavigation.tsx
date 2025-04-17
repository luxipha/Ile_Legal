import { Home, BarChart2, CheckSquare, Flame } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'home';

  const tabs = [
    { id: "properties", label: "Home", icon: Home },
    { id: "holdings", label: "Holdings", icon: BarChart2 },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "fire", label: "F.I.R.E", icon: Flame },
  ];

  const handleTabClick = (tabId: string) => {
    navigate(`/${tabId}`);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className || ''}`}>
      <div className="flex items-center justify-around bg-primary text-text-secondary h-16 px-4 rounded-t-xl shadow-lg border-t border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              currentPath === tab.id ? "text-accent" : "text-text-secondary"
            }`}
            onClick={() => handleTabClick(tab.id)}
          >
            <tab.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
            {currentPath === tab.id && (
              <div className="absolute bottom-0 w-6 h-1 bg-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
