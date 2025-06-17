import { EmailNotificationsCard } from "./EmailNotificationsCard";
import { InAppNotificationsCard } from "./InAppNotificationsCard";
import { AlertThresholdsCard } from "./AlertThresholdsCard";

export const NotificationsTab = () => {
  return (
    <div className="space-y-6">
      <EmailNotificationsCard />
      <InAppNotificationsCard />
      <AlertThresholdsCard />
    </div>
  );
};
