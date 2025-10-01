import express from 'express';
import {
  getAnalytics,
  getReviewAnalytics,
  getDashboardStats
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAnalytics);
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/reviews/:id', protect, authorize('admin'), getReviewAnalytics);

export default router;