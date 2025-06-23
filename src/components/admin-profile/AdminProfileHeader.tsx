import { useState, useEffect } from "react";
import { UserIcon, PencilIcon, ShieldIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import { RoleService, UserType } from "../../services/roleService";
import { usePermissions } from "../../hooks/usePermissions";
import { supabaseLocal as supabase } from "../../lib/supabaseLocal";

export const AdminProfileHeader = () => {
  const { user, isLoading } = useAuth();
  const { userRole, permissions } = usePermissions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User data loaded

  // Load admin profile data
  useEffect(() => {
    const loadAdminProfile = async () => {
      if (user?.id) {
        try {
          const profile = await RoleService.getAdminProfile(user.id);
          setAdminProfile(profile);
          if (profile) {
            setFormData({
              firstName: profile.first_name || "",
              lastName: profile.last_name || "",
              phone: profile.phone || "",
              location: profile.location || ""
            });
          }
        } catch (error) {
          console.error('Error loading admin profile:', error);
        }
      }
    };

    loadAdminProfile();
  }, [user?.id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
    // Reset form data to current profile values
    if (adminProfile) {
      setFormData({
        firstName: adminProfile.first_name || "",
        lastName: adminProfile.last_name || "",
        phone: adminProfile.phone || "",
        location: adminProfile.location || ""
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    try {
      // Update profile in the database
      const { error } = await supabase
        .from('Profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          location: formData.location
        })
        .eq('id', user.id);

      if (error) throw error;

      // Reload profile data
      const updatedProfile = await RoleService.getAdminProfile(user.id);
      setAdminProfile(updatedProfile);
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    {adminProfile ? 
                      `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || adminProfile.email :
                      user?.name || "Demo Admin"
                    }
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {adminProfile?.user_type ? 
                      RoleService.getRoleByType(adminProfile.user_type as UserType).display_name :
                      "Administrator"
                    }
                  </p>
                  <p className="text-gray-500 text-sm">Platform Access</p>
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
                {/* Role Badge */}
                <span className="bg-[#1B1828] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <ShieldIcon className="w-4 h-4" />
                  {userRole?.display_name || 'Admin'}
                </span>
                
                {/* Permission Count Badge */}
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {permissions.length} Permission{permissions.length !== 1 ? 's' : ''}
                </span>
                
                {/* Access Level Badge */}
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {adminProfile?.user_type === 'super_admin' ? 'Super Admin' : 
                   adminProfile?.user_type === 'admin' ? 'Admin Access' : 
                   'System User'}
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
              <label htmlFor="firstName" className="text-right font-medium">First Name</label>
              <input 
                id="firstName" 
                name="firstName"
                value={formData.firstName} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="lastName" className="text-right font-medium">Last Name</label>
              <input 
                id="lastName" 
                name="lastName"
                value={formData.lastName} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right font-medium">Email</label>
              <input 
                id="email" 
                name="email"
                value={adminProfile?.email || user?.email || ""} 
                className="col-span-3 p-2 border rounded bg-gray-100" 
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone" className="text-right font-medium">Phone</label>
              <input 
                id="phone" 
                name="phone"
                value={formData.phone} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="location" className="text-right font-medium">Location</label>
              <input 
                id="location" 
                name="location"
                value={formData.location} 
                onChange={handleInputChange}
                className="col-span-3 p-2 border rounded"
              />
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
