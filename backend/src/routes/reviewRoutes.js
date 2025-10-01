import express from 'express';
import { body, query } from 'express-validator';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
  markHelpful,
  reportReview,
  verifyPurchase
} from '../controllers/reviewController.js';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const createReviewValidation = [
  body('productName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('category')
    .isIn([
      'Technology', 'Automotive', 'Food & Dining', 'Healthcare', 
      'Education', 'Entertainment', 'Travel', 'Finance', 'Fashion',
      'Home & Garden', 'Sports & Fitness', 'Books & Media', 'Other'
    ])
    .withMessage('Invalid category'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

const updateReviewValidation = [
  body('productName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

const statusValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected')
];

const reportValidation = [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters')
];

// Routes
router.get('/', optionalAuth, getReviews);
router.get('/:id', optionalAuth, getReview);
router.post('/', protect, createReviewValidation, createReview);
router.put('/:id', protect, updateReviewValidation, updateReview);
router.delete('/:id', protect, deleteReview);
router.patch('/:id/status', protect, authorize('admin'), statusValidation, updateReviewStatus);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/report', protect, reportValidation, reportReview);
router.post('/verify-purchase', verifyPurchase);

export default router;