const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Request configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatar?: string;
  };
  token: string;
}

export interface ReviewRequest {
  productName: string;
  category: string;
  title: string;
  content: string;
  rating: number;
  qrCode?: string;
}

export interface PurchaseVerificationRequest {
  qrCode: string;
}

export interface PurchaseVerificationResponse {
  verified: boolean;
  productId: string;
  productName: string;
  purchaseDate: string;
  orderId: string;
  retailer: string;
  price: number;
  warranty: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productName: string;
  category: string;
  title: string;
  content: string;
  rating: number;
  timestamp: string;
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

export interface Analytics {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  avgRating: number;
  verificationRate: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  fakeReviews: number;
  verifiedReviews: number;
  monthlyGrowth: number;
  topCategories: Array<{ category: string; count: number }>;
}

class ApiService {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(1000 * (MAX_RETRIES - retries + 1)); // Exponential backoff
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    return (
      error instanceof TypeError || // Network errors
      (error.status >= 500 && error.status < 600) || // Server errors
      error.status === 429 // Rate limiting
    );
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await this.retryRequest(() =>
        fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...options.headers
          },
          signal: controller.signal
        })
      );

      clearTimeout(timeoutId);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
          message: data.message || `Request failed with status ${response.status}`
        };
      }

      return {
        success: true,
        data,
        message: data.message || 'Request successful'
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - please check your connection',
          message: 'The request took too long to complete'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error occurred',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async verifyToken(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.request<AuthResponse['user']>('/auth/verify');
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST'
    });
    
    if (response.success) {
      localStorage.removeItem('auth_token');
    }
    
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>('/auth/refresh', {
      method: 'POST'
    });
  }

  // Review endpoints
  async getReviews(filters?: {
    category?: string;
    sentiment?: string;
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ reviews: Review[]; total: number; page: number; totalPages: number }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<{ reviews: Review[]; total: number; page: number; totalPages: number }>(
      `/reviews${queryString ? `?${queryString}` : ''}`
    );
  }

  async getReview(reviewId: string): Promise<ApiResponse<Review>> {
    return this.request<Review>(`/reviews/${reviewId}`);
  }

  async submitReview(review: ReviewRequest): Promise<ApiResponse<Review>> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }

  async updateReview(reviewId: string, updates: Partial<ReviewRequest>): Promise<ApiResponse<Review>> {
    return this.request<Review>(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteReview(reviewId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }

  async updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): Promise<ApiResponse<Review>> {
    return this.request<Review>(`/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async markReviewHelpful(reviewId: string): Promise<ApiResponse<{ helpful: number }>> {
    return this.request<{ helpful: number }>(`/reviews/${reviewId}/helpful`, {
      method: 'POST'
    });
  }

  async reportReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Purchase verification
  async verifyPurchase(qrCode: string): Promise<ApiResponse<PurchaseVerificationResponse>> {
    return this.request<PurchaseVerificationResponse>('/verify-purchase', {
      method: 'POST',
      body: JSON.stringify({ qrCode })
    });
  }

  // Analytics endpoints
  async getAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<Analytics>> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request<Analytics>(`/analytics${params}`);
  }

  async getReviewAnalytics(reviewId: string): Promise<ApiResponse<{
    views: number;
    helpfulVotes: number;
    reports: number;
    engagement: number;
  }>> {
    return this.request(`/analytics/reviews/${reviewId}`);
  }

  // Company integration endpoints
  async getCompanyReviews(companyId: string, productId?: string): Promise<ApiResponse<Review[]>> {
    const params = productId ? `?productId=${productId}` : '';
    return this.request<Review[]>(`/companies/${companyId}/reviews${params}`);
  }

  async getCompanyAnalytics(companyId: string): Promise<ApiResponse<Analytics>> {
    return this.request<Analytics>(`/companies/${companyId}/analytics`);
  }

  // User management (admin only)
  async getUsers(filters?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    users: Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt: string;
      lastLogin: string;
      reviewCount: number;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<ApiResponse<void>> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async banUser(userId: string, reason: string): Promise<ApiResponse<void>> {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      database: boolean;
      ai: boolean;
      blockchain: boolean;
      storage: boolean;
    };
    uptime: number;
    version: string;
  }>> {
    return this.request('/health');
  }

  // File upload (for future use)
  async uploadFile(file: File, type: 'avatar' | 'review-image' | 'document'): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...this.getAuthHeaders(),
        'Content-Type': undefined as any
      }
    });
  }

  // Batch operations
  async batchUpdateReviews(reviewIds: string[], updates: {
    status?: 'approved' | 'rejected';
    category?: string;
  }): Promise<ApiResponse<{ updated: number; failed: number }>> {
    return this.request('/reviews/batch', {
      method: 'PATCH',
      body: JSON.stringify({ reviewIds, updates })
    });
  }

  async exportReviews(filters?: {
    format: 'csv' | 'json' | 'xlsx';
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request(`/reviews/export${queryString ? `?${queryString}` : ''}`);
  }
}

export const apiService = new ApiService();