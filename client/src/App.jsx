import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/auth/LoginForm";
import Register from "./pages/auth/RegisterForm";
import Home from "./pages/User/Home";
import Review from "./pages/User/Review";
import Feedback from "./pages/User/Feedback";
import Notifications from "./pages/User/Notification";
import AdminDashboard from "./pages/admin/Admindashboard"
import { Link } from "react-router-dom";

export default function App() {
    return (
        <BrowserRouter>
            <main className="main">
                <Routes>
                    <Route path="/" element={<LoginForm />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />  {/* Admin dashboard */}
                    <Route path="/home" element={<Home />} />
                    <Route path="/Review" element={<Review />} />
                    <Route path="/Feedback" element={<Feedback />} />
                    <Route path="/Notifications" element={<Notifications />} />
                </Routes>
                <hr/>
                <p>Welcome to GroomMate where you can book your barbershop appointments</p>
            </main>
        </BrowserRouter>
    );
}
