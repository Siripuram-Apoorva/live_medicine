import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function NearbyPharmacyPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Keep a generous default so users actually see pharmacies without tweaking inputs.
  const maxDistance = 500;

  const mapRoute = (lat, lng, pharmacyName) => {
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

  const loadNearby = useCallback(() => {
    setMessage("");
    setLoading(true);
    setRows([]);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await api.get("/pharmacy/nearby-pharmacies", {
            params: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              maxDistance,
            },
          });
          setRows(data.data || []);
          if (!(data.data || []).length) {
            setMessage("No nearby pharmacies found. Ask pharmacies to set their location in Profile.");
          }
        } catch (error) {
          setMessage(error.response?.data?.message || "Could not load nearby pharmacies");
        } finally {
          setLoading(false);
        }
      },
      async () => {
        try {
          const { data } = await api.get("/pharmacy/nearby-pharmacies", {
            params: { maxDistance },
          });
          setRows(data.data || []);
          if (!(data.data || []).length) {
            setMessage("No nearby pharmacies found. Ask pharmacies to set their location in Profile.");
          }
        } catch (error) {
          setMessage(error.response?.data?.message || "Could not load nearby pharmacies");
        } finally {
          setLoading(false);
        }
      }
    );
  }, []);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  return (
    <div className="card">
      <h2>Nearby Pharmacies</h2>
      <button className="btn" onClick={loadNearby} disabled={loading}>
        {loading ? "Finding..." : "Refresh"}
      </button>
      {message && <p className="message">{message}</p>}
      <div className="list">
        {rows.map((item) => (
          <div className="list-item" key={item.id}>
            <h3>{item.name}</h3>
            <p>
              Distance:{" "}
              {item.distance_km === null || item.distance_km === undefined
                ? "Location not set"
                : `${item.distance_km} away`}
            </p>
            <p>{item.open_24x7 ? "Open 24/7" : "Limited hours"}</p>
            {mapRoute(item.latitude, item.longitude, item.name) && (
              <p>
                <Link to={mapRoute(item.latitude, item.longitude, item.name)}>
                  View on map
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NearbyPharmacyPage;
