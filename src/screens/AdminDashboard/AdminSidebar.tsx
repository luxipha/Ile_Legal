import { Link } from "react-router-dom";
import { 
  BarChart3Icon, 
  BriefcaseIcon, 
  MessageSquareIcon, 
  SettingsIcon, 
  UserIcon,
  UserCheckIcon 
} from "lucide-react";
import { ViewMode } from "./AdminDashboard";

interface AdminSidebarProps {
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

export const AdminSidebar = ({ viewMode, onNavigate }: AdminSidebarProps) => {
  return (
    <div className="w-64 bg-[#1B1828] text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link to="/" className="flex items-center gap-3">
          <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
          <div className="text-gray-300 text-sm">
            Legal
            <br />
            Marketplace
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onNavigate("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "dashboard" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <BarChart3Icon className="w-5 h-5" />
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("verify-user")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "verify-user" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <UserCheckIcon className="w-5 h-5" />
              Verify User
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("manage-gigs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "manage-gigs" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <BriefcaseIcon className="w-5 h-5" />
              Manage Gigs
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("disputes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "disputes" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <MessageSquareIcon className="w-5 h-5" />
              Disputes
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "settings" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === "profile" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <UserIcon className="w-5 h-5" />
              Profile
            </button>
          </li>
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium">Demo Admin</div>
            <div className="text-xs text-gray-400">admin@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};
