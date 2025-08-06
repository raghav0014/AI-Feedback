import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  reviews: {
    total: { type: Number, default: 0 },
    approved: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    fake: { type: Number, default: 0 }
  },
  users: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    new: { type: Number, default: 0 }
  },
  sentiment: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },
  categories: [{
    name: String,
    count: Number,
    avgRating: Number
  }],
  ratings: {
    average: { type: Number, default: 0 },
    distribution: {
      one: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      five: { type: Number, default: 0 }
    }
  },
  engagement: {
    totalViews: { type: Number, default: 0 },
    totalHelpful: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 }
  },
  ai: {
    processed: { type: Number, default: 0 },
    openaiUsage: { type: Number, default: 0 },
    huggingfaceUsage: { type: Number, default: 0 },
    fallbackUsage: { type: Number, default: 0 }
  },
  blockchain: {
    stored: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ createdAt: -1 });

// Static methods
analyticsSchema.statics.getDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

analyticsSchema.statics.getLatest = function() {
  return this.findOne().sort({ date: -1 });
};

export default mongoose.model('Analytics', analyticsSchema);