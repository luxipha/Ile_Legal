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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer-messages" element={<BuyerMessages />} />
        <Route path="/payments" element={<BuyerPayments />} />
        <Route path="/buyer-profile" element={<BuyerProfile />} />
        <Route path="/my-gigs" element={<MyGigs />} />
        <Route path="/post-gig" element={<PostGig />} />
        <Route path="/find-gigs" element={<FindGigs />} />
        <Route path="/active-bids" element={<ActiveBids />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;