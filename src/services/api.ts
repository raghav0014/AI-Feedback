const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Add request timeout and retry logic
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - please check your connection'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Authentication
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

  // Reviews
  async getReviews(filters?: {
    category?: string;
    sentiment?: string;
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ reviews: any[]; total: number; page: number }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<{ reviews: any[]; total: number; page: number }>(
      `/reviews${queryString ? `?${queryString}` : ''}`
    );
  }

  async submitReview(review: ReviewRequest): Promise<ApiResponse<any>> {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }

  async updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): Promise<ApiResponse<any>> {
    return this.request<any>(`/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Purchase Verification
  async verifyPurchase(qrCode: string): Promise<ApiResponse<PurchaseVerificationResponse>> {
    return this.request<PurchaseVerificationResponse>('/verify-purchase', {
      method: 'POST',
      body: JSON.stringify({ qrCode })
    });
  }

  // Analytics
  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request<any>('/analytics');
  }

  // Company Integration
  async getCompanyReviews(companyId: string, productId?: string): Promise<ApiResponse<any[]>> {
    const params = productId ? `?productId=${productId}` : '';
    return this.request<any[]>(`/companies/${companyId}/reviews${params}`);
  }
}

export const apiService = new ApiService();