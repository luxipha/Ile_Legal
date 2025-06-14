import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { SellerDashboard } from "./screens/SellerDashboard";
import { BuyerDashboard } from "./screens/BuyerDashboard";
import { BuyerMessages } from "./screens/BuyerMessages";
import { BuyerPayments } from "./screens/BuyerPayments";
import { BuyerProfile } from "./screens/BuyerProfile";
import { MyGigs } from "./screens/MyGigs";
import { PostGig } from "./screens/PostGig";
import { FindGigs } from "./screens/FindGigs";
import { ActiveBids } from "./screens/ActiveBids";
import { Earnings } from "./screens/Earnings";
import { Profile } from "./screens/Profile";
import { Messages } from "./screens/Messages";
import { AdminDashboard } from "./screens/AdminDashboard";
import { AuthCallback } from "./screens/AuthCallback/AuthCallback";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected route component to restrict access based on authentication and role
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes with role-based access */}
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
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;