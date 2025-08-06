import Review from '../models/Review.js';
import User from '../models/User.js';
import Analytics from '../models/Analytics.js';

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get review statistics
    const reviewStats = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          verified: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          },
          fake: {
            $sum: { $cond: ['$isFake', 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          totalViews: { $sum: '$views' },
          totalHelpful: { $sum: '$helpful' },
          totalReports: { $sum: '$reportCount' }
        }
      }
    ]);

    // Get sentiment distribution
    const sentimentStats = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category statistics
    const categoryStats = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format response
    const analytics = {
      timeRange,
      reviews: reviewStats[0] || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        verified: 0,
        fake: 0,
        avgRating: 0,
        totalViews: 0,
        totalHelpful: 0,
        totalReports: 0
      },
      users: userStats[0] || { total: 0, active: 0 },
      sentiment: {
        positive: sentimentStats.find(s => s._id === 'positive')?.count || 0,
        negative: sentimentStats.find(s => s._id === 'negative')?.count || 0,
        neutral: sentimentStats.find(s => s._id === 'neutral')?.count || 0
      },
      categories: categoryStats.map(cat => ({
        category: cat._id,
        count: cat.count,
        avgRating: Math.round(cat.avgRating * 10) / 10
      })),
      ratings: {
        distribution: {
          1: ratingStats.find(r => r._id === 1)?.count || 0,
          2: ratingStats.find(r => r._id === 2)?.count || 0,
          3: ratingStats.find(r => r._id === 3)?.count || 0,
          4: ratingStats.find(r => r._id === 4)?.count || 0,
          5: ratingStats.find(r => r._id === 5)?.count || 0
        }
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Get current counts
    const [totalReviews, totalUsers, pendingReviews, todayReviews] = await Promise.all([
      Review.countDocuments(),
      User.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Get recent activity
    const recentReviews = await Review.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalReviews,
      totalUsers,
      pendingReviews,
      todayReviews,
      recentActivity: recentReviews
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats'
    });
  }
};

// @desc    Get review analytics
// @route   GET /api/analytics/reviews/:id
// @access  Private/Admin
export const getReviewAnalytics = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const analytics = {
      views: review.views,
      helpful: review.helpful,
      reports: review.reportCount,
      engagement: review.views > 0 ? (review.helpful / review.views * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get review analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review analytics'
    });
  }
};