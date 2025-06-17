import { PasswordChangeCard } from "./PasswordChangeCard";
import { TwoFactorAuthCard } from "./TwoFactorAuthCard";
import { ActiveSessionsCard } from "./ActiveSessionsCard";

export const SecurityTab = () => {
  return (
    <div className="space-y-6">
      <PasswordChangeCard />
      <TwoFactorAuthCard />
      <ActiveSessionsCard />
    </div>
  );
};
