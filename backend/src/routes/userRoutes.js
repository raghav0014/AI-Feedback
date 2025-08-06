import express from 'express';
import {
  getUsers,
  getUser,
  updateUserRole,
  deactivateUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, getUser);
router.patch('/:id/role', protect, authorize('admin'), updateUserRole);
router.patch('/:id/deactivate', protect, authorize('admin'), deactivateUser);

export default router;