import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix missing default marker icons in CRA builds.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { lat, lng, name } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const la = Number(params.get("lat"));
    const lo = Number(params.get("lng"));
    const nm = params.get("name") || "Pharmacy";
    return {
      lat: Number.isFinite(la) ? la : null,
      lng: Number.isFinite(lo) ? lo : null,
      name: nm,
    };
  }, [location.search]);

  const googleMapsUrl =
    lat === null || lng === null ? null : `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;

  if (lat === null || lng === null) {
    return (
      <div className="card">
        <h2>Map</h2>
        <p className="message">Location is missing. Open the map from Search or Nearby results.</p>
        <p className="muted">
          Go to <Link to="/search">Search</Link> or <Link to="/nearby">Nearby</Link> and click "View map".
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="map-header">
        <div>
          <h2>Map</h2>
          <p className="muted">
            Showing location for <strong>{name}</strong>
          </p>
        </div>
        <div className="map-actions">
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          {googleMapsUrl && (
            <a className="btn" href={googleMapsUrl} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          )}
        </div>
      </div>

      <div className="map-wrap">
        <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>
              <strong>{name}</strong>
              <br />
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPage;

