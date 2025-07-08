import React from "react";
import { Link } from "react-router-dom";
import {
  UserIcon,
  SearchIcon,
  GavelIcon,
  MessageSquareIcon,
  DollarSignIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SellerSidebarProps {
  activePage?: "dashboard" | "find-gigs" | "active-bids" | "messages" | "earnings" | "profile";
  userName?: string;
  userEmail?: string;
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activePage = "dashboard",
  userName,
  userEmail,
}) => {
  const { user } = useAuth();
  
  // Use real user data from AuthContext if available, fallback to props or defaults
  const displayName = userName || user?.name || (user?.user_metadata as any)?.full_name || "User";
  const displayEmail = userEmail || user?.email || "user@example.com";
  return (
    <div className="w-64 bg-[#1B1828] text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Ilé Legal" className="w-10 h-10" />
          <div className="text-gray-300 text-sm">
            Legal
            <br />
            Marketplace
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/seller-dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "dashboard" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <UserIcon className="w-5 h-5" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/find-gigs" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "find-gigs" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <SearchIcon className="w-5 h-5" />
              Find Gigs
            </Link>
          </li>
          <li>
            <Link 
              to="/active-bids" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "active-bids" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <GavelIcon className="w-5 h-5" />
              My Bids
            </Link>
          </li>
          <li>
            <Link 
              to="/seller-messages" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "messages" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <MessageSquareIcon className="w-5 h-5" />
              Messages
            </Link>
          </li>
          <li>
            <Link 
              to="/earnings" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "earnings" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <DollarSignIcon className="w-5 h-5" />
              Earnings
            </Link>
          </li>
          <li>
            <Link 
              to="/Profile" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "profile" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <UserIcon className="w-5 h-5" />
              Profile
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium">{displayName}</div>
            <div className="text-xs text-gray-400">{displayEmail}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
