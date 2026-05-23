const express = require("express");
const { searchMedicine, alternativeMedicine } = require("../controllers/medicineController");

const router = express.Router();

router.get("/search-medicine", searchMedicine);
router.get("/alternative-medicine", alternativeMedicine);

module.exports = router;
