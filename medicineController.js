const pool = require("../config/db");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.searchMedicine = async (req, res) => {
  try {
    const name = req.query.name || "";
    const latRaw = req.query.lat;
    const lngRaw = req.query.lng;
    const hasCoords = latRaw !== undefined && lngRaw !== undefined;
    const lat = parseNumber(latRaw, NaN);
    const lng = parseNumber(lngRaw, NaN);

    if (!name.trim()) {
      return res.status(400).json({ success: false, message: "name query param is required" });
    }

    const query = `
      SELECT
        m.id AS medicine_id,
        m.name AS medicine_name,
        pm.stock,
        pm.price,
        p.id AS pharmacy_id,
        p.name AS pharmacy_name,
        p.open_24x7,
        p.latitude,
        p.longitude
      FROM medicines m
      JOIN pharmacy_medicines pm ON pm.medicine_id = m.id
      JOIN pharmacies p ON p.id = pm.pharmacy_id
      WHERE m.name ILIKE $1
      ORDER BY pm.stock DESC, p.name ASC
    `;

    const result = await pool.query(query, [`%${name}%`]);

    const toRad = (deg) => (deg * Math.PI) / 180;
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          (Math.sin(dLon / 2) * Math.sin(dLon / 2));
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
    };

    const rows = (result.rows || []).map((r) => {
      const la = Number(r.latitude);
      const lo = Number(r.longitude);
      const hasPharmacyCoords =
        Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0);

      let distance = null;
      if (hasCoords && Number.isFinite(lat) && Number.isFinite(lng) && hasPharmacyCoords) {
        distance = haversineKm(lat, lng, la, lo);
      }

      return {
        ...r,
        distance_km: distance === null ? null : Number(distance.toFixed(2)),
      };
    });

    // If we have user coords, sort by distance (null last) then stock.
    if (hasCoords && Number.isFinite(lat) && Number.isFinite(lng)) {
      rows.sort((a, b) => {
        const ad = a.distance_km;
        const bd = b.distance_km;
        if (ad === null && bd === null) return Number(b.stock) - Number(a.stock);
        if (ad === null) return 1;
        if (bd === null) return -1;
        if (ad !== bd) return ad - bd;
        return Number(b.stock) - Number(a.stock);
      });
    }

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("searchMedicine error", error);
    return res.status(500).json({ success: false, message: "Could not search medicine" });
  }
};

exports.alternativeMedicine = async (req, res) => {
  try {
    const category = req.query.category || "";

    if (!category.trim()) {
      return res.status(400).json({ success: false, message: "category query param is required" });
    }

    const result = await pool.query(
      "SELECT id, name, category FROM medicines WHERE category ILIKE $1 ORDER BY name ASC",
      [`%${category}%`]
    );

    return res.json({
      success: true,
      count: result.rowCount,
      alternatives: result.rows,
    });
  } catch (error) {
    console.error("alternativeMedicine error", error);
    return res.status(500).json({ success: false, message: "Could not fetch alternatives" });
  }
};
