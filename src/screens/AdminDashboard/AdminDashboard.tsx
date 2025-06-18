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

export type ViewMode = "dashboard" | "verify-user" | "manage-gigs" | "disputes" | "settings" | "profile" | "view-gig-details" | "view-user-details";

interface User {
  id: number;
  name: string;
  email: string;
  type: "Property Law" | "Contract Law" | "Business Law";
  status: "Pending" | "Verified" | "Rejected";
  submittedDate: string;
  documents: {
    name: string;
    status: "Verified" | "Pending" | "Rejected";
  }[];
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
}

interface Dispute {
  id: number;
  title: string;
  description: string;
  buyer: string;
  seller: string;
  amount: string;
  priority: "High Priority" | "Medium Priority" | "Low Priority";
  status: "Pending" | "In Review" | "Resolved";
  openedDate: string;
  lastActivity: string;
  type: "Payment Dispute" | "Quality Dispute" | "Delivery Dispute";
}

export const AdminDashboard = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGigTab] = useState<"all" | "active" | "pending" | "completed" | "flagged">("all");
  // Removed unused state variable selectedDisputeTab
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Disputes state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === "disputes") {
      setDisputesLoading(true);
      setDisputesError(null);
      api.disputes.getAllDisputes()
        .then((data) => {
          setDisputes(data);
        })
        .catch((err) => {
          setDisputesError("Failed to load disputes.");
        })
        .finally(() => {
          setDisputesLoading(false);
        });
    }
  }, [viewMode]);

  // Settings component handles its own modal state

  const users: User[] = [
    {
      id: 1,
      name: "Oluwaseun Adebayo",
      email: "oluwaseun@example.com",
      type: "Property Law",
      status: "Pending",
      submittedDate: "22/04/2025",
      documents: [
        { name: "Bar Certificate", status: "Pending" },
        { name: "Professional ID", status: "Verified" },
        { name: "Practice License", status: "Pending" }
      ]
    },
    {
      id: 2,
      name: "Chioma Okonkwo",
      email: "chioma@example.com",
      type: "Contract Law",
      status: "Pending",
      submittedDate: "21/04/2025",
      documents: [
        { name: "Bar Certificate", status: "Pending" },
        { name: "Professional ID", status: "Verified" },
        { name: "Practice License", status: "Pending" }
      ]
    },
    {
      id: 3,
      name: "Amara Nwosu",
      email: "amara@example.com",
      type: "Business Law",
      status: "Verified",
      submittedDate: "20/04/2025",
      documents: [
        { name: "Bar Certificate", status: "Verified" },
        { name: "Professional ID", status: "Verified" },
        { name: "Practice License", status: "Verified" }
      ]
    },
    {
      id: 4,
      name: "Tunde Bakare",
      email: "tunde@example.com",
      type: "Property Law",
      status: "Rejected",
      submittedDate: "18/04/2025",
      documents: [
        { name: "Bar Certificate", status: "Rejected" },
        { name: "Professional ID", status: "Verified" },
        { name: "Practice License", status: "Pending" }
      ]
    },
    {
      id: 5,
      name: "Zainab Mohammed",
      email: "zainab@example.com",
      type: "Contract Law",
      status: "Pending",
      submittedDate: "26/04/2025",
      documents: [
        { name: "Bar Certificate", status: "Pending" },
        { name: "Professional ID", status: "Pending" },
        { name: "Practice License", status: "Pending" }
      ]
    }
  ];

  const gigs: Gig[] = [
    {
      id: 1,
      title: "Land Title Verification - Victoria Island Property",
      client: "Lagos Properties Ltd.",
      provider: "Chinedu Okonkwo",
      amount: "₦65,000",
      status: "In Progress",
      priority: "High Value",
      postedDate: "26/04/2025",
      dueDate: "15/05/2025"
    },
    {
      id: 2,
      title: "Contract Review for Commercial Lease",
      client: "Commercial Realty",
      provider: "Aadma Jalloh",
      amount: "₦45,000",
      status: "Pending Assignment",
      priority: "New",
      postedDate: "25/04/2025",
      dueDate: "10/05/2025"
    }
  ];

  const handleVerifyUser = (userId: number): boolean => {
    console.log(`Approving user:`, userId);
    return true;
  };

  const handleRejectUser = (userId: number, reason: string) => {
    console.log(`Rejecting user ${userId} with reason: ${reason}`);
  };

  const handleRequestInfo = (userId: number, request: string) => {
    console.log(`Requesting info from user ${userId}: ${request}`);
  };

  const handleGigClick = (gigId: number) => {
    const gig = gigs.find(g => g.id === gigId);
    if (gig) {
      setSelectedGig(gig);
      setViewMode("view-gig-details");
    }
  };

  const handleViewUserDetails = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setViewMode("view-user-details");
    }
  };

  const handleFlagGig = (gigId: number) => {
    console.log("Flag gig:", gigId);
  };

  const handleReviewGig = (gigId: number) => {
    console.log(`Reviewing gig ${gigId}`);
  };

  const handleSuspendGig = (gigId: number) => {
    console.log(`Suspending gig ${gigId}`);
  };

  const filteredGigs = gigs.filter(gig => {
    if (selectedGigTab === "all") return true;
    if (selectedGigTab === "active") return gig.status === "Active" || gig.status === "In Progress";
    return gig.status.toLowerCase().includes(selectedGigTab.toLowerCase());
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
          onReview={handleReviewGig}
          onSuspend={handleSuspendGig}
        />
      </AdminLayout>
    );
  }
  
  if (viewMode === "view-user-details" && selectedUser) {
    return (
      <AdminLayout viewMode={viewMode} onNavigate={setViewMode} title={`User: ${selectedUser.name}`}>
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
                  <div className="text-xl font-bold">{users.length}</div>
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
                  <div className="text-xl font-bold">{gigs.filter(g => g.status === "Active").length}</div>
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
                  <div className="text-xl font-bold">{disputes.length}</div>
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
              
              <div className="space-y-4">
                {users.filter(u => u.status === "Pending").slice(0, 2).map((user) => (
                  <div key={user.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.type} - Legal Professional</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-500">{user.submittedDate}</div>
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
                        onClick={() => handleViewUserDetails(user.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Disputes */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Disputes</h3>
              <p className="text-gray-600 mb-4">Disputes requiring admin intervention</p>
              
              <div className="space-y-4">
                {disputes.slice(0, 1).map((dispute) => (
                  <div key={dispute.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Payment Dispute - Land Survey Project</h4>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        High Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Between: Evergreen Properties & Solomon Adebayo
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">₦120,000</span>
                      <div className="text-xs text-gray-500">
                        Opened: 24/04/2025
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
              </div>
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