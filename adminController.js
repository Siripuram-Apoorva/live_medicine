const pool = require("../config/db");

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         role,
         pharmacy_verified,
         pharmacy_verification_status,
         pharmacy_license_no,
         pharmacy_store_name,
         created_at
       FROM users
       ORDER BY id DESC`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("getUsers error", error);
    return res.status(500).json({ success: false, message: "Could not fetch users" });
  }
};

exports.verifyPharmacy = async (req, res) => {
  try {
    const { userId, approved } = req.body;

    if (!userId || approved === undefined) {
      return res.status(400).json({ success: false, message: "userId and approved are required" });
    }

    const userResult = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userResult.rows[0].role !== "pharmacy") {
      return res.status(400).json({ success: false, message: "Only pharmacy users can be verified" });
    }

    const nextStatus = approved ? "approved" : "denied";
    await pool.query(
      "UPDATE users SET pharmacy_verified = $1, pharmacy_verification_status = $2 WHERE id = $3",
      [Boolean(approved), nextStatus, userId]
    );

    return res.json({
      success: true,
      message: approved ? "Pharmacy verified successfully" : "Pharmacy verification denied",
    });
  } catch (error) {
    console.error("verifyPharmacy error", error);
    return res.status(500).json({ success: false, message: "Could not update pharmacy verification" });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, category FROM medicines ORDER BY id DESC");
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("getMedicines error", error);
    return res.status(500).json({ success: false, message: "Could not fetch medicines" });
  }
};

exports.getPharmacies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.latitude,
         p.longitude,
         p.open_24x7,
         u.email AS owner_email
       FROM pharmacies p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.id DESC`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("getPharmacies error", error);
    return res.status(500).json({ success: false, message: "Could not fetch pharmacies" });
  }
};

exports.getPharmacyFullDetails = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id AS pharmacy_id,
         p.name AS pharmacy_name,
         p.latitude,
         p.longitude,
         p.open_24x7,
         u.id AS owner_user_id,
         u.name AS owner_name,
         u.email AS owner_email,
         u.pharmacy_verified,
         u.pharmacy_verification_status,
         u.pharmacy_license_no,
         u.pharmacy_store_name,
         m.id AS medicine_id,
         m.name AS medicine_name,
         m.category,
         pm.stock,
         pm.price
       FROM pharmacies p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN pharmacy_medicines pm ON pm.pharmacy_id = p.id
       LEFT JOIN medicines m ON m.id = pm.medicine_id
       ORDER BY p.id DESC, m.name ASC`
    );

    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("getPharmacyFullDetails error", error);
    return res.status(500).json({ success: false, message: "Could not fetch full pharmacy details" });
  }
};
