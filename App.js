import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MedicineSearchPage from "./pages/MedicineSearchPage";
import NearbyPharmacyPage from "./pages/NearbyPharmacyPage";
import EmergencyModePage from "./pages/EmergencyModePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDataPage from "./pages/AdminDataPage";
import PharmacyStockPage from "./pages/PharmacyStockPage";
import PharmacyAddStockPage from "./pages/PharmacyAddStockPage";
import PharmacySearchStockPage from "./pages/PharmacySearchStockPage";
import PharmacyProfilePage from "./pages/PharmacyProfilePage";
import MapPage from "./pages/MapPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PharmacyRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "pharmacy") return <Navigate to="/" replace />;
  return children;
}

function App() {
  const token = localStorage.getItem("token");

  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <MedicineSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nearby"
            element={
              <ProtectedRoute>
                <NearbyPharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <EmergencyModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDataPage />
              </AdminRoute>
            }
          />
          <Route
            path="/pharmacy-stock"
            element={
              <PharmacyRoute>
                <PharmacyStockPage />
              </PharmacyRoute>
            }
          />
          <Route
            path="/pharmacy-search-stock"
            element={
              <PharmacyRoute>
                <PharmacySearchStockPage />
              </PharmacyRoute>
            }
          />
          <Route
            path="/pharmacy-add-stock"
            element={
              <PharmacyRoute>
                <PharmacyAddStockPage />
              </PharmacyRoute>
            }
          />
          <Route
            path="/pharmacy-profile"
            element={
              <PharmacyRoute>
                <PharmacyProfilePage />
              </PharmacyRoute>
            }
          />
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
