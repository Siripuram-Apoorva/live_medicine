const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const allowedRoles = ["user", "pharmacy"];

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, pharmacyLicenseNo, pharmacyStoreName } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const safeRole = role || "user";
    if (!allowedRoles.includes(safeRole)) {
      return res.status(400).json({ success: false, message: "Only user or pharmacy role is allowed" });
    }

    if (safeRole === "pharmacy" && (!pharmacyLicenseNo || !pharmacyStoreName)) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy license number and pharmacy store name are required",
      });
    }

    const existingUsers = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUsers.rowCount > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, role, pharmacy_verified, pharmacy_verification_status, pharmacy_license_no, pharmacy_store_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        name,
        email,
        hashedPassword,
        safeRole,
        safeRole === "pharmacy" ? false : true,
        safeRole === "pharmacy" ? "pending" : "approved",
        safeRole === "pharmacy" ? pharmacyLicenseNo : null,
        safeRole === "pharmacy" ? pharmacyStoreName : null,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        safeRole === "pharmacy"
          ? "Pharmacy registered. Await admin verification before stock updates."
          : "User registered successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const users = await pool.query(
      `SELECT id, name, email, password, role, pharmacy_verified, pharmacy_verification_status
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (users.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = users.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role === "pharmacy" && user.pharmacy_verification_status === "denied") {
      return res.status(403).json({
        success: false,
        message: "Pharmacy account verification request was denied by admin",
      });
    }

    if (user.role === "pharmacy" && user.pharmacy_verification_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Pharmacy account pending admin verification",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pharmacyVerified: user.pharmacy_verified,
        pharmacyVerificationStatus: user.pharmacy_verification_status,
      },
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};
