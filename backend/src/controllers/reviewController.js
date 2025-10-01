import { validationResult } from 'express-validator';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { aiService } from '../services/aiService.js';
import { blockchainService } from '../services/blockchainService.js';

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'approved',
      category,
      sentiment,
      rating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId
    } = req.query;

    // Build query
    const query = {};
    
    // Only show approved reviews to non-admin users
    if (req.user?.role !== 'admin') {
      query.status = 'approved';
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;
    if (sentiment) query.sentiment = sentiment;
    if (rating) query.rating = parseInt(rating);
    if (userId) query.user = userId;

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Add text score for search results
    if (search) {
      sort.score = { $meta: 'textScore' };
    }

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'user',
        select: 'name email avatar reputation level'
      }
    };

    const reviews = await Review.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email avatar reputation level');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only show approved reviews to non-admin users
    if (review.status !== 'approved' && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment view count
    review.views += 1;
    await review.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review'
    });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productName, category, title, content, rating, qrCode } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      productName: productName.trim()
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const reviewData = {
      user: req.user.id,
      productName: productName.trim(),
      category,
      title: title.trim(),
      content: content.trim(),
      rating,
      qrCode,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    };

    const review = await Review.create(reviewData);

    // Process with AI in background
    processReviewWithAI(review._id);

    // Update user review count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { reviewCount: 1 }
    });

    // Populate user data
    await review.populate('user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review'
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Only allow updates if review is pending or user is admin
    if (review.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved or rejected reviews'
      });
    }

    const { productName, title, content, rating } = req.body;

    // Update fields
    if (productName) review.productName = productName.trim();
    if (title) review.title = title.trim();
    if (content) review.content = content.trim();
    if (rating) review.rating = rating;

    // Reset status to pending if content changed
    if (content || title || rating) {
      review.status = 'pending';
      review.moderatedAt = null;
      review.moderatedBy = null;
    }

    await review.save();

    // Re-process with AI if content changed
    if (content || title || rating) {
      processReviewWithAI(review._id);
    }

    await review.populate('user', 'name email avatar');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update user review count
    await User.findByIdAndUpdate(review.user, {
      $inc: { reviewCount: -1 }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review'
    });
  }
};

// @desc    Update review status (admin only)
// @route   PATCH /api/reviews/:id/status
// @access  Private/Admin
export const updateReviewStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, moderationNotes } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    review.moderatedBy = req.user.id;
    review.moderatedAt = new Date();
    if (moderationNotes) review.moderationNotes = moderationNotes;

    await review.save();

    // Update user reputation based on review status
    const reputationChange = status === 'approved' ? 10 : -5;
    await User.findByIdAndUpdate(review.user, {
      $inc: { reputation: reputationChange }
    });

    await review.populate('user', 'name email avatar');

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: { review }
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review status'
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    if (review.helpfulUsers.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    await review.markHelpful(req.user.id);

    // Update reviewer's reputation
    await User.findByIdAndUpdate(review.user, {
      $inc: { reputation: 2, helpfulVotes: 1 }
    });

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpful: review.helpful }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking review as helpful'
    });
  }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reportedBy.find(
      report => report.user.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    await review.reportReview(req.user.id, reason);

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting review'
    });
  }
};

// @desc    Verify purchase with QR code
// @route   POST /api/reviews/verify-purchase
// @access  Public
export const verifyPurchase = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }

    // Simulate purchase verification
    // In a real implementation, this would integrate with retailer APIs
    const isValidQR = qrCode.startsWith('PRODUCT_');
    
    if (!isValidQR) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockPurchaseData = {
      verified: Math.random() > 0.2, // 80% success rate
      productId: qrCode,
      productName: 'iPhone 15 Pro Max',
      purchaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      orderId: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      retailer: ['Apple Store', 'Amazon', 'Best Buy', 'Target'][Math.floor(Math.random() * 4)],
      price: Math.floor(Math.random() * 500) + 800,
      warranty: Math.random() > 0.3
    };

    res.json({
      success: true,
      data: mockPurchaseData
    });
  } catch (error) {
    console.error('Verify purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during purchase verification'
    });
  }
};

// Background function to process review with AI
async function processReviewWithAI(reviewId) {
  try {
    const review = await Review.findById(reviewId);
    if (!review) return;

    // AI Analysis
    const aiAnalysis = await aiService.analyzeSentiment({
      title: review.title,
      content: review.content,
      rating: review.rating,
      productName: review.productName
    });

    // Blockchain processing
    const blockchainHash = await blockchainService.generateHash({
      title: review.title,
      content: review.content,
      rating: review.rating,
      timestamp: review.createdAt.toISOString(),
      userId: review.user.toString()
    });

    // Update review with AI results
    await Review.findByIdAndUpdate(reviewId, {
      sentiment: aiAnalysis.sentiment,
      sentimentScore: aiAnalysis.score,
      summary: aiAnalysis.summary,
      keywords: aiAnalysis.keywords,
      isFake: aiAnalysis.isFake,
      fakeConfidence: aiAnalysis.fakeConfidence,
      aiProvider: aiAnalysis.provider,
      blockchainHash,
      blockchainVerified: true
    });

    console.log(`Review ${reviewId} processed with AI and blockchain`);
  } catch (error) {
    console.error('AI processing error:', error);
  }
}