import { RecentActionsCard } from "./RecentActionsCard";
import { LoginHistoryCard } from "./LoginHistoryCard";
import { SystemAuditLogCard } from "./SystemAuditLogCard";

export const ActivityLogTab = () => {
  return (
    <div className="space-y-6">
      <RecentActionsCard />
      <LoginHistoryCard />
      <SystemAuditLogCard />
    </div>
  );
};
