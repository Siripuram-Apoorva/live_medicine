import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (token && user.role === "admin") {
    return (
      <div className="home-hero">
        <div className="home-hero-content">
          <p className="home-tag">Admin Dashboard</p>
          <h1>Manage Verification and System Data</h1>
          <p className="home-subtitle">
            Review pharmacy requests, verify pharmacy accounts, and monitor users, medicines, and
            pharmacy stock data.
          </p>
          <div className="actions">
            <Link className="btn" to="/admin">
              Open Admin Data
            </Link>
          </div>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <h3>Verification Requests</h3>
            <p>Use Notifications in the top bar to approve pending pharmacies.</p>
          </div>
          <div className="feature-card">
            <h3>System Monitoring</h3>
            <p>Check users, medicines, pharmacies, and stock records.</p>
          </div>
          <div className="feature-card">
            <h3>Admin Control</h3>
            <p>Keep data clean and ensure verified pharmacies only.</p>
          </div>
        </div>
      </div>
    );
  }

  if (token && user.role === "pharmacy") {
    return (
      <div className="home-hero">
        <div className="home-hero-content">
          <p className="home-tag">Pharmacy Dashboard</p>
          <h1>Manage Pharmacy Medicines and Stock</h1>
          <p className="home-subtitle">
            Search your stock, add new medicines, and update quantity and price from one place.
          </p>
          <div className="actions">
            <Link className="btn" to="/pharmacy-stock">
              View My Stock
            </Link>
            <Link className="btn secondary" to="/pharmacy-add-stock">
              Add or Update Stock
            </Link>
            <Link className="btn" to="/pharmacy-search-stock">
              Search Stock
            </Link>
          </div>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <h3>Stock Visibility</h3>
            <p>Check current quantity and medicine status instantly.</p>
          </div>
          <div className="feature-card">
            <h3>Quick Updates</h3>
            <p>Add medicines and update price/quantity in seconds.</p>
          </div>
          <div className="feature-card">
            <h3>Ready for Search</h3>
            <p>Users can find your live medicine availability.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-hero">
      <div className="home-hero-content">
        <p className="home-tag">Healthcare Location Service</p>
        <h1>Live Medicine Availability Finder</h1>
        <p className="home-subtitle">
          Find nearby pharmacies with live stock status, price, quantity, and distance in seconds.
        </p>
        <div className="actions">
          <Link className="btn" to="/search">
            Search Medicines
          </Link>
          <Link className="btn secondary" to="/emergency">
            Emergency Mode
          </Link>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <h3>Live Stock</h3>
          <p>Check availability before visiting the pharmacy.</p>
        </div>
        <div className="feature-card">
          <h3>Nearby Results</h3>
          <p>Distance-aware search using your location.</p>
        </div>
        <div className="feature-card">
          <h3>Emergency 24/7</h3>
          <p>Quickly find open pharmacies during urgent situations.</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
