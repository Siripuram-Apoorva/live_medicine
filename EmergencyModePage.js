import React, { useEffect, useState } from "react";
import api from "../api/axios";

function EmergencyModePage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("Loading emergency pharmacies...");

  useEffect(() => {
    const fetchEmergency = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { data } = await api.get("/pharmacy/nearby-pharmacies", {
              params: {
                emergency: true,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            });
            setRows(data.data || []);
            setMessage((data.data || []).length ? "" : "No 24/7 pharmacies found nearby.");
          } catch (error) {
            setMessage(error.response?.data?.message || "Could not load emergency pharmacies");
          }
        },
        async () => {
          try {
            const { data } = await api.get("/pharmacy/nearby-pharmacies", { params: { emergency: true } });
            setRows(data.data || []);
            setMessage((data.data || []).length ? "" : "No 24/7 pharmacies found nearby.");
          } catch (error) {
            setMessage(error.response?.data?.message || "Could not load emergency pharmacies");
          }
        }
      );
    };

    fetchEmergency();
  }, []);

  return (
    <div className="card">
      <h2>Emergency Mode</h2>
      <p>Showing only nearby 24/7 pharmacies.</p>
      {message && <p className="message">{message}</p>}
      <div className="list">
        {rows.map((item) => (
          <div className="list-item" key={item.id}>
            <h3>{item.name}</h3>
            <p>Distance: {item.distance_km} km</p>
            <p className="in-stock">Open 24/7</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmergencyModePage;
