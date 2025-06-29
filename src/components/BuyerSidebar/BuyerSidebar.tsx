import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserIcon,
  BriefcaseIcon,
  MessageSquareIcon,
  CreditCardIcon,
  FileTextIcon,
  PlusIcon,
} from "lucide-react";

interface BuyerSidebarProps {
  activePage?: "dashboard" | "my-gigs" | "messages" | "payments" | "profile" | "post-gig";
}

export const BuyerSidebar: React.FC<BuyerSidebarProps> = ({
  activePage = "dashboard",
}) => {
  const { user } = useAuth();
  return (
    <div className="w-64 bg-[#1B1828] text-white flex flex-col">
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

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/buyer-dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "dashboard" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <BriefcaseIcon className="w-5 h-5" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/post-gig" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "post-gig" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              Post a Gig
            </Link>
          </li>
          <li>
            <Link 
              to="/MyGigs" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "my-gigs" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <FileTextIcon className="w-5 h-5" />
              My Gigs
            </Link>
          </li>
          <li>
            <Link 
              to="/buyer-messages" 
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
              to="/payments" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                activePage === "payments" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
              Payments
            </Link>
          </li>
          <li>
            <Link 
              to="/buyer-profile" 
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
            <div className="text-sm font-medium">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
