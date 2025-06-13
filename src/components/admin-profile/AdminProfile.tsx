import { useState } from "react";
import { AdminProfileHeader } from "./AdminProfileHeader";
import { AdminProfileTabs } from "./AdminProfileTabs";
import { ProfileInfoTab } from "./profile-info/ProfileInfoTab";
import { SecurityTab } from "./security/SecurityTab";
import { NotificationsTab } from "./notifications/NotificationsTab";
import { ActivityLogTab } from "./activity-log/ActivityLogTab";
import { RolesPermissionsTab } from "./roles-permissions/RolesPermissionsTab";
import { CustomizationTab } from "./customization/CustomizationTab";

type TabType = "profile" | "security" | "notifications" | "activity" | "roles" | "customization";

interface AdminProfileProps {}

export const AdminProfile = ({}: AdminProfileProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Always show the AdminProfileHeader at the top */}
      <AdminProfileHeader />
      
      {/* Tabs navigation */}
      <div className="mt-6">
        <AdminProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "profile" && <ProfileInfoTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "activity" && <ActivityLogTab />}
          {activeTab === "roles" && <RolesPermissionsTab />}
          {activeTab === "customization" && <CustomizationTab />}
        </div>
      </div>
    </div>
  );
};
