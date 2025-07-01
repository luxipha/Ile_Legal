import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ToastWrapper from './components/ToastWrapper';
import { ProfileCompletionModal } from './components/ProfileCompletionModal/ProfileCompletionModal';

// Lazy load screens for code splitting
// Keep critical/public screens as regular imports for faster initial load
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";

// Lazy load heavy/authenticated screens
const SellerDashboard = lazy(() => import("./screens/SellerDashboard").then(m => ({ default: m.SellerDashboard })));
const BuyerDashboard = lazy(() => import("./screens/BuyerDashboard").then(m => ({ default: m.BuyerDashboard })));
const BuyerMessages = lazy(() => import("./screens/BuyerMessages").then(m => ({ default: m.BuyerMessages })));
const BuyerPayments = lazy(() => import("./screens/BuyerPayments").then(m => ({ default: m.BuyerPayments })));
const BuyerProfile = lazy(() => import("./screens/BuyerProfile").then(m => ({ default: m.BuyerProfile })));
const MyGigs = lazy(() => import("./screens/MyGigs").then(m => ({ default: m.MyGigs })));
const PostGig = lazy(() => import("./screens/PostGig").then(m => ({ default: m.PostGig })));
const FindGigs = lazy(() => import("./screens/FindGigs").then(m => ({ default: m.FindGigs })));
const ActiveBids = lazy(() => import("./screens/ActiveBids").then(m => ({ default: m.ActiveBids })));
const Earnings = lazy(() => import("./screens/Earnings").then(m => ({ default: m.Earnings })));
const Profile = lazy(() => import("./screens/Profile").then(m => ({ default: m.Profile })));
const Messages = lazy(() => import("./screens/Messages").then(m => ({ default: m.Messages })));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const ResetPassword = lazy(() => import("./screens/ResetPassword/ResetPassword").then(m => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => import("./screens/AuthCallback/AuthCallback").then(m => ({ default: m.AuthCallback })));
const TestAccounts = lazy(() => import("./screens/TestAccounts").then(m => ({ default: m.TestAccounts })));
const BlockchainDemo = lazy(() => import("./screens/BlockchainDemo").then(m => ({ default: m.BlockchainDemo })));
const WalletIndex = lazy(() => import("./screens/Wallet"));
const PublicLawyerProfile = lazy(() => import("./components/PublicLawyerProfile").then(m => ({ default: m.PublicLawyerProfile })));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEC85F]"></div>
  </div>
);

function ProfileCompletionHandler() {
  const { pendingMetaMaskProfile, completeMetaMaskProfile, setPendingMetaMaskProfile } = useAuth();

  const handleProfileCompletion = async (profileData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone?: string;
    userType?: 'client' | 'professional';
    agreeToTerms?: boolean;
  }) => {
    await completeMetaMaskProfile(profileData);
  };

  const handleModalClose = () => {
    // Modal can't be closed without completing profile
    return;
  };

  return (
    <ProfileCompletionModal
      isOpen={!!pendingMetaMaskProfile}
      onClose={handleModalClose}
      onSubmit={handleProfileCompletion}
      walletAddress={pendingMetaMaskProfile?.address || ''}
      authMethod="metamask"
      requireRoleSelection={true}
      requireTermsAcceptance={true}
      showWalletInfo={true}
    />
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileCompletionHandler />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile/:id" element={<PublicLawyerProfile />} />
      <Route path="/profile-demo" element={<PublicLawyerProfile />} />
      <Route path="/profile-test" element={
        <Suspense fallback={<LoadingSpinner />}>
          {React.createElement(React.lazy(() => import("./components/PublicLawyerProfile/PublicLawyerProfileTest").then(m => ({ default: m.PublicLawyerProfileTest }))))}
        </Suspense>
      } />
      
      {/* Protected Routes with role-based access */}
      <Route path="/seller-dashboard" element={
        <ProtectedRoute requiredRole="seller">
          <SellerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/buyer-dashboard" element={
        <ProtectedRoute requiredRole="buyer">
          <BuyerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Other protected routes */}
      <Route path="/buyer-messages" element={
        <ProtectedRoute requiredRole="buyer">
          <BuyerMessages />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <BuyerPayments />
        </ProtectedRoute>
      } />
      <Route path="/buyer-profile" element={
        <ProtectedRoute requiredRole="buyer">
          <BuyerProfile />
        </ProtectedRoute>
      } />
      <Route path="/my-gigs" element={
        <ProtectedRoute requiredRole="seller">
          <MyGigs />
        </ProtectedRoute>
      } />
      <Route path="/MyGigs" element={
        <ProtectedRoute requiredRole="buyer">
          <MyGigs />
        </ProtectedRoute>
      } />
      <Route path="/post-gig" element={
        <ProtectedRoute requiredRole="buyer">
          <PostGig />
        </ProtectedRoute>
      } />
      <Route path="/find-gigs" element={
        <ProtectedRoute>
          <FindGigs />
        </ProtectedRoute>
      } />
      <Route path="/active-bids" element={
        <ProtectedRoute requiredRole="seller">
          <ActiveBids />
        </ProtectedRoute>
      } />
      <Route path="/earnings" element={
        <ProtectedRoute requiredRole="seller">
          <Earnings />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute requiredRole="seller">
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/seller-messages" element={
        <ProtectedRoute requiredRole="seller">
          <Messages />
        </ProtectedRoute>
      } />
      
      {/* Wallet routes */}
      <Route path="/wallet" element={
        <ProtectedRoute>
          <WalletIndex />
        </ProtectedRoute>
      } />
      <Route path="/wallet/transactions" element={
        <ProtectedRoute>
          <WalletIndex />
        </ProtectedRoute>
      } />
      <Route path="/wallet/funding" element={
        <ProtectedRoute>
          <WalletIndex />
        </ProtectedRoute>
      } />
      <Route path="/wallet/test" element={
        <ProtectedRoute requiredRole="admin">
          <WalletIndex />
        </ProtectedRoute>
      } />
      
      {/* Test Accounts Route - No protection */}
      <Route path="/test-accounts" element={<TestAccounts />} />
      
      {/* Blockchain Demo Route - No protection for demonstration */}
      <Route path="/BlockchainDemo" element={<BlockchainDemo />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ToastWrapper>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastWrapper>
  );
}

export default App;