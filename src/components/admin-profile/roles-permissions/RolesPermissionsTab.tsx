import { CurrentRoleCard } from "./CurrentRoleCard";
import { RoleDelegationCard } from "./RoleDelegationCard";
import { PermissionGroupsCard } from "./PermissionGroupsCard";

export const RolesPermissionsTab = () => {
  return (
    <div className="space-y-6">
      <CurrentRoleCard />
      <RoleDelegationCard />
      <PermissionGroupsCard />
    </div>
  );
};
