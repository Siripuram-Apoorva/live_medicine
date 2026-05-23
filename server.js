const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./src/routes/authRoutes");
const medicineRoutes = require("./src/routes/medicineRoutes");
const pharmacyRoutes = require("./src/routes/pharmacyRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
