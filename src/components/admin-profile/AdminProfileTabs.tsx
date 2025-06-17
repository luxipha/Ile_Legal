import { Dispatch, SetStateAction } from "react";

type TabType = "profile" | "security" | "notifications" | "activity" | "roles" | "customization";

interface AdminProfileTabsProps {
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
}

export const AdminProfileTabs = ({ activeTab, setActiveTab }: AdminProfileTabsProps) => {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "profile" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("profile")}
      >
        Profile Info
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "security" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("security")}
      >
        Security
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "notifications" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("notifications")}
      >
        Notifications
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "activity" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("activity")}
      >
        Activity Log
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "roles" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("roles")}
      >
        Roles & Permissions
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === "customization" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setActiveTab("customization")}
      >
        Customization
      </button>
    </div>
  );
};
