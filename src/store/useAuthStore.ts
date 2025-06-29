import { create } from 'zustand';
import { User } from '../types';
import { sendOTPEmail, sendPasswordResetConfirmationEmail, initializeEmailJS } from '../utils/emailService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  uploadProfilePicture: (file: File) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resetPasswordWithOTP: (email: string, otp: string, newPassword: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  initializeAuth: () => void;
}

// Simulate a simple user database using localStorage
const getUserDatabase = (): Record<string, any> => {
  const db = localStorage.getItem('userDatabase');
  return db ? JSON.parse(db) : {};
};

const saveUserDatabase = (db: Record<string, any>) => {
  localStorage.setItem('userDatabase', JSON.stringify(db));
};

const getUserByEmail = (email: string) => {
  const db = getUserDatabase();
  return Object.values(db).find((user: any) => user.email === email);
};

const saveUserToDatabase = (user: User, password: string) => {
  const db = getUserDatabase();
  db[user.id] = {
    ...user,
    password: btoa(password), // Simple base64 encoding for demo (use proper hashing in production)
    sessions: [],
    typingTests: [],
    achievements: []
  };
  saveUserDatabase(db);
};

const updateUserInDatabase = (userId: string, updates: Partial<User>) => {
  const db = getUserDatabase();
  if (db[userId]) {
    db[userId] = { ...db[userId], ...updates };
    saveUserDatabase(db);
  }
};

