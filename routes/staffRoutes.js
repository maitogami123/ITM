const express = require("express");
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  listSalaryIncrements,
  getAvailableStaff,
  getStaffUnitLess,
  updateStaffUnit,
  getStaffSalaryIncrementStatus,
} = require("../controllers/staffController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Create a new staff member (requires superadmin role)
router.post("/", authMiddleware(["superadmin"]), createStaff);

// Get all staff members (requires authentication)
router.get("/", getStaff);

router.get("/available", authMiddleware(["superadmin", "leader"]), getAvailableStaff);

router.get("/unitless", authMiddleware(["superadmin", "leader"]), getStaffUnitLess);

// Get list salary increments (requires authentication)
router.get("/increments", authMiddleware(["superadmin", "leader"]), listSalaryIncrements);

// Get a single staff member by ID (requires authentication)
router.get("/:id", getStaffById);

// Update a staff member by ID (requires superadmin role)
router.patch("/:id", authMiddleware(["superadmin"]), updateStaff);

router.patch("/:staffId/unit/:unitId", authMiddleware(["superadmin"]), updateStaffUnit);

router.get("/:id/salaryIncrementStatus", getStaffSalaryIncrementStatus);

// Delete a staff member by ID (requires superadmin role)
router.delete("/:id", authMiddleware(["superadmin"]), deleteStaff);

module.exports = router;
