import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix missing default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapPicker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function PharmacyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ latitude: "", longitude: "", open_24x7: false });
  const [message, setMessage] = useState("Loading profile...");

  // Default center (Bengaluru) so the map isn't blank even before setting location.
  const defaultCenter = [12.9716, 77.5946];

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

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/pharmacy/my-profile");
      setProfile(data);
      setForm({
        latitude: data.pharmacy?.latitude ?? "",
        longitude: data.pharmacy?.longitude ?? "",
        open_24x7: Boolean(data.pharmacy?.open_24x7),
      });
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePositionChange = useCallback((latlng) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(latlng.lat),
      longitude: String(latlng.lng),
    }));
  }, []);

  const useMyLocation = () => {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => setMessage("Could not fetch your current location. Please allow location permission.")
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.put("/pharmacy/my-profile", {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        open_24x7: Boolean(form.open_24x7),
      });
      setMessage("Location saved successfully.");
      await loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save location");
    }
  };

  const currentPos =
    form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : null;

  const pharmacyLabel =
    profile?.user?.pharmacyStoreName || profile?.pharmacy?.name || profile?.user?.name || "Pharmacy";

  const viewMapUrl = mapRoute(form.latitude, form.longitude, pharmacyLabel);

  return (
    <div className="card">
      <h2>Pharmacy Profile</h2>
      <p>Set your pharmacy location so users can locate you.</p>

      {profile?.user && (
        <div className="section-block">
          <p>
            <strong>Store:</strong> {profile.user.pharmacyStoreName || profile.user.name}
          </p>
          <p>
            <strong>Verification:</strong> {profile.user.pharmacyVerificationStatus}
          </p>
        </div>
      )}

      <div className="section-block">
        <div className="actions">
          <button type="button" className="btn secondary" onClick={useMyLocation}>
          Use My Current Location
          </button>
        </div>
        
        <div className="map-wrap map-wrap-profile">
          <MapContainer
            center={currentPos || defaultCenter}
            zoom={currentPos ? 15 : 12}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapPicker position={currentPos} onPositionChange={handlePositionChange} />
          </MapContainer>
        </div>
        
        <p className="muted">
          Click on the map to set your pharmacy location precisely.
        </p>

        <form className="form" onSubmit={handleSave}>
          <div className="form-row">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              required
            />
          </div>
          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={form.open_24x7}
              onChange={(e) => setForm((prev) => ({ ...prev, open_24x7: e.target.checked }))}
            />
            Open 24/7
          </label>
          <div className="actions">
            <button className="btn" type="submit">
              Save Profile
            </button>
            {viewMapUrl && (
              <Link className="btn secondary" to={viewMapUrl}>
                View on map
              </Link>
            )}
          </div>
        </form>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default PharmacyProfilePage;
