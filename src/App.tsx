import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import NotFoundPage from './pages/NotFoundPage';

// Dashboard Pages - Buyer
import BuyerDashboardPage from './pages/dashboard/buyer/BuyerDashboardPage';
import MyGigsPage from './pages/buyer/MyGigsPage';

// Dashboard Pages - Seller
import SellerDashboardPage from './pages/dashboard/seller/SellerDashboardPage';
import FindGigsPage from './pages/seller/FindGigsPage';
import ActiveBidsPage from './pages/seller/ActiveBidsPage';
import PlaceBidPage from './pages/seller/PlaceBidPage';
import EditBidPage from './pages/seller/EditBidPage';
import EarningsPage from './pages/seller/EarningsPage';
import SubmitWorkPage from './pages/seller/SubmitWorkPage';

// Dashboard Pages - Admin
import AdminDashboardPage from './pages/dashboard/admin/AdminDashboardPage';
import VerifyUsersPage from './pages/dashboard/admin/VerifyUsersPage';
import ManageGigsPage from './pages/dashboard/admin/ManageGigsPage';
import DisputesPage from './pages/dashboard/admin/DisputesPage';
import SettingsPage from './pages/dashboard/admin/SettingsPage';

// Shared Pages
import ProfilePage from './pages/profile/ProfilePage';
import MessagesPage from './pages/messages/MessagesPage';
import PaymentPage from './pages/payments/PaymentPage';
import PaymentCompletePage from './pages/payments/PaymentCompletePage';
import GigDetailsPage from './pages/gigs/GigDetailsPage';
import PostGigPage from './pages/gigs/PostGigPage';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Buyer Dashboard Routes */}
      <Route path="buyer" element={<DashboardLayout />}>
        <Route path="dashboard" element={<BuyerDashboardPage />} />
        <Route path="post-gig" element={<PostGigPage />} />
        <Route path="my-gigs" element={<MyGigsPage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:conversationId" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Seller Dashboard Routes */}
      <Route path="seller" element={<DashboardLayout />}>
        <Route path="dashboard" element={<SellerDashboardPage />} />
        <Route path="find-gigs" element={<FindGigsPage />} />
        <Route path="active-bids" element={<ActiveBidsPage />} />
        <Route path="bid/:gigId" element={<PlaceBidPage />} />
        <Route path="bid/:gigId/edit/:bidId" element={<EditBidPage />} />
        <Route path="gig/:gigId/submit" element={<SubmitWorkPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:conversationId" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route path="admin" element={<DashboardLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="verify-users" element={<VerifyUsersPage />} />
        <Route path="verify-users/:userId" element={<VerifyUsersPage />} />
        <Route path="manage-gigs" element={<ManageGigsPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="disputes/:disputeId" element={<DisputesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Shared Routes */}
      <Route path="gigs/:gigId" element={<GigDetailsPage />} />
      <Route path="payment/complete" element={<PaymentCompletePage />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}