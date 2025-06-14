import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ResetPassword } from "./screens/ResetPassword/ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/seller-dashboard" element={
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute>
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/buyer-messages" element={
          <ProtectedRoute>
            <BuyerMessages />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <BuyerPayments />
          </ProtectedRoute>
        } />
        <Route path="/buyer-profile" element={
          <ProtectedRoute>
            <BuyerProfile />
          </ProtectedRoute>
        } />
        <Route path="/my-gigs" element={
          <ProtectedRoute>
            <MyGigs />
          </ProtectedRoute>
        } />
        <Route path="/post-gig" element={
          <ProtectedRoute>
            <PostGig />
          </ProtectedRoute>
        } />
        <Route path="/find-gigs" element={
          <ProtectedRoute>
            <FindGigs />
          </ProtectedRoute>
        } />
        <Route path="/active-bids" element={
          <ProtectedRoute>
            <ActiveBids />
          </ProtectedRoute>
        } />
        <Route path="/earnings" element={
          <ProtectedRoute>
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
        <Route path="/admin-dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;