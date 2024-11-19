const express = require('express');
const {
  createUnit,
  getUnit,
  getUnitById,
  updateUnit,
  deleteUnit,
  removeStaffFromUnit,
} = require('../controllers/unitController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new unit (requires superadmin role)
router.post('/', authMiddleware(['superadmin']), createUnit);

// Get all unit (requires authentication)
router.get('/', authMiddleware(['superadmin', 'leader', 'lecturer']), getUnit);

// Get a single unit by ID (requires authentication)
router.get(
  '/:id',
  authMiddleware(['superadmin', 'leader', 'lecturer']),
  getUnitById
);

// Update a unit by ID (requires superadmin role)
router.patch('/:id', authMiddleware(['superadmin']), updateUnit);

// Delete a unit by ID (requires superadmin role)
router.delete('/:id', authMiddleware(['superadmin']), deleteUnit);

router.delete(
  '/:unitId/staff/:staffId',
  authMiddleware(['superadmin']),
  removeStaffFromUnit
);

module.exports = router;
