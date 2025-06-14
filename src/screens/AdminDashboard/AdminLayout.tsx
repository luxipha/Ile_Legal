import { ReactNode } from "react";
import { AdminHeaderMenu } from "../../components/admin/AdminHeaderMenu";
import { AdminSidebar } from "./AdminSidebar";
import { ViewMode } from "./AdminDashboard";

interface AdminLayoutProps {
  children: ReactNode;
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
  title: string;
}

export const AdminLayout = ({
  children,
  viewMode,
  onNavigate,
  title
}: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar viewMode={viewMode} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <AdminHeaderMenu title={title} onNavigate={onNavigate} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
