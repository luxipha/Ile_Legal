import { ThemeSettingsCard } from "./ThemeSettingsCard";
import { LayoutPreferencesCard } from "./LayoutPreferencesCard";
import { AccessibilitySettingsCard } from "./AccessibilitySettingsCard";

export const CustomizationTab = () => {
  return (
    <div className="space-y-6">
      <ThemeSettingsCard />
      <LayoutPreferencesCard />
      <AccessibilitySettingsCard />
    </div>
  );
};
