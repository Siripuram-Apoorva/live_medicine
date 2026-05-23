const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const {
  getUsers,
  getMedicines,
  getPharmacies,
  getPharmacyFullDetails,
  verifyPharmacy,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/users", getUsers);
router.get("/medicines", getMedicines);
router.get("/pharmacies", getPharmacies);
router.get("/pharmacy-full-details", getPharmacyFullDetails);
router.post("/verify-pharmacy", verifyPharmacy);

module.exports = router;
