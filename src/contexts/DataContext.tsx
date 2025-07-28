import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { apiService } from '../services/api';
import { blockchainService } from '../services/blockchainService';
import { notificationService } from '../services/notificationService';
import { databaseService } from '../services/databaseService';
import { websocketService } from '../services/websocketService';
import { useAuth } from './AuthContext';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productName: string;
  category: string;
  title: string;
  content: string;
  rating: number;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  summary: string;
  keywords: string[];
  isFake: boolean;
  fakeConfidence: number;
  isVerified: boolean;
  qrCode?: string;
  blockchainHash: string;
  helpful: number;
  reportCount: number;
}

interface Analytics {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  avgRating: string;
  verificationRate: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  fakeReviews: number;
  verifiedReviews: number;
}

interface DataContextType {
  reviews: Review[];
  addReview: (reviewData: any) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: 'approved' | 'rejected') => void;
  getAnalytics: () => Analytics;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data for fallback
const mockReviews: Review[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Smith',
    userAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    productName: 'iPhone 15 Pro',
    category: 'Technology',
    title: 'Excellent camera quality',
    content: 'The camera on this phone is absolutely amazing. The night mode works perfectly and the photos are crystal clear.',
    rating: 5,
    timestamp: new Date('2024-01-15'),
    status: 'approved',
    sentiment: 'positive',
    sentimentScore: 0.8,
    summary: 'Highly positive review praising camera quality and night mode features.',
    keywords: ['camera', 'night mode', 'photos', 'quality'],
    isFake: false,
    fakeConfidence: 0.1,
    isVerified: true,
    blockchainHash: '0x1234567890abcdef1234567890abcdef12345678',
    helpful: 15,
    reportCount: 0
  },
  {
    id: '2',
    userId: '2',
    userName: 'Sarah Johnson',
    userAvatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    productName: 'Tesla Model 3',
    category: 'Automotive',
    title: 'Great electric vehicle',
    content: 'Love the performance and efficiency. The autopilot feature is impressive and the charging network is extensive.',
    rating: 4,
    timestamp: new Date('2024-01-10'),
    status: 'approved',
    sentiment: 'positive',
    sentimentScore: 0.6,
    summary: 'Positive review highlighting performance, efficiency, and autopilot features.',
    keywords: ['performance', 'efficiency', 'autopilot', 'charging'],
    isFake: false,
    fakeConfidence: 0.2,
    isVerified: true,
    blockchainHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    helpful: 8,
    reportCount: 0
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike Wilson',
    userAvatar: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    productName: 'MacBook Pro M3',
    category: 'Technology',
    title: 'Needs improvement',
    content: 'The performance is good but the battery life could be better. Also, it gets quite warm during intensive tasks.',
    rating: 3,
    timestamp: new Date('2024-01-08'),
    status: 'pending',
    sentiment: 'neutral',
    sentimentScore: -0.1,
    summary: 'Mixed review with concerns about battery life and heating issues.',
    keywords: ['performance', 'battery', 'warm', 'intensive'],
    isFake: false,
    fakeConfidence: 0.3,
    isVerified: false,
    blockchainHash: '0x567890abcdef1234567890abcdef1234567890ab',
    helpful: 3,
    reportCount: 0
  }
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReviews();
      initializeServices();
    }
  }, [user]);

  const initializeServices = async () => {
    // Initialize database connection
    await databaseService.connect();
    
    // Initialize WebSocket connection
    try {
      await websocketService.connect();
      
      // Subscribe to real-time updates
      websocketService.subscribeToReviewUpdates((review) => {
        setReviews(prev => {
          const index = prev.findIndex(r => r.id === review.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = review;
            return updated;
          } else {
            return [review, ...prev];
          }
        });
      });
      
      websocketService.subscribeToNotifications((notification) => {
        notificationService.add(notification);
      });
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  };
  const loadReviews = async () => {
    setLoading(true);
    try {
      // Try database first
      const dbResult = await databaseService.getReviews();
      if (dbResult.success && dbResult.data) {
        setReviews(dbResult.data);
        notificationService.info(
          'Reviews Loaded',
          `Loaded ${dbResult.data.length} reviews from database`
        );
        setLoading(false);
        return;
      }
      
      // Fallback to API
      const response = await apiService.getReviews();
      if (response.success && response.data) {
        setReviews(response.data.reviews);
        notificationService.info(
          'Reviews Loaded',
          `Loaded ${response.data.reviews.length} reviews from server`
        );
        return;
      }
    } catch (error) {
      console.error('Failed to load reviews, using mock data:', error);
      notificationService.warning(
        'Using Local Data',
        'Could not connect to database or API, using cached reviews'
      );
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (reviewData: any) => {
    setLoading(true);
    try {
      // Try database first
      const dbResult = await databaseService.createReview({
        userId: reviewData.userId,
        userName: reviewData.userName,
        userAvatar: reviewData.userAvatar || 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        productName: reviewData.productName,
        category: reviewData.category,
        title: reviewData.title,
        content: reviewData.content,
        rating: reviewData.rating,
        status: 'pending',
        sentiment: 'neutral',
        sentimentScore: 0,
        summary: '',
        keywords: [],
        isFake: false,
        fakeConfidence: 0,
        isVerified: reviewData.isVerified || false,
        qrCode: reviewData.qrCode,
        blockchainHash: '',
        helpful: 0,
        reportCount: 0
      });
      
      if (dbResult.success && dbResult.data) {
        // Process with AI and blockchain
        const aiAnalysis = await aiService.analyzeSentiment({
          title: reviewData.title,
          content: reviewData.content,
          rating: reviewData.rating,
          productName: reviewData.productName
        });
        
        const blockchainHash = await blockchainService.generateHash({
          title: reviewData.title,
          content: reviewData.content,
          rating: reviewData.rating,
          timestamp: new Date().toISOString(),
          userId: reviewData.userId
        });
        
        // Update review with AI analysis and blockchain hash
        const updatedReview = {
          ...dbResult.data,
          sentiment: aiAnalysis.sentiment,
          sentimentScore: aiAnalysis.score,
          summary: aiAnalysis.summary,
          keywords: aiAnalysis.keywords,
          isFake: aiAnalysis.isFake,
          fakeConfidence: aiAnalysis.fakeConfidence,
          blockchainHash
        };
        
        await databaseService.updateReview(dbResult.data.id, updatedReview);
        await blockchainService.storeOnBlockchain(updatedReview);
        
        // Send WebSocket update
        websocketService.sendReviewUpdate(dbResult.data.id, updatedReview);
        
        await loadReviews();
        notificationService.success(
          'Review Submitted',
          'Your review has been submitted and processed successfully!'
        );
        return;
      }
      
      // Fallback to API
      const response = await apiService.submitReview({
        productName: reviewData.productName,
        category: reviewData.category,
        title: reviewData.title,
        content: reviewData.content,
        rating: reviewData.rating,
        qrCode: reviewData.qrCode
      });

      if (response.success) {
        await loadReviews();
        notificationService.success(
          'Review Submitted',
          'Your review has been submitted successfully!'
        );
        return;
      } else {
        notificationService.error(
          'Submission Failed',
          response.error || 'Failed to submit review'
        );
      }
    } catch (error) {
      console.error('API submission failed, using local processing:', error);
      notificationService.warning(
        'Processing Locally',
        'Server unavailable, processing review locally'
      );
    }

    // Fallback to local processing
    try {
      const aiAnalysis = await aiService.analyzeSentiment({
        title: reviewData.title,
        content: reviewData.content,
        rating: reviewData.rating,
        productName: reviewData.productName
      });

      // Generate blockchain hash and store
      const blockchainHash = await blockchainService.generateHash({
        title: reviewData.title,
        content: reviewData.content,
        rating: reviewData.rating,
        timestamp: new Date().toISOString(),
        userId: reviewData.userId
      });

      const newReview: Review = {
        id: Date.now().toString(),
        userId: reviewData.userId,
        userName: reviewData.userName,
        userAvatar: reviewData.userAvatar || 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        productName: reviewData.productName,
        category: reviewData.category,
        title: reviewData.title,
        content: reviewData.content,
        rating: reviewData.rating,
        timestamp: new Date(),
        status: 'pending',
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.score,
        summary: aiAnalysis.summary,
        keywords: aiAnalysis.keywords,
        isFake: aiAnalysis.isFake,
        fakeConfidence: aiAnalysis.fakeConfidence,
        isVerified: reviewData.isVerified || false,
        qrCode: reviewData.qrCode,
        blockchainHash,
        helpful: 0,
        reportCount: 0
      };

      try {
        await blockchainService.storeOnBlockchain(newReview);
        notificationService.success(
          'Blockchain Verified',
          'Your review has been securely stored on the blockchain.'
        );
      } catch (blockchainError) {
        console.error('Blockchain storage failed:', blockchainError);
        notificationService.warning(
          'Blockchain Warning',
          'Review saved but blockchain storage failed'
        );
      }

      setReviews(prev => [newReview, ...prev]);
      
      notificationService.success(
        'Review Submitted',
        'Review processed locally and saved successfully'
      );
    } catch (error) {
      console.error('AI analysis failed:', error);
      notificationService.error(
        'Submission Failed',
        'Failed to process your review. Please try again.'
      );
      throw new Error('Failed to process review');
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      // Try database first
      const dbResult = await databaseService.updateReview(reviewId, { status });
      if (dbResult.success) {
        setReviews(prev => 
          prev.map(review => 
            review.id === reviewId ? { ...review, status } : review
          )
        );
        
        // Send WebSocket update
        websocketService.sendReviewUpdate(reviewId, { status });
        
        notificationService.success(
          'Status Updated',
          `Review has been ${status} successfully`
        );
        return;
      }
      
      // Fallback to API
      const response = await apiService.updateReviewStatus(reviewId, status);
      if (response.success) {
        setReviews(prev => 
          prev.map(review => 
            review.id === reviewId ? { ...review, status } : review
          )
        );
        
        notificationService.success(
          'Status Updated',
          `Review has been ${status} successfully`
        );
        return;
      }
    } catch (error) {
      console.error('API status update failed, updating locally:', error);
    }

    // Fallback: Update locally
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId ? { ...review, status } : review
      )
    );
    
    notificationService.info(
      'Status Updated',
      `Review has been ${status} locally`
    );
  };

  const getAnalytics = (): Analytics => {
    // Try to get real-time analytics from database
    databaseService.getAnalytics().then(result => {
      if (result.success && result.data) {
        // Could update state with real analytics here
        console.log('Real analytics:', result.data);
      }
    });
    
    // Return calculated analytics from current state
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;
    const approvedReviews = reviews.filter(r => r.status === 'approved').length;
    const rejectedReviews = reviews.filter(r => r.status === 'rejected').length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';
    const verifiedReviews = reviews.filter(r => r.isVerified).length;
    const verificationRate = totalReviews > 0 
      ? Math.round((verifiedReviews / totalReviews) * 100)
      : 0;
    const fakeReviews = reviews.filter(r => r.isFake).length;

    const sentimentDistribution = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length
    };

    return {
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      avgRating,
      verificationRate,
      sentimentDistribution,
      fakeReviews,
      verifiedReviews
    };
  };

  return (
    <DataContext.Provider value={{
      reviews,
      addReview,
      updateReviewStatus,
      getAnalytics,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}