const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
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