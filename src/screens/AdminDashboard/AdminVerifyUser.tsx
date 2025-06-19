import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { UserIcon, CheckCircleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

interface Document {
  name: string;
  status: "verified" | "pending" | "rejected";
}

interface User {
  id: number;
  name: string;
  email: string;
  type: "Property Law" | "Contract Law" | "Business Law";
  status: "pending" | "verified" | "rejected";
  submittedDate: string;
  documents: Document[];
}

interface AdminVerifyUserProps {
  users: User[];
  onViewUserDetails: (userId: number) => void;
  onVerifyUser: (userId: number, action: string) => void;
}

export const AdminVerifyUser = ({ 
  users, 
  onViewUserDetails, 
  onVerifyUser 
}: AdminVerifyUserProps) => {
  const [selectedUserTab, setSelectedUserTab] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Filter users based on selected tab
  const filteredUsers = users.filter(user => {
    if (selectedUserTab === "all") return true;
    if (selectedUserTab === "pending") return user.status === "pending";
    if (selectedUserTab === "verified") return user.status === "verified";
    if (selectedUserTab === "rejected") return user.status === "rejected";
    return true;
  });

  const handleVerifyConfirm = () => {
    if (selectedUser) {
      onVerifyUser(selectedUser.id, "verify");
      setShowVerifyModal(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "all", label: "All Verifications" },
            { id: "pending", label: "Pending" },
            { id: "verified", label: "Verified" },
            { id: "rejected", label: "Rejected" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedUserTab(tab.id as any)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                selectedUserTab === tab.id
                  ? "border-[#FEC85F] text-[#1B1828]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* User Verification Cards */}
      <div className="space-y-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-white border border-gray-200">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-gray-600">{user.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.status === "verified" ? "bg-green-100 text-green-800" :
                      user.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {user.status === "verified" ? "Verified" :
                       user.status === "pending" ? "Pending Verification" :
                       "Rejected"}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Submitted Documents</h4>
                    <div className="space-y-3">
                      {(user.documents ?? []).map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{doc.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              doc.status === "verified" ? "bg-green-100 text-green-800" :
                              doc.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => onViewUserDetails(user.id)}
                    >
                      View Details
                    </button>
                    <Button 
                      onClick={() => onVerifyUser(user.id, "verify")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <button
                      className="text-green-600 hover:text-green-900 mr-3"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowVerifyModal(true);
                      }}
                    >
                      Verify
                    </button>

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Legal Professional</DialogTitle>
            <DialogDescription>
              You are about to verify {selectedUser?.name} as a legal professional. This will grant them access to provide legal services on the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
              <CheckCircleIcon className="text-green-500 w-5 h-5" />
              <div>
                <p className="font-medium text-green-700">All documents have been reviewed</p>
                <p className="text-sm text-green-600">Credentials and identity verified</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
            <Button onClick={handleVerifyConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