const getUserData = (userId: string) => {
  const db = getUserDatabase();
  return db[userId] || null;
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  initializeAuth: () => {
    // Initialize EmailJS
    initializeEmailJS();
    
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const userData = getUserData(storedUserId);
      if (userData) {
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          createdAt: new Date(userData.createdAt),
          avatarUrl: userData.avatarUrl,
          bio: userData.bio,
          location: userData.location,
          website: userData.website,
          twitter: userData.twitter,
          github: userData.github
        };
        
        // Restore user's data to other stores
        if (userData.sessions) {
          localStorage.setItem('sessions', JSON.stringify(userData.sessions));
        }
        if (userData.typingTests) {
          localStorage.setItem('typingTests', JSON.stringify(userData.typingTests));
        }
        if (userData.achievements) {
          localStorage.setItem('achievements', JSON.stringify(userData.achievements));
        }
        
        set({ user, isAuthenticated: true });
      } else {
        // Invalid stored user ID, clear it
        localStorage.removeItem('currentUserId');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = getUserByEmail(email);
      
      if (!userData || atob(userData.password) !== password) {
        throw new Error('Invalid credentials');
      }
      
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        createdAt: new Date(userData.createdAt),
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        twitter: userData.twitter,
        github: userData.github
      };
      
      // Store current user ID
      localStorage.setItem('currentUserId', user.id);
      
      // Restore user's data to other stores
      if (userData.sessions) {
        localStorage.setItem('sessions', JSON.stringify(userData.sessions));
      }
      if (userData.typingTests) {
        localStorage.setItem('typingTests', JSON.stringify(userData.typingTests));
      }
      if (userData.achievements) {
        localStorage.setItem('achievements', JSON.stringify(userData.achievements));
      }
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (name, email, password) => {
    set({ isLoading: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      const user: User = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      
      // Save user to database
      saveUserToDatabase(user, password);
      
      // Store current user ID
      localStorage.setItem('currentUserId', user.id);
      
      // Initialize empty data stores for new user
      localStorage.setItem('sessions', JSON.stringify([]));
      localStorage.setItem('typingTests', JSON.stringify([]));
      localStorage.setItem('achievements', JSON.stringify([]));
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    const { user } = get();
    
    if (user) {
      // Save current data to user's database entry before logging out
      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      const typingTests = JSON.parse(localStorage.getItem('typingTests') || '[]');
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      
      const db = getUserDatabase();
      if (db[user.id]) {
        db[user.id].sessions = sessions;
        db[user.id].typingTests = typingTests;
        db[user.id].achievements = achievements;
        saveUserDatabase(db);
      }
    }
    
    // Clear current session
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('sessions');
    localStorage.removeItem('typingTests');
    localStorage.removeItem('achievements');
    
    set({ user: null, isAuthenticated: false });
  },
  
  updateProfile: (userData) => {
    set(state => {
      if (!state.user) return state;
      
      const updatedUser = { ...state.user, ...userData };
      
      // Update in database
      updateUserInDatabase(state.user.id, updatedUser);
      
      return { user: updatedUser };
    });
  },

  uploadProfilePicture: async (file: File) => {
    set({ isLoading: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const imageUrl = URL.createObjectURL(file);
      
      set(state => {
        if (!state.user) return state;
        
        const updatedUser = {
          ...state.user,
          avatarUrl: imageUrl
        };
        
        // Update in database
        updateUserInDatabase(state.user.id, updatedUser);
        
        return { user: updatedUser, isLoading: false };
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error('Failed to upload profile picture');
    }
  },

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true });
    
    try {
      // Check if user exists
      const userData = getUserByEmail(email);
      if (!userData) {
        throw new Error('No user found with this email address');
      }
      
      // Generate OTP
      const otp = generateOTP();
      const timestamp = Date.now();
      
      // Store OTP with expiration (10 minutes) and timestamp for uniqueness
      const otpData = {
        email: email.toLowerCase().trim(), // Normalize email
        otp: otp.trim(), // Ensure no whitespace
        expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        verified: false,
        timestamp: timestamp, // Add timestamp to track when OTP was generated
        requestId: `${email.toLowerCase().trim()}_${timestamp}` // Unique request ID
      };
      localStorage.setItem('passwordResetOTP', JSON.stringify(otpData));
      
      // Log OTP for debugging
      console.log('🔑 Generated OTP:', otp, 'for email:', email, 'at timestamp:', timestamp);
      
      // Send email with OTP using EmailJS
      await sendOTPEmail(email, otp, userData.name);
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    set({ isLoading: true });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const otpData = JSON.parse(localStorage.getItem('passwordResetOTP') || '{}');
      
      // Normalize inputs for comparison
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedOTP = otp.trim();
      const storedEmail = otpData.email?.toLowerCase().trim();
      const storedOTP = otpData.otp?.trim();
      
      console.log('🔍 OTP Verification Debug:');
      console.log('Input email:', normalizedEmail);
      console.log('Stored email:', storedEmail);
      console.log('Input OTP:', normalizedOTP);
      console.log('Stored OTP:', storedOTP);
      console.log('OTP timestamp:', otpData.timestamp);
      console.log('Current time:', Date.now());
      console.log('OTP Data:', otpData);
      
      if (!storedOTP || !storedEmail || !otpData.timestamp) {
        throw new Error('No valid OTP request found. Please start the password reset process again.');
      }
      
      if (storedEmail !== normalizedEmail) {
        throw new Error('Email mismatch. Please start the password reset process again.');
      }
      
      if (new Date(otpData.expires) < new Date()) {
        localStorage.removeItem('passwordResetOTP');
        throw new Error('OTP has expired. Please request a new one.');
      }
      
      if (storedOTP !== normalizedOTP) {
        // Provide more helpful error message
        throw new Error(`Invalid OTP code. Please check your email for the most recent 6-digit code and try again.`);
      }
      
      // Mark OTP as verified
      otpData.verified = true;
      localStorage.setItem('passwordResetOTP', JSON.stringify(otpData));
      
      console.log('✅ OTP verified successfully');
      set({ isLoading: false });
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  resetPasswordWithOTP: async (email: string, otp: string, newPassword: string) => {
    set({ isLoading: true });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const otpData = JSON.parse(localStorage.getItem('passwordResetOTP') || '{}');
      
      // Normalize inputs
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedOTP = otp.trim();
      const storedEmail = otpData.email?.toLowerCase().trim();
      const storedOTP = otpData.otp?.trim();
      
      if (!otpData.verified || storedEmail !== normalizedEmail || storedOTP !== normalizedOTP) {
        throw new Error('Invalid or unverified OTP. Please verify your OTP first.');
      }
      
      if (new Date(otpData.expires) < new Date()) {
        localStorage.removeItem('passwordResetOTP');
        throw new Error('OTP has expired. Please request a new one.');
      }
      
      // Update password in database
      const userData = getUserByEmail(email);
      if (userData) {
        const db = getUserDatabase();
        db[userData.id].password = btoa(newPassword);
        saveUserDatabase(db);
      }
      
      // Clear OTP data
      localStorage.removeItem('passwordResetOTP');
      
      // Send confirmation email
      await sendPasswordResetConfirmationEmail(email, userData?.name);
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ isLoading: true });
    
    try {
      // Verify token
      const resetData = JSON.parse(localStorage.getItem('passwordReset') || '{}');
      
      if (!resetData.token || resetData.token !== token || new Date(resetData.expires) < new Date()) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Update password in database
      const userData = getUserByEmail(resetData.email);
      if (userData) {
        const db = getUserDatabase();
        db[userData.id].password = btoa(newPassword);
        saveUserDatabase(db);
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the reset token
      localStorage.removeItem('passwordReset');
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));