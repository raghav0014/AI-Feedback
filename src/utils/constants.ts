export const APP_CONFIG = {
  name: 'FeedbackChain',
  version: '1.0.0',
  description: 'Decentralized AI-Powered Feedback Platform',
  author: 'FeedbackChain Team',
  repository: 'https://github.com/feedbackchain/platform'
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verify: '/auth/verify',
    logout: '/auth/logout'
  },
  reviews: {
    list: '/reviews',
    create: '/reviews',
    update: '/reviews/:id',
    delete: '/reviews/:id',
    updateStatus: '/reviews/:id/status'
  },
  analytics: '/analytics',
  verifyPurchase: '/verify-purchase',
  companies: '/companies/:id/reviews'
};

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  notifications: 'notifications',
  blockchainTransactions: 'blockchain_transactions',
  ipfsData: 'ipfs_data',
  userPreferences: 'user_preferences'
};

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export const CATEGORIES = [
  'Technology',
  'Automotive',
  'Food & Dining',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Finance',
  'Fashion',
  'Home & Garden',
  'Sports & Fitness',
  'Books & Media',
  'Other'
];

export const RATING_LABELS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
} as const;

export const QR_CODE_PREFIX = 'PRODUCT_';

export const BLOCKCHAIN_CONFIG = {
  network: 'ethereum',
  gasLimit: 21000,
  gasPrice: '20000000000' // 20 gwei
};

export const IPFS_CONFIG = {
  gateway: 'https://ipfs.io/ipfs/',
  timeout: 30000 // 30 seconds
};