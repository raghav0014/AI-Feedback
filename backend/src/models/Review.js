import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technology', 'Automotive', 'Food & Dining', 'Healthcare', 
      'Education', 'Entertainment', 'Travel', 'Finance', 'Fashion',
      'Home & Garden', 'Sports & Fitness', 'Books & Media', 'Other'
    ]
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    minlength: [10, 'Content must be at least 10 characters'],
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // AI Analysis Results
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  sentimentScore: {
    type: Number,
    default: 0,
    min: -1,
    max: 1
  },
  summary: {
    type: String,
    default: ''
  },
  keywords: [{
    type: String,
    trim: true
  }],
  isFake: {
    type: Boolean,
    default: false
  },
  fakeConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  aiProvider: {
    type: String,
    enum: ['openai', 'huggingface', 'fallback'],
    default: 'fallback'
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  qrCode: {
    type: String,
    default: null
  },
  purchaseData: {
    orderId: String,
    retailer: String,
    purchaseDate: Date,
    price: Number,
    warranty: Boolean
  },

  // Blockchain
  blockchainHash: {
    type: String,
    default: ''
  },
  ipfsHash: {
    type: String,
    default: ''
  },
  blockchainVerified: {
    type: Boolean,
    default: false
  },

  // Engagement
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },

  // Moderation
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  moderationNotes: {
    type: String,
    default: ''
  },

  // Media attachments
  images: [{
    url: String,
    filename: String,
    size: Number
  }],

  // Metadata
  userAgent: String,
  ipAddress: String,
  location: {
    country: String,
    city: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ user: 1 });
reviewSchema.index({ productName: 1 });
reviewSchema.index({ category: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ sentiment: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpful: -1 });
reviewSchema.index({ isVerified: 1 });
reviewSchema.index({ isFake: 1 });

// Compound indexes
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ category: 1, rating: -1 });
reviewSchema.index({ productName: 'text', title: 'text', content: 'text' });

// Virtual for user info
reviewSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.moderatedAt = new Date();
  }
  next();
});

// Static methods
reviewSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('user', 'name email avatar');
};

reviewSchema.statics.getByCategory = function(category) {
  return this.find({ category, status: 'approved' }).populate('user', 'name email avatar');
};

reviewSchema.statics.searchReviews = function(query) {
  return this.find(
    { $text: { $search: query }, status: 'approved' },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).populate('user', 'name email avatar');
};

// Instance methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulUsers.includes(userId)) {
    this.helpfulUsers.push(userId);
    this.helpful += 1;
  }
  return this.save();
};

reviewSchema.methods.reportReview = function(userId, reason) {
  const existingReport = this.reportedBy.find(report => 
    report.user.toString() === userId.toString()
  );
  
  if (!existingReport) {
    this.reportedBy.push({ user: userId, reason });
    this.reportCount += 1;
  }
  return this.save();
};

export default mongoose.model('Review', reviewSchema);