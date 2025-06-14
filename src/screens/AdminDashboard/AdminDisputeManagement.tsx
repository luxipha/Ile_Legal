import { useState } from "react";
import { DisputeManagement, Dispute } from "../../components/disputes/DisputeManagement";

interface AdminDisputeManagementProps {
  disputes: Dispute[];
}

export const AdminDisputeManagement = ({ disputes }: AdminDisputeManagementProps) => {
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "review" | "resolved">("all");

  // Handle tab change
  const handleTabChange = (tab: "all" | "pending" | "review" | "resolved") => {
    setSelectedTab(tab);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Dispute Management</h2>
      <DisputeManagement 
        disputes={disputes}
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};


