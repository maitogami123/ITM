const express = require('express');
const { createReward, getRewards, getRewardById, updateReward, deleteReward } = require('../controllers/rewardController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new reward (requires superadmin role)
router.post('/', authMiddleware(['superadmin']), createReward);

// Get all rewards (requires authentication)
router.get('/', authMiddleware(['superadmin', 'leader', 'lecturer']), getRewards);

// Get a single reward by ID (requires authentication)
router.get('/:id', authMiddleware(['superadmin', 'leader', 'lecturer']), getRewardById);

// Update a reward by ID (requires superadmin role)
router.put('/:id', authMiddleware(['superadmin']), updateReward);

// Delete a reward by ID (requires superadmin role)
router.delete('/:id', authMiddleware(['superadmin']), deleteReward);

module.exports = router;
