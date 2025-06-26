import { useState, useEffect } from "react";
import { 
  AlertTriangleIcon, 
  BriefcaseIcon, 
  UsersIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AnalyticsDashboard } from "../../components/analytics/AnalyticsDashboard";
import { AdminViewUser } from "./AdminViewUser";
import { AdminViewDetails } from "./AdminViewDetails";
import { AdminDisputeManagement } from "./AdminDisputeManagement";
import { AdminSettings } from "./AdminSettings";
import { AdminProfile } from "./AdminProfile";
import { AdminVerifyUser } from "./AdminVerifyUser";
import { AdminManageGig } from "./AdminManageGig";
import { AdminLayout } from "./AdminLayout";
import { api } from "../../services/api";
import { useAuth, User as AuthUser } from "../../contexts/AuthContext";

export type ViewMode = "dashboard" | "verify-user" | "manage-gigs" | "disputes" | "settings" | "profile" | "view-gig-details" | "view-user-details";

interface User {
  id: number;
  name: string;
  email: string;
  type: "Property Law" | "Contract Law" | "Business Law";
  status: "pending" | "verified" | "rejected";
  submittedDate: string;
  documents: {
    name: string;
    status: "verified" | "pending" | "rejected";
  }[];
  user_metadata?: {
    name?: string;
    type?: string;
    status?: string;
    submittedDate?: string;
  };
  role?: string;
  user_type?: string;
}

interface Gig {
  id: number;
  title: string;
  client: string;
  provider: string;
  amount: string;
  status: "Active" | "Pending" | "Completed" | "Flagged" | "In Progress" | "Pending Assignment";
  priority?: "High Value" | "Urgent" | "New";
  postedDate: string;
  dueDate: string;
  is_flagged: boolean;
}

interface Dispute {
  id: number;
  title: string;
  description: string;
  amount: string;
  priority: "High Priority" | "Medium Priority" | "Low Priority";
  status: "Pending" | "In Review" | "Resolved";
  openedDate: string;
  lastActivity: string;
  type: "Payment Dispute" | "Quality Dispute" | "Delivery Dispute";
  gig_id: string;
  buyer_id: string;
  seller_id: string;
  buyer?: {
    id: string;
    name?: string;
    email?: string;
    created_at?: string;
    verification_status?: string;
  };
  seller?: {
    id: string;
    name?: string;
    email?: string;
    created_at?: string;
    verification_status?: string;
  };
}

export const AdminDashboard = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGigTab, setSelectedGigTab] = useState<"all" | "active" | "pending" | "completed" | "flagged">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Auth context for admin user and fetching all users
  const { getAllUsers, user: authUser, updateUserStatus } = useAuth();

  // Users state
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Gigs state
  const [gigs, setGigs] = useState<any[]>([]);
  const [gigsLoading, setGigsLoading] = useState(false);
  const [gigsError, setGigsError] = useState<string | null>(null);

  // Disputes state
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    if (authUser && authUser.user_metadata?.role_title === 'admin') {
      setUsersLoading(true);
      setUsersError(null);
      getAllUsers(true)
        .then((data) => {
          console.log("data:", data);
          setUsers(data)
        })
        .catch((err) => {
          setUsersError("Failed to load users.");
          setUsers([]);
        })
        .finally(() => setUsersLoading(false));
    }
  }, [authUser, getAllUsers]);

  // Fetch gigs
  useEffect(() => {
    if (authUser && authUser.user_metadata?.role_title === 'admin') {
      setGigsLoading(true);
      setGigsError(null);
      api.gigs.getAllGigs()
        .then((data) => setGigs(data))
        .catch((err) => {
          setGigsError("Failed to load gigs.");
          setGigs([]);
        })
        .finally(() => setGigsLoading(false));
    }
  }, [authUser]);

  // Fetch disputes
  useEffect(() => {
    if (authUser && authUser.user_metadata?.role_title === 'admin') {
      setDisputesLoading(true);
      setDisputesError(null);
      api.disputes.getAllDisputes()
        .then((data) => setDisputes(data))
        .catch((err) => {
          setDisputesError("Failed to load disputes.");
          setDisputes([]);
        })
        .finally(() => setDisputesLoading(false));
    }
  }, [authUser]);

  // Settings component handles its own modal state

  const handleVerifyUser = async (userId: number): Promise<boolean> => {
    try {
      await updateUserStatus(userId.toString(), 'verified');
      // Optionally refresh users list
      setUsers(users => users.map(u => u.id === userId ? { ...u, status: 'verified' } : u));
      return true;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  };

  const handleRejectUser = async (userId: number, reason: string) => {
    try {
      await updateUserStatus(userId.toString(), 'rejected');
      // Optionally refresh users list
      setUsers(users => users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const handleRequestInfo = (userId: string, request: string) => {
    console.log(`Requesting info from user ${userId}: ${request}`);
  };

  const handleGigClick = (gigId: number) => {
    const gig = gigs.find(g => g.id === gigId);
    if (gig) {
      setSelectedGig(gig);
      setViewMode("view-gig-details");
    }
  };

  const handleViewUserDetails = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setViewMode("view-user-details");
    }
  };

  const handleFlagGig = async (gigId: number) => {
    try {
      await api.admin.setGigFlaggedStatus(gigId.toString(), true);
      setGigs(gigs => gigs.map(g => g.id === gigId ? { ...g, is_flagged: true } : g));
    } catch (error) {
      console.error('Error flagging gig:', error);
    }
  };

  const handleUnflagGig = async (gigId: number) => {
    try {
      await api.admin.setGigFlaggedStatus(gigId.toString(), false);
      setGigs(gigs => gigs.map(g => g.id === gigId ? { ...g, is_flagged: false } : g));
    } catch (error) {
      console.error('Error unflagging gig:', error);
    }
  };

  const handleReviewGig = async (gigId: number) => {
    try {
      await api.admin.approveGig(gigId.toString());
      setGigs(gigs => gigs.map(g => g.id === gigId ? { ...g, status: 'Active' } : g));
      console.log(`✅ Gig ${gigId} approved successfully`);
    } catch (error) {
      console.error('Error approving gig:', error);
    }
  };

  const handleSuspendGig = async (gigId: number) => {
    try {
      await api.admin.suspendGig(gigId.toString());
      setGigs(gigs => gigs.map(g => g.id === gigId ? { ...g, status: 'suspended' } : g));
      // Navigate back to dashboard after successful suspension
      setViewMode("dashboard");
    } catch (error) {
      console.error('Error suspending gig:', error);
    }
  };

  const filteredGigs = gigs.filter(gig => {
    switch (selectedGigTab) {
      case "active":
        return gig.status.toLowerCase() === "active" || gig.status.toLowerCase() === "in progress";
      case "pending":
        return gig.status.toLowerCase()  === "pending" || gig.status.toLowerCase() === "pending assignment";
      case "completed":
        return gig.status.toLowerCase() === "completed";
      case "flagged":
        return gig.is_flagged === true;
      case "all":
      default:
        return true;
    }
  });

  if (viewMode === "profile") {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Admin Profile">
        <AdminProfile hideHeader={true} />
      </AdminLayout>
    );
  }
  
  if (viewMode === "verify-user") {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Verify Users">
        <AdminVerifyUser 
          users={users} 
          onViewUserDetails={handleViewUserDetails} 
          onVerifyUser={(userId, _action) => handleVerifyUser(userId)}
        />
      </AdminLayout>
    );
  }
  
  if (viewMode === "manage-gigs") {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Manage Gigs">
        <AdminManageGig 
          gigs={filteredGigs} 
          onViewGigDetails={handleGigClick}
          onFlagGig={handleFlagGig}
          onUnflagGig={handleUnflagGig}
          onSuspendGig={handleSuspendGig}
          selectedGigTab={selectedGigTab}
          setSelectedGigTab={setSelectedGigTab}
        />
      </AdminLayout>
    );
  }
  
  if (viewMode === "disputes") {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Dispute Management">
        {disputesLoading ? (
          <div className="p-8 text-center text-gray-500">Loading disputes...</div>
        ) : disputesError ? (
          <div className="p-8 text-center text-red-500">{disputesError}</div>
        ) : (
          <AdminDisputeManagement disputes={disputes} />
        )}
      </AdminLayout>
    );
  }
  
  if (viewMode === "settings") {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Settings">
        <AdminSettings />
      </AdminLayout>
    );
  }
  
  if (viewMode === "view-gig-details" && selectedGig) {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title={`Gig: ${selectedGig.title}`}>
        <AdminViewDetails 
          gig={selectedGig} 
          onBack={() => setViewMode("manage-gigs")} 
          onFlag={handleFlagGig}
          onUnflag={handleUnflagGig}
          onReview={handleReviewGig}
          onSuspend={handleSuspendGig}
        />
      </AdminLayout>
    );
  }
  
  if (viewMode === "view-user-details" && selectedUser) {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title={`User: ${typeof selectedUser.name === 'string' ? selectedUser.name : selectedUser.user_metadata?.name || selectedUser.email || 'Unknown User'}`}>
        <AdminViewUser 
          user={selectedUser} 
          onBack={() => setViewMode("verify-user")} 
          onVerify={handleVerifyUser}
          onReject={handleRejectUser}
          onRequestInfo={handleRequestInfo}
        />
      </AdminLayout>
    );
  }

  // Default view: Dashboard
  return (
    <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title="Dashboard Overview">
      <div className="space-y-8">
        <div className="bg-[#FFF9E7] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1B1828] mb-2">Welcome back, Demo</h2>
              <p className="text-[#1B1828]/80">Admin dashboard - Manage platform operations</p>
            </div>
            <Button 
              onClick={() => setViewMode("settings")}
              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
            >
              Platform Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFF9E7] p-3 rounded-md">
                  <UsersIcon className="w-5 h-5 text-[#FEC85F]" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Users</div>
                  <div className="text-xl font-bold">
                    {usersLoading ? '...' : usersError ? '!' : users.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#EEF4FF] p-3 rounded-md">
                  <BriefcaseIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Active Gigs</div>
                  <div className="text-xl font-bold">
                    {gigsLoading ? '...' : gigsError ? '!' : gigs.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#F5F5FF] p-3 rounded-md">
                  <div className="w-5 h-5 text-purple-500 flex items-center justify-center font-bold">₦</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="text-xl font-bold">₦1.2M</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFF1F0] p-3 rounded-md">
                  <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Disputes</div>
                  <div className="text-xl font-bold">{disputesLoading ? '...' : disputesError ? '!' : disputes.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Verifications */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Verifications</h3>
              <p className="text-gray-600 mb-4">Legal professionals awaiting verification</p>
              {usersLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : usersError ? (
                <div className="text-red-500">{usersError}</div>
              ) : (
                <div className="space-y-4">
                  {users
                    .filter(user => 
                      (user.status?.toLowerCase() === "pending" || user.user_metadata?.status?.toLowerCase() === "pending") &&
                      (user.role === 'seller' || user.user_metadata?.role === 'seller' || user.user_type === 'seller')
                    )
                    .slice()
                    .map((user) => (
                      <div key={user.id} className="border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {typeof user.name === 'string' ? user.name : 
                               user.user_metadata?.name || 
                               user.email || 
                               'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500">{user.type || user.user_metadata?.type || "Legal Professional"}</div>
                          </div>
                          <div className="ml-auto text-xs text-gray-500">{user.submittedDate || user.user_metadata?.submittedDate || ""}</div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="ml-auto text-xs h-7"
                            onClick={() => handleVerifyUser(user.id)}
                          >
                            Verify
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs text-red-500 border-red-200 hover:bg-red-50 h-7"
                            onClick={() => handleRejectUser(user.id, "Documents incomplete")}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            variant="link"
                            className="text-xs text-blue-500 h-7"
                            onClick={() => handleViewUserDetails(user.id.toString())}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  {users.filter(user => 
                    (user.status?.toLowerCase() === "pending" || user.user_metadata?.status?.toLowerCase() === "pending") &&
                    (user.role === 'seller' || user.user_metadata?.role === 'seller' || user.user_type === 'seller')
                  ).length === 0 && (
                    <div className="text-gray-500">No pending verifications.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Disputes */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Disputes</h3>
              <p className="text-gray-600 mb-4">Disputes requiring admin intervention</p>
              {disputesLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : disputesError ? (
                <div className="text-red-500">{disputesError}</div>
              ) : (
                <div className="space-y-4">
                  {disputes
                    .filter(dispute => dispute.status === "Pending" || dispute.status === "In Review")
                    .slice(0, 1)
                    .map((dispute) => (
                      <div key={dispute.id} className="border-b border-gray-100 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{dispute.title || "Dispute"}</h4>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            {dispute.priority || "High Priority"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Between: {dispute.buyer?.name || dispute.buyer?.email || 'Unknown Buyer'} & {dispute.seller?.name || dispute.seller?.email || 'Unknown Seller'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{dispute.amount}</span>
                          <div className="text-xs text-gray-500">
                            Opened: {dispute.openedDate || dispute.created_at || ""}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white h-8"
                            onClick={() => setViewMode("disputes")}
                          >
                            Resolve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                            onClick={() => setViewMode("disputes")}
                          >
                            Contact Parties
                          </Button>
                        </div>
                      </div>
                    ))}
                  {disputes.filter(dispute => dispute.status === "Pending" || dispute.status === "In Review").length === 0 && (
                    <div className="text-gray-500">No active disputes.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Platform Analytics */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Platform Analytics</h3>
        <p className="text-gray-600 mb-6">Summary of platform performance</p>
        
        <AnalyticsDashboard />
      </div>
      </div>
    </AdminLayout>
  );
};