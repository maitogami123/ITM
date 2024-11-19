const express = require("express");
const {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  updateCompetition,
  deleteCompetition,
  addProjectToCompetition,
  removeProjectFromCompetition,
  exportCompetitionStatistics,
  removeStaffFromCompetition,
} = require("../controllers/competitionController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Create a new competition (requires superadmin role)
router.post("/", authMiddleware(["superadmin"]), createCompetition);

// Get all competitions (requires authentication)
router.get(
  "/",
  authMiddleware(["superadmin", "leader", "lecturer"]),
  getCompetitions
);

// Get a single competition by ID (requires authentication)
router.get(
  "/:id",
  authMiddleware(["superadmin", "leader", "lecturer"]),
  getCompetitionById
);

// Update a competition by ID (requires superadmin role)
router.put("/:id", authMiddleware(["superadmin"]), updateCompetition);

// Delete a competition by ID (requires superadmin role)
router.delete("/:id", authMiddleware(["superadmin"]), deleteCompetition);

// Add a research project to a competition (requires superadmin role)
router.post(
  "/:id/projects",
  authMiddleware(["superadmin"]),
  addProjectToCompetition
);

// Remove a research project from a competition (requires superadmin role)
router.delete(
  "/:id/projects/:projectId",
  authMiddleware(["superadmin"]),
  removeProjectFromCompetition
);

// Remove a staff from a competition (requires superadmin role)
router.delete(
  "/:id/staff/:staffId",
  authMiddleware(["superadmin"]),
  removeStaffFromCompetition
);

// Export statistics of competitions
router.get(
  "/export/staffs",
  authMiddleware(["superadmin", "leader", "lecturer"]),
  exportCompetitionStatistics
);

module.exports = router;
