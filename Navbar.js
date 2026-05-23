import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = Boolean(token) && user.role === "admin";
  const [pendingPharmacies, setPendingPharmacies] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const loadPendingPharmacies = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get("/admin/users");
      const pending = (data.data || []).filter(
        (u) => u.role === "pharmacy" && u.pharmacy_verification_status === "pending"
      );
      setPendingPharmacies(pending);
    } catch (error) {
      setNotificationMessage(
        error.response?.data?.message || "Could not load pharmacy verification requests"
      );
    }
  };

  const approvePharmacy = async (userId) => {
    try {
      await api.post("/admin/verify-pharmacy", { userId, approved: true });
      setNotificationMessage("Pharmacy verified successfully.");
      await loadPendingPharmacies();
    } catch (error) {
      setNotificationMessage(error.response?.data?.message || "Could not verify pharmacy");
    }
  };

  const denyPharmacy = async (userId) => {
    try {
      await api.post("/admin/verify-pharmacy", { userId, approved: false });
      setNotificationMessage("Pharmacy verification request denied.");
      await loadPendingPharmacies();
    } catch (error) {
      setNotificationMessage(error.response?.data?.message || "Could not deny pharmacy");
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadPendingPharmacies();
    const interval = setInterval(loadPendingPharmacies, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>Live Medicine Finder</h2>
      <div className="nav-links">
        <Link to="/">Home</Link>
        {!token ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            {user.role === "pharmacy" ? (
              <>
                <Link to="/pharmacy-stock">My Stock</Link>
                <Link to="/pharmacy-search-stock">Search Stock</Link>
                <Link to="/pharmacy-add-stock">Add Stock</Link>
                <Link to="/pharmacy-profile">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/search">Search</Link>
                <Link to="/nearby">Nearby</Link>
                <Link to="/emergency">Emergency</Link>
              </>
            )}
            {user.role === "admin" && <Link to="/admin">Admin Data</Link>}
            {isAdmin && (
              <button
                type="button"
                className="link-btn notify-btn"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                Notifications ({pendingPharmacies.length})
              </button>
            )}
            <button type="button" onClick={handleLogout} className="link-btn">
              Logout
            </button>
          </>
        )}
      </div>

      {isAdmin && showNotifications && (
        <div className="notify-panel">
          <h4>Pharmacy Verification Requests</h4>
          {pendingPharmacies.length === 0 ? (
            <p>No pending pharmacy requests.</p>
          ) : (
            pendingPharmacies.map((request) => (
              <div className="notify-item" key={request.id}>
                <div>
                  <strong>{request.pharmacy_store_name || request.name}</strong>
                  <p>Email: {request.email}</p>
                  <p>License: {request.pharmacy_license_no || "-"}</p>
                </div>
                <div className="notify-actions">
                  <button className="btn secondary" onClick={() => approvePharmacy(request.id)}>
                    Verify
                  </button>
                  <button className="btn danger" onClick={() => denyPharmacy(request.id)}>
                    Deny
                  </button>
                </div>
              </div>
            ))
          )}
          {notificationMessage && <p className="message">{notificationMessage}</p>}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
