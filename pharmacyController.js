const pool = require("../config/db");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensurePharmacyAccountNotDenied = async (userId) => {
  const userRows = await pool.query(
    `SELECT id, name, role, pharmacy_store_name, pharmacy_verified, pharmacy_verification_status
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (userRows.rowCount === 0) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const user = userRows.rows[0];
  if (user.role !== "pharmacy") {
    return { ok: false, status: 403, message: "Only pharmacy accounts can perform this action" };
  }

  if (user.pharmacy_verification_status === "denied") {
    return { ok: false, status: 403, message: "Pharmacy account verification was denied by admin" };
  }

  return { ok: true, user };
};

const ensureVerifiedPharmacyUser = async (userId) => {
  const userRows = await pool.query(
    `SELECT id, name, pharmacy_store_name, pharmacy_verified, pharmacy_verification_status
     FROM users
     WHERE id = $1 AND role = 'pharmacy'`,
    [userId]
  );

  if (userRows.rowCount === 0) {
    return { ok: false, status: 403, message: "Only pharmacy accounts can perform this action" };
  }

  if (userRows.rows[0].pharmacy_verification_status === "denied") {
    return { ok: false, status: 403, message: "Pharmacy account verification was denied by admin" };
  }

  if (userRows.rows[0].pharmacy_verification_status !== "approved") {
    return { ok: false, status: 403, message: "Pharmacy account is pending admin verification" };
  }

  return { ok: true, user: userRows.rows[0] };
};

const ensurePharmacyProfile = async (userId, fallbackName) => {
  const pharmacyRows = await pool.query("SELECT id FROM pharmacies WHERE user_id = $1", [userId]);
  if (pharmacyRows.rowCount > 0) {
    return pharmacyRows.rows[0].id;
  }

  const profileName = `${fallbackName || "Pharmacy"} #${userId}`;
  const created = await pool.query(
    `INSERT INTO pharmacies (user_id, name, latitude, longitude, open_24x7)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, profileName, 0, 0, false]
  );
  return created.rows[0].id;
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const access = await ensurePharmacyAccountNotDenied(userId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Ensure a profile exists so the pharmacy can immediately save location.
    const pharmacyId = await ensurePharmacyProfile(
      userId,
      access.user.pharmacy_store_name || access.user.name
    );

    const profileRows = await pool.query(
      `SELECT id, name, latitude, longitude, open_24x7
       FROM pharmacies
       WHERE id = $1`,
      [pharmacyId]
    );

    return res.json({
      success: true,
      user: {
        id: access.user.id,
        name: access.user.name,
        pharmacyStoreName: access.user.pharmacy_store_name,
        pharmacyVerified: access.user.pharmacy_verified,
        pharmacyVerificationStatus: access.user.pharmacy_verification_status,
      },
      pharmacy: profileRows.rows[0],
    });
  } catch (error) {
    console.error("getMyProfile error", error);
    return res.status(500).json({ success: false, message: "Could not load pharmacy profile" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, open_24x7 } = req.body;

    const access = await ensurePharmacyAccountNotDenied(userId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const lat = parseNumber(latitude, NaN);
    const lng = parseNumber(longitude, NaN);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude must be valid numbers",
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "latitude must be -90..90 and longitude must be -180..180",
      });
    }

    const pharmacyId = await ensurePharmacyProfile(
      userId,
      access.user.pharmacy_store_name || access.user.name
    );

    await pool.query(
      `UPDATE pharmacies
       SET latitude = $1,
           longitude = $2,
           open_24x7 = $3
       WHERE id = $4`,
      [lat, lng, Boolean(open_24x7), pharmacyId]
    );

    return res.json({ success: true, message: "Pharmacy location updated successfully" });
  } catch (error) {
    console.error("updateMyProfile error", error);
    return res.status(500).json({ success: false, message: "Could not update pharmacy profile" });
  }
};

exports.nearbyPharmacies = async (req, res) => {
  try {
    const lat = parseNumber(req.query.lat, 12.9716);
    const lng = parseNumber(req.query.lng, 77.5946);
    const emergency = req.query.emergency === "true";
    // maxDistance is in km. Keep default generous so "Nearby" isn't empty.
    const maxDistance = parseNumber(req.query.maxDistance, 500);

    // Fetch pharmacies and compute distance in JS for portability and simpler SQL.
    const values = [];
    const filters = [];
    if (emergency) {
      filters.push("open_24x7 = TRUE");
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT id, name, open_24x7, latitude, longitude
       FROM pharmacies
       ${where}`,
      values
    );

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

    const rows = (result.rows || [])
      .map((p) => {
        const la = Number(p.latitude);
        const lo = Number(p.longitude);
        const hasLocation = Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0);
        const distance = hasLocation ? haversineKm(lat, lng, la, lo) : null;
        return {
          ...p,
          distance_km: distance === null ? null : Number(distance.toFixed(2)),
        };
      })
      // Only show pharmacies that have location set and are within range.
      .filter((p) => p.distance_km !== null && p.distance_km <= maxDistance)
      .sort((a, b) => a.distance_km - b.distance_km);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("nearbyPharmacies error", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch nearby pharmacies",
      details: error.message,
    });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId, stock, price } = req.body;

    if (!medicineId || stock === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "medicineId, stock, and price are required",
      });
    }

    const access = await ensureVerifiedPharmacyUser(userId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const pharmacyId = await ensurePharmacyProfile(
      userId,
      access.user.pharmacy_store_name || access.user.name
    );

    await pool.query(
      `INSERT INTO pharmacy_medicines (pharmacy_id, medicine_id, stock, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (pharmacy_id, medicine_id)
       DO UPDATE SET stock = EXCLUDED.stock, price = EXCLUDED.price`,
      [pharmacyId, medicineId, stock, price]
    );

    return res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    console.error("updateStock error", error);
    return res.status(500).json({ success: false, message: "Could not update stock" });
  }
};

