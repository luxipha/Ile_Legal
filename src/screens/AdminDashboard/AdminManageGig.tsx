import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { UsersIcon, UserIcon, FlagIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

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

interface AdminManageGigProps {
  gigs: Gig[];
  onViewGigDetails: (gigId: number) => void;
  onFlagGig: (gigId: number) => void;
}

export const AdminManageGig = ({
  gigs,
  onViewGigDetails,
  onFlagGig
}: AdminManageGigProps) => {
  const [selectedGigTab, setSelectedGigTab] = useState<"all" | "active" | "pending" | "completed" | "flagged">("all");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Filter gigs based on selected tab
  const filteredGigs = gigs.filter(gig => {
    if (selectedGigTab === "all") return true;
    if (selectedGigTab === "active") return gig.status === "Active" || gig.status === "In Progress";
    if (selectedGigTab === "pending") return gig.status === "Pending" || gig.status === "Pending Assignment";
    if (selectedGigTab === "completed") return gig.status === "Completed";
    if (selectedGigTab === "flagged") return gig.status === "Flagged";
    return true;
  });

  const handleFlagConfirm = () => {
    if (selectedGig) {
      onFlagGig(selectedGig.id);
      setShowFlagModal(false);
      setSelectedGig(null);
    }
  };

  const handleFlagClick = (gig: Gig) => {
    setSelectedGig(gig);
    setShowFlagModal(true);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "all", label: "All Gigs" },
            { id: "active", label: "Active" },
            { id: "pending", label: "Pending" },
            { id: "completed", label: "Completed" },
            { id: "flagged", label: "Flagged" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedGigTab(tab.id as any)}
              className={`pb-4 px-6 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                selectedGigTab === tab.id
                  ? "border-[#FEC85F] text-[#1B1828] bg-[#FEC85F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Gig Cards */}
      <div className="space-y-6">
        {filteredGigs.map((gig) => (
          <Card key={gig.id} className="bg-white border border-gray-200">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{gig.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Client: {gig.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Provider: {gig.provider}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    {gig.priority && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        gig.priority === "High Value" ? "bg-yellow-100 text-yellow-800" :
                        gig.priority === "Urgent" ? "bg-red-100 text-red-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {gig.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                      onClick={() => onViewGigDetails(gig.id)}
                    >
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handleFlagClick(gig)}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Flag for Review
                    </Button>
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2">{gig.amount}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                    gig.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                    gig.status === "Pending Assignment" ? "bg-yellow-100 text-yellow-800" :
                    gig.status === "Active" ? "bg-green-100 text-green-800" :
                    gig.status === "Completed" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {gig.status}
                  </span>
                  <div className="text-sm text-gray-500">
                    <div>Posted: {gig.postedDate}</div>
                    <div>Due: {gig.dueDate}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flag Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Gig for Review</DialogTitle>
            <DialogDescription>
              You are about to flag "{selectedGig?.title}" for review. This will mark the gig for administrative attention.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md">
              <FlagIcon className="text-red-500 w-5 h-5" />
              <div>
                <p className="font-medium text-red-700">Flag this gig for review</p>
                <p className="text-sm text-red-600">This will alert the admin team to investigate</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagModal(false)}>Cancel</Button>
            <Button onClick={handleFlagConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Confirm Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
