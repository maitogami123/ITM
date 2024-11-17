const express = require('express');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new user (requires superadmin role)
router.post('/', authMiddleware(['superadmin']), createUser);

// Get all users (requires authentication)
router.get('/', authMiddleware(['superadmin', 'leader']), getUsers);

// Get a single user by ID (requires authentication)
router.get(
  '/:id',
  authMiddleware(['superadmin', 'leader', 'lecturer']),
  getUserById
);

// Update a user by ID (requires superadmin role)
router.patch('/:id', authMiddleware(['superadmin']), updateUser);
router.patch(
  '/:id/basic',
  authMiddleware(['superadmin', 'leader', 'lecturer']),
  updateUser
);

// Delete a user by ID (requires superadmin role)
router.delete('/:id', authMiddleware(['superadmin']), deleteUser);

module.exports = router;
