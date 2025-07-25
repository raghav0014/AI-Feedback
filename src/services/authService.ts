// Firebase Auth Configuration
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  TwitterAuthProvider
} from 'firebase/auth';

// Auth0 Configuration
import { Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  provider: 'firebase' | 'auth0' | 'demo';
  emailVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthConfig {
  provider: 'firebase' | 'auth0' | 'demo';
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  auth0?: {
    domain: string;
    clientId: string;
    audience?: string;
  };
}

class AuthService {
  private firebaseApp: FirebaseApp | null = null;
  private firebaseAuth: Auth | null = null;
  private auth0Client: Auth0Client | null = null;
  private config: AuthConfig;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.config = this.getAuthConfig();
    this.initializeAuth();
  }

  private getAuthConfig(): AuthConfig {
    // Check environment variables for auth configuration
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      return {
        provider: 'firebase',
        firebase: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        }
      };
    }

    if (import.meta.env.VITE_AUTH0_DOMAIN) {
      return {
        provider: 'auth0',
        auth0: {
          domain: import.meta.env.VITE_AUTH0_DOMAIN,
          clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }
      };
    }

    // Fallback to demo auth
    return { provider: 'demo' };
  }

  private async initializeAuth() {
    try {
      if (this.config.provider === 'firebase' && this.config.firebase) {
        await this.initializeFirebase();
      } else if (this.config.provider === 'auth0' && this.config.auth0) {
        await this.initializeAuth0();
      }
      
      // Check for existing session
      await this.checkExistingSession();
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Fallback to demo auth
      this.config.provider = 'demo';
    }
  }

  private async initializeFirebase() {
    if (!this.config.firebase) throw new Error('Firebase config missing');

    this.firebaseApp = initializeApp(this.config.firebase);
    this.firebaseAuth = getAuth(this.firebaseApp);

    // Listen for auth state changes
    onAuthStateChanged(this.firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        this.handleFirebaseUser(firebaseUser);
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  private async initializeAuth0() {
    if (!this.config.auth0) throw new Error('Auth0 config missing');

    this.auth0Client = await createAuth0Client({
      domain: this.config.auth0.domain,
      clientId: this.config.auth0.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: this.config.auth0.audience,
      },
    });

    // Check if user is authenticated
    const isAuthenticated = await this.auth0Client.isAuthenticated();
    if (isAuthenticated) {
      const auth0User = await this.auth0Client.getUser();
      if (auth0User) {
        this.handleAuth0User(auth0User);
      }
    }

    // Handle redirect callback
    if (window.location.search.includes('code=')) {
      try {
        await this.auth0Client.handleRedirectCallback();
        const auth0User = await this.auth0Client.getUser();
        if (auth0User) {
          this.handleAuth0User(auth0User);
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Auth0 callback error:', error);
      }
    }
  }

  private async checkExistingSession() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    
    if (token && userData && this.config.provider === 'demo') {
      try {
        const user = JSON.parse(userData);
        this.setCurrentUser(user);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }

  private handleFirebaseUser(firebaseUser: FirebaseUser) {
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: firebaseUser.email === 'admin@feedback.com' ? 'admin' : 'user',
      avatar: firebaseUser.photoURL || undefined,
      provider: 'firebase',
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime,
      lastLogin: firebaseUser.metadata.lastSignInTime,
    };

    this.setCurrentUser(user);
  }

  private handleAuth0User(auth0User: any) {
    const user: User = {
      id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.email?.split('@')[0] || 'User',
      role: auth0User.email === 'admin@feedback.com' ? 'admin' : 'user',
      avatar: auth0User.picture,
      provider: 'auth0',
      emailVerified: auth0User.email_verified,
      createdAt: auth0User.created_at,
      lastLogin: auth0User.updated_at,
    };

    this.setCurrentUser(user);
  }

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      if (this.config.provider === 'demo') {
        localStorage.setItem('auth_token', `demo_token_${user.id}`);
      }
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(user));
  }

  // Public methods
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current user
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        const result = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
        return { success: true };
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        await this.auth0Client.loginWithRedirect({
          authorizationParams: {
            login_hint: email,
          },
        });
        return { success: true };
      } else {
        // Demo auth
        return this.demoLogin(email, password);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }

  async register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
        
        // Update profile with name
        await updateProfile(result.user, { displayName: name });
        
        return { success: true };
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        // Auth0 doesn't have direct registration, redirect to signup
        await this.auth0Client.loginWithRedirect({
          authorizationParams: {
            screen_hint: 'signup',
            login_hint: email,
          },
        });
        return { success: true };
      } else {
        // Demo auth
        return this.demoRegister(email, password, name);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        await signOut(this.firebaseAuth);
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        await this.auth0Client.logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
      } else {
        // Demo auth
        this.setCurrentUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout locally even if remote logout fails
      this.setCurrentUser(null);
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        await sendPasswordResetEmail(this.firebaseAuth, email);
        return { success: true };
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        // Auth0 password reset would typically be handled through their management API
        // For now, redirect to Auth0's password reset page
        window.open(`https://${this.config.auth0!.domain}/login?screen_hint=forgot_password`, '_blank');
        return { success: true };
      } else {
        // Demo auth - simulate success
        return { success: true };
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.message || 'Password reset failed' 
      };
    }
  }

  // Social login methods
  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(this.firebaseAuth, provider);
        return { success: true };
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        await this.auth0Client.loginWithRedirect({
          authorizationParams: {
            connection: 'google-oauth2',
          },
        });
        return { success: true };
      } else {
        return { success: false, error: 'Social login not configured' };
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    }
  }

  async loginWithFacebook(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth) {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(this.firebaseAuth, provider);
        return { success: true };
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        await this.auth0Client.loginWithRedirect({
          authorizationParams: {
            connection: 'facebook',
          },
        });
        return { success: true };
      } else {
        return { success: false, error: 'Social login not configured' };
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      return { success: false, error: error.message || 'Facebook login failed' };
    }
  }

  // Demo authentication methods
  private async demoLogin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@feedback.com' && password === 'admin123') {
      const adminUser: User = {
        id: '1',
        email: 'admin@feedback.com',
        name: 'Admin User',
        role: 'admin',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        provider: 'demo',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      this.setCurrentUser(adminUser);
      return { success: true };
    } else if (email && password) {
      const regularUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        role: 'user',
        avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        provider: 'demo',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      this.setCurrentUser(regularUser);
      return { success: true };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }

  private async demoRegister(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      provider: 'demo',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    this.setCurrentUser(newUser);
    return { success: true };
  }

  // Utility methods
  getAuthProvider(): 'firebase' | 'auth0' | 'demo' {
    return this.config.provider;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async getIdToken(): Promise<string | null> {
    try {
      if (this.config.provider === 'firebase' && this.firebaseAuth?.currentUser) {
        return await this.firebaseAuth.currentUser.getIdToken();
      } else if (this.config.provider === 'auth0' && this.auth0Client) {
        return await this.auth0Client.getTokenSilently();
      } else {
        return localStorage.getItem('auth_token');
      }
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();