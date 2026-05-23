import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function MedicineSearchPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ maxPrice: "", maxDistance: "", onlyAvailable: false });

  const searchMedicine = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isAdmin) {
      try {
        const { data } = await api.get("/medicine/search-medicine", {
          params: { name },
        });
        setRows(data.data || []);
        if ((data.data || []).length === 0) setMessage("No pharmacy has this medicine in dataset.");
      } catch (error) {
        setMessage(error.response?.data?.message || "Search failed");
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const { data } = await api.get("/medicine/search-medicine", {
            params: { name, lat, lng },
          });
          setRows(data.data || []);
          if ((data.data || []).length === 0) setMessage("No medicine found");
        } catch (error) {
          setMessage(error.response?.data?.message || "Search failed");
        }
      },
      async () => {
        try {
          const { data } = await api.get("/medicine/search-medicine", { params: { name } });
          setRows(data.data || []);
        } catch (error) {
          setMessage(error.response?.data?.message || "Search failed");
        }
      }
    );
  };

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const byPrice = !filters.maxPrice || Number(item.price) <= Number(filters.maxPrice);
      const byDistance = !filters.maxDistance || Number(item.distance_km) <= Number(filters.maxDistance);
      const byAvailability = !filters.onlyAvailable || Number(item.stock) > 0;
      return byPrice && byDistance && byAvailability;
    });
  }, [rows, filters]);

  const mapRoute = (lat, lng, pharmacyName) => {
    if (lat === undefined || lng === undefined || lat === null || lng === null) return null;
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
    if (la === 0 && lo === 0) return null;
    const params = new URLSearchParams({
      lat: String(la),
      lng: String(lo),
    });
    if (pharmacyName) params.set("name", pharmacyName);
    return `/map?${params.toString()}`;
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <p className="home-tag">{isAdmin ? "Admin Medicine Search" : "Smart Medicine Search"}</p>
        <h2>
          {isAdmin ? "Find Which Pharmacy Has the Medicine" : "Find Medicine Availability Nearby"}
        </h2>
        <p>
          {isAdmin
            ? "Enter medicine name to see all pharmacies where it is available, with stock and price."
            : "Search by medicine name and filter by price, distance, and stock availability."}
        </p>
      </div>

      <div className="card search-card">
        <form onSubmit={searchMedicine} className="form inline">
          <input
            placeholder="Enter medicine name (e.g., Paracetamol)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>

        {!isAdmin && (
          <div className="filters search-filters">
            <input
              placeholder="Max Price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
            <input
              placeholder="Max Distance (km)"
              type="number"
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })}
            />
            <label className="availability-toggle">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => setFilters({ ...filters, onlyAvailable: e.target.checked })}
              />
              In Stock Only
            </label>
          </div>
        )}

        {message && <p className="message">{message}</p>}

        {isAdmin ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Pharmacy</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Map</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item, idx) => (
                  <tr key={`${item.medicine_id}-${item.pharmacy_name}-${idx}`}>
                    <td>{item.medicine_name}</td>
                    <td>{item.pharmacy_name}</td>
                    <td>{item.stock}</td>
                    <td>Rs. {Number(item.price).toFixed(2)}</td>
                    <td className={Number(item.stock) > 0 ? "in-stock" : "out-stock"}>
                      {Number(item.stock) > 0 ? "Available" : "Out of stock"}
                    </td>
                    <td>
                      {mapRoute(item.latitude, item.longitude, item.pharmacy_name) ? (
                        <Link to={mapRoute(item.latitude, item.longitude, item.pharmacy_name)}>
                          View map
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="list result-grid">
            {filteredRows.map((item, idx) => (
              <div key={`${item.medicine_id}-${idx}`} className="list-item result-card">
                <h3>{item.medicine_name}</h3>
                <p>Pharmacy: {item.pharmacy_name}</p>
                <p>Price: Rs. {Number(item.price).toFixed(2)}</p>
                <p>Distance: {item.distance_km} km</p>
                <p className={Number(item.stock) > 0 ? "in-stock" : "out-stock"}>
                  Stock: {item.stock > 0 ? `${item.stock} available` : "Out of stock"}
                </p>
                {mapRoute(item.latitude, item.longitude, item.pharmacy_name) && (
                  <p>
                    <Link to={mapRoute(item.latitude, item.longitude, item.pharmacy_name)}>
                      View on map
                    </Link>
                  </p>
                )}
                {Number(item.stock) > 0 && (
                  <p className="notification">Available now. You can visit this pharmacy.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicineSearchPage;
