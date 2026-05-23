const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const {
  nearbyPharmacies,
  getMyProfile,
  updateMyProfile,
  updateStock,
  getMyStock,
  addMedicineManual,
} = require("../controllers/pharmacyController");

const router = express.Router();

router.get("/nearby-pharmacies", nearbyPharmacies);
router.get("/my-profile", authenticate, authorizeRoles("pharmacy"), getMyProfile);
router.put("/my-profile", authenticate, authorizeRoles("pharmacy"), updateMyProfile);
router.get("/my-stock", authenticate, authorizeRoles("pharmacy"), getMyStock);
router.post("/update-stock", authenticate, authorizeRoles("pharmacy"), updateStock);
router.post("/add-medicine", authenticate, authorizeRoles("pharmacy"), addMedicineManual);

module.exports = router;
