interface DatabaseConfig {
  type: 'mongodb' | 'postgresql' | 'mysql';
  connectionString: string;
  options?: any;
}

interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

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

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  reviewCount: number;
  reputation: number;
}

class DatabaseService {
  private config: DatabaseConfig;
  private isConnected = false;

  constructor() {
    this.config = {
      type: (import.meta.env.VITE_DB_TYPE as 'mongodb' | 'postgresql' | 'mysql') || 'mongodb',
      connectionString: import.meta.env.VITE_DATABASE_URL || 'mongodb://localhost:27017/feedbackchain',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    };
  }

  async connect(): Promise<boolean> {
    try {
      // In a real implementation, this would establish a database connection
      // For now, we'll simulate connection and use localStorage as fallback
      
      if (this.config.connectionString.includes('localhost') || 
          this.config.connectionString.includes('127.0.0.1')) {
        console.log('Database connection established (simulated)');
        this.isConnected = true;
        return true;
      }

      // Try to connect to real database
      const response = await fetch('/api/db/health');
      if (response.ok) {
        this.isConnected = true;
        console.log('Database connection established');
        return true;
      }

      throw new Error('Database connection failed');
    } catch (error) {
      console.warn('Database connection failed, using local storage:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Database connection closed');
  }

  // Review operations
  async createReview(review: Omit<Review, 'id' | 'timestamp'>): Promise<QueryResult<Review>> {
    try {
      if (this.isConnected) {
        // Real database operation
        const response = await fetch('/api/db/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(review)
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const newReview: Review = {
        ...review,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      const reviews = this.getLocalReviews();
      reviews.push(newReview);
      localStorage.setItem('db_reviews', JSON.stringify(reviews));

      return { success: true, data: newReview };
    } catch (error) {
      return { success: false, error: 'Failed to create review' };
    }
  }

  async getReviews(filters?: {
    userId?: string;
    productName?: string;
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<QueryResult<Review[]>> {
    try {
      if (this.isConnected) {
        // Real database query
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
              params.append(key, value.toString());
            }
          });
        }

        const response = await fetch(`/api/db/reviews?${params}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.reviews, count: data.total };
        }
      }

      // Fallback to localStorage
      let reviews = this.getLocalReviews();

      // Apply filters
      if (filters) {
        if (filters.userId) {
          reviews = reviews.filter(r => r.userId === filters.userId);
        }
        if (filters.productName) {
          reviews = reviews.filter(r => 
            r.productName.toLowerCase().includes(filters.productName!.toLowerCase())
          );
        }
        if (filters.category) {
          reviews = reviews.filter(r => r.category === filters.category);
        }
        if (filters.status) {
          reviews = reviews.filter(r => r.status === filters.status);
        }
        if (filters.offset) {
          reviews = reviews.slice(filters.offset);
        }
        if (filters.limit) {
          reviews = reviews.slice(0, filters.limit);
        }
      }

      return { success: true, data: reviews, count: reviews.length };
    } catch (error) {
      return { success: false, error: 'Failed to get reviews' };
    }
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<QueryResult<Review>> {
    try {
      if (this.isConnected) {
        // Real database update
        const response = await fetch(`/api/db/reviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const reviews = this.getLocalReviews();
      const index = reviews.findIndex(r => r.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Review not found' };
      }

      reviews[index] = { ...reviews[index], ...updates };
      localStorage.setItem('db_reviews', JSON.stringify(reviews));

      return { success: true, data: reviews[index] };
    } catch (error) {
      return { success: false, error: 'Failed to update review' };
    }
  }

  async deleteReview(id: string): Promise<QueryResult<boolean>> {
    try {
      if (this.isConnected) {
        // Real database deletion
        const response = await fetch(`/api/db/reviews/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          return { success: true, data: true };
        }
      }

      // Fallback to localStorage
      const reviews = this.getLocalReviews();
      const filteredReviews = reviews.filter(r => r.id !== id);
      
      if (filteredReviews.length === reviews.length) {
        return { success: false, error: 'Review not found' };
      }

      localStorage.setItem('db_reviews', JSON.stringify(filteredReviews));
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete review' };
    }
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'reviewCount' | 'reputation'>): Promise<QueryResult<User>> {
    try {
      if (this.isConnected) {
        // Real database operation
        const response = await fetch('/api/db/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const newUser: User = {
        ...user,
        id: Date.now().toString(),
        createdAt: new Date(),
        reviewCount: 0,
        reputation: 100
      };

      const users = this.getLocalUsers();
      users.push(newUser);
      localStorage.setItem('db_users', JSON.stringify(users));

      return { success: true, data: newUser };
    } catch (error) {
      return { success: false, error: 'Failed to create user' };
    }
  }

  async getUser(id: string): Promise<QueryResult<User>> {
    try {
      if (this.isConnected) {
        // Real database query
        const response = await fetch(`/api/db/users/${id}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const users = this.getLocalUsers();
      const user = users.find(u => u.id === id);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: 'Failed to get user' };
    }
  }

  async getUserByEmail(email: string): Promise<QueryResult<User>> {
    try {
      if (this.isConnected) {
        // Real database query
        const response = await fetch(`/api/db/users/email/${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const users = this.getLocalUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: 'Failed to get user' };
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<QueryResult<User>> {
    try {
      if (this.isConnected) {
        // Real database update
        const response = await fetch(`/api/db/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage
      const users = this.getLocalUsers();
      const index = users.findIndex(u => u.id === id);
      
      if (index === -1) {
        return { success: false, error: 'User not found' };
      }

      users[index] = { ...users[index], ...updates };
      localStorage.setItem('db_users', JSON.stringify(users));

      return { success: true, data: users[index] };
    } catch (error) {
      return { success: false, error: 'Failed to update user' };
    }
  }

  // Analytics operations
  async getAnalytics(timeRange?: string): Promise<QueryResult<any>> {
    try {
      if (this.isConnected) {
        // Real database aggregation
        const params = timeRange ? `?timeRange=${timeRange}` : '';
        const response = await fetch(`/api/db/analytics${params}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }

      // Fallback to localStorage calculation
      const reviews = this.getLocalReviews();
      const users = this.getLocalUsers();

      const analytics = {
        totalReviews: reviews.length,
        totalUsers: users.length,
        pendingReviews: reviews.filter(r => r.status === 'pending').length,
        approvedReviews: reviews.filter(r => r.status === 'approved').length,
        rejectedReviews: reviews.filter(r => r.status === 'rejected').length,
        avgRating: reviews.length > 0 
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : '0.0',
        verifiedReviews: reviews.filter(r => r.isVerified).length,
        fakeReviews: reviews.filter(r => r.isFake).length,
        sentimentDistribution: {
          positive: reviews.filter(r => r.sentiment === 'positive').length,
          negative: reviews.filter(r => r.sentiment === 'negative').length,
          neutral: reviews.filter(r => r.sentiment === 'neutral').length
        }
      };

      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, error: 'Failed to get analytics' };
    }
  }

  // Helper methods for localStorage fallback
  private getLocalReviews(): Review[] {
    try {
      const data = localStorage.getItem('db_reviews');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private getLocalUsers(): User[] {
    try {
      const data = localStorage.getItem('db_users');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  // Database health check
  async healthCheck(): Promise<QueryResult<{ status: string; latency: number }>> {
    const startTime = Date.now();
    
    try {
      if (this.isConnected) {
        const response = await fetch('/api/db/health');
        const latency = Date.now() - startTime;
        
        if (response.ok) {
          return { 
            success: true, 
            data: { status: 'healthy', latency } 
          };
        }
      }

      const latency = Date.now() - startTime;
      return { 
        success: true, 
        data: { status: 'local', latency } 
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        success: false, 
        error: 'Health check failed',
        data: { status: 'error', latency }
      };
    }
  }
}

export const databaseService = new DatabaseService();
export type { Review, User, QueryResult };