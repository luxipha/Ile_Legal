import { useState } from "react";
import { UserIcon, PencilIcon, ShieldIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { useAuth } from "../../contexts/AuthContext";

export const AdminProfileHeader = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || (user?.user_metadata as any)?.name || "Demo Admin",
    role: user?.user_metadata?.role_title || "System Administrator",
    email: user?.email || "admin@example.com",
    clearance: user?.user_metadata?.clearance_level || "5"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For debugging
  console.log('User data in AdminProfileHeader:', user);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
    // Reset form data to current user values
    if (user) {
      setFormData({
        name: user.name || "Demo Admin",
        role: user.user_metadata?.role_title || "System Administrator",
        email: user.email || "admin@example.com",
        clearance: user.user_metadata?.clearance_level || "5"
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: formData.name,
        user_metadata: {
          ...user.user_metadata,
          role_title: formData.role,
          clearance_level: formData.clearance
        }
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.name || "Demo Admin"}</h2>
                  <p className="text-gray-600 mt-1">{user?.user_metadata?.role_title || "System Administrator"}</p>
                  <p className="text-gray-500 text-sm">Full Platform Access</p>
                </div>
                
                <Button 
                  onClick={handleEditProfile}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                  disabled={isLoading}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                {/* Admin Badge */}
                <span className="bg-[#1B1828] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <ShieldIcon className="w-4 h-4" />
                  Admin
                </span>
                
                {/* Level 5 Clearance Badge */}
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Level 5 Clearance
                </span>
                
                {/* System Manager Badge */}
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  System Manager
                </span>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active Administrator
                </span>
                <span className="text-gray-600">Member since 2022</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right font-medium">Name</label>
              <input 
                id="name" 
                name="name"
                value={formData.name} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role" className="text-right font-medium">Role</label>
              <input 
                id="role" 
                name="role"
                value={formData.role} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right font-medium">Email</label>
              <input 
                id="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded" 
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="clearance" className="text-right font-medium">Clearance Level</label>
              <select 
                id="clearance" 
                name="clearance"
                value={formData.clearance} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded"
              >
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
