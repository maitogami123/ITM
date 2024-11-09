const express = require('express');
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  listSalaryIncrements,
} = require('../controllers/staffController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new staff member (requires superadmin role)
router.post('/', authMiddleware(['superadmin']), createStaff);

// Get all staff members (requires authentication)
router.get('/', authMiddleware(['superadmin', 'leader', 'lecturer']), getStaff);

// Get list salary increments (requires authentication)
router.get(
  "/increments",
  authMiddleware(["superadmin", "leader"]),
  listSalaryIncrements
);

// Get a single staff member by ID (requires authentication)
router.get('/:id', authMiddleware(['superadmin', 'leader', 'lecturer']), getStaffById);

// Update a staff member by ID (requires superadmin role)
router.put('/:id', authMiddleware(['superadmin']), updateStaff);

// Delete a staff member by ID (requires superadmin role)
router.delete('/:id', authMiddleware(['superadmin']), deleteStaff);



module.exports = router;
