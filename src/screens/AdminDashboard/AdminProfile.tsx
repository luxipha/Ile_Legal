import { AdminProfile as AdminProfileComponent } from "../../components/admin-profile/AdminProfile";

interface AdminProfileProps {
  hideHeader?: boolean;
}

export const AdminProfile = ({ hideHeader = false }: AdminProfileProps): JSX.Element => {
  return <AdminProfileComponent hideHeader={hideHeader} />;
};
