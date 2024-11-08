const express = require("express");
const {
  createUnit,
  getUnit,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require("../controllers/unitController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Create a new unit (requires superadmin role)
router.post("/", authMiddleware(["superadmin"]), createUnit);

// Get all unit (requires authentication)
router.get("/", authMiddleware(["superadmin", "leader", "lecturer"]), getUnit);

// Get a single unit by ID (requires authentication)
router.get(
  "/:id",
  authMiddleware(["superadmin", "leader", "lecturer"]),
  getUnitById
);

// Update a unit by ID (requires superadmin role)
router.put("/:id", authMiddleware(["superadmin"]), updateUnit);

// Delete a unit by ID (requires superadmin role)
router.delete("/:id", authMiddleware(["superadmin"]), deleteUnit);

module.exports = router;
