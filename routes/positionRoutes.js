const express = require('express');
const {
  createPosition,
  getPositions,
  getPositionById,
  updatePosition,
  deletePosition,
} = require('../controllers/positionController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new position (requires superadmin role)
router.post('/', authMiddleware(['superadmin']), createPosition);

// Get all positions (requires authentication)
router.get('/', authMiddleware(['superadmin', 'leader', 'lecturer']), getPositions);

// Get a single position by ID (requires authentication)
router.get('/:id', authMiddleware(['superadmin', 'leader', 'lecturer']), getPositionById);

// Update a position by ID (requires superadmin role)
router.put('/:id', authMiddleware(['superadmin']), updatePosition);

// Delete a position by ID (requires superadmin role)
router.delete('/:id', authMiddleware(['superadmin']), deletePosition);

module.exports = router;