exports.getMyStock = async (req, res) => {
  try {
    const userId = req.user.id;

    const pharmacyRows = await pool.query(
      "SELECT id, name FROM pharmacies WHERE user_id = $1",
      [userId]
    );

    if (pharmacyRows.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No pharmacy profile linked to this account",
      });
    }

    const pharmacy = pharmacyRows.rows[0];

    const stockRows = await pool.query(
      `SELECT
         m.id AS medicine_id,
         m.name AS medicine_name,
         m.category,
         pm.stock,
         pm.price,
         (pm.stock > 0) AS available
       FROM pharmacy_medicines pm
       JOIN medicines m ON m.id = pm.medicine_id
       WHERE pm.pharmacy_id = $1
       ORDER BY m.name ASC`,
      [pharmacy.id]
    );

    return res.json({
      success: true,
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
      },
      count: stockRows.rowCount,
      data: stockRows.rows,
    });
  } catch (error) {
    console.error("getMyStock error", error);
    return res.status(500).json({ success: false, message: "Could not fetch pharmacy stock" });
  }
};

exports.addMedicineManual = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineName, category, stock, price } = req.body;

    if (!medicineName || !category || stock === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "medicineName, category, stock, and price are required",
      });
    }

    const access = await ensureVerifiedPharmacyUser(userId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const pharmacyId = await ensurePharmacyProfile(
      userId,
      access.user.pharmacy_store_name || access.user.name
    );

    const medicineLookup = await pool.query(
      "SELECT id FROM medicines WHERE LOWER(name) = LOWER($1)",
      [medicineName.trim()]
    );

    let medicineId;
    if (medicineLookup.rowCount > 0) {
      medicineId = medicineLookup.rows[0].id;
    } else {
      const createdMedicine = await pool.query(
        "INSERT INTO medicines (name, category) VALUES ($1, $2) RETURNING id",
        [medicineName.trim(), category.trim()]
      );
      medicineId = createdMedicine.rows[0].id;
    }

    await pool.query(
      `INSERT INTO pharmacy_medicines (pharmacy_id, medicine_id, stock, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (pharmacy_id, medicine_id)
       DO UPDATE SET stock = EXCLUDED.stock, price = EXCLUDED.price`,
      [pharmacyId, medicineId, stock, price]
    );

    return res.json({ success: true, message: "Medicine added/updated successfully" });
  } catch (error) {
    console.error("addMedicineManual error", error);
    return res.status(500).json({ success: false, message: "Could not add medicine manually" });
  }
};
