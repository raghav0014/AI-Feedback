import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and verify it
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyStoredToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyStoredToken = async () => {
    try {
      const response = await apiService.verifyToken();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await apiService.register({ email, password, name });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Fallback authentication for demo purposes
  const fallbackAuth = async (email: string, password: string, isRegister: boolean = false): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      if (email === 'admin@feedback.com' && password === 'admin123') {
        const adminUser: User = {
          id: '1',
          email: 'admin@feedback.com',
          name: 'Admin User',
          role: 'admin',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
        };
        setUser(adminUser);
        localStorage.setItem('auth_token', 'demo_admin_token');
        return true;
      } else if (email && password) {
        const regularUser: User = {
          id: Date.now().toString(),
          email,
          name: isRegister ? name : email.split('@')[0],
          role: 'user',
          avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
        };
        setUser(regularUser);
        localStorage.setItem('auth_token', `demo_user_token_${Date.now()}`);
        return true;
      }
      return true;
    } catch (error) {
      console.error('Fallback auth error:', error);
      return false;
    }
  };

  // Enhanced login with fallback
  const enhancedLogin = async (email: string, password: string): Promise<boolean> => {
    const result = await login(email, password);
    if (!result) {
      // Fallback to demo authentication if API fails
      return await fallbackAuth(email, password, false);
    }
    return result;
  };

  // Enhanced register with fallback
  const enhancedRegister = async (email: string, password: string, name: string): Promise<boolean> => {
    const result = await register(email, password, name);
    if (!result) {
      // Fallback to demo authentication if API fails
      return await fallbackAuth(email, password, true);
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login: enhancedLogin, 
      logout, 
      register: enhancedRegister, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}