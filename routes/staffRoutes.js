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
  exportSalaryIncrementsToExcel,
  updateTeacherGrade,
  promoteSalaryLevel,
  getSalaryInfo,
  demoteSalaryLevel,
  uploadStaffImage,
} = require("../controllers/staffController");
const authMiddleware = require("../middlewares/authMiddleware");

const upload = require("../utils/multer");
const router = express.Router();

// Create a new staff member (requires superadmin role)
router.post("/", authMiddleware(["superadmin"]), createStaff);

// Get all staff members (requires authentication)
router.get("/", getStaff);

router.get(
  "/available",
  authMiddleware(["superadmin", "leader"]),
  getAvailableStaff
);

router.get(
  "/unitless",
  authMiddleware(["superadmin", "leader"]),
  getStaffUnitLess
);

// Get list salary increments (requires authentication)
router.get(
  "/increments",
  authMiddleware(["superadmin", "leader"]),
  listSalaryIncrements
);

// Get a single staff member by ID (requires authentication)
router.get("/:id", getStaffById);

// Update a staff member by ID (requires superadmin role)
router.patch("/:id", authMiddleware(["superadmin"]), updateStaff);

router.patch(
  "/:staffId/unit/:unitId",
  authMiddleware(["superadmin"]),
  updateStaffUnit
);

router.get("/:id/salaryIncrementStatus", getStaffSalaryIncrementStatus);

router.get(
  "/export/salary",
  authMiddleware(["superadmin", "leader", "lecturer"]),
  exportSalaryIncrementsToExcel
);

// Delete a staff member by ID (requires superadmin role)
router.delete("/:id", authMiddleware(["superadmin"]), deleteStaff);

router.patch(
  "/:id/teacher-grade",
  authMiddleware(["superadmin"]),
  updateTeacherGrade
);

router.patch(
  "/:id/promote",
  authMiddleware(["superadmin"]),
  promoteSalaryLevel
);

router.get("/:id/salary", authMiddleware(["superadmin"]), getSalaryInfo);

router.patch("/:id/demote", demoteSalaryLevel);

// Endpoint để upload ảnh nhân viên
router.post(
  "/:id/upload-image",
  authMiddleware(["superadmin", "leader"]),
  upload.single("image"),
  uploadStaffImage
);

module.exports = router;
