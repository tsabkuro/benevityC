import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import DonorView from "./pages/DonorView";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LogIn />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/campaigns/*" element={<DonorView />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
