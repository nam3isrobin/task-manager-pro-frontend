import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStorage';
import {
  isMockEnabled,
  setMockEnabled,
  mockLogin,
  mockRegister,
  mockVerifyOtp,
  mockResendOtp,
} from '../mock/mockService';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

const AuthContext = createContext(null);

const SESSION_USER_KEY = 'taskmanager_auth_user_v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Initialize session state safely
  useEffect(() => {
    const initAuth = async () => {
      try {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {
          // ignore
        }

        const mockActive = isMockEnabled();
        setIsDemo(mockActive);

        let storedUser = null;
        try {
          const raw = sessionStorage.getItem(SESSION_USER_KEY);
          if (raw) {
            storedUser = JSON.parse(raw);
          }
        } catch {
          // sessionStorage inaccessible
        }

        if (mockActive) {
          if (storedUser) {
            setUser(storedUser);
            setAccessToken(`mock-jwt-${storedUser._id || 'demo'}`);
          }
        } else if (storedUser && getAccessToken()) {
          setUser(storedUser);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      if (isMockEnabled()) {
        const result = await mockLogin(email, password);
        const { token, ...userObj } = result.data;
        setAccessToken(token);
        setUser(userObj);
        try {
          sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
        } catch {
          // ignore
        }
        setIsDemo(true);
        return { success: true, requiresVerification: false, user: userObj };
      }

      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data || response.data;
      const { token, ...userObj } = payload;

      setAccessToken(token);
      setUser(userObj);
      try {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      } catch {
        // ignore
      }
      return { success: true, requiresVerification: false, user: userObj };
    } catch (error) {
      const resp = error.response?.data;
      return {
        success: false,
        requiresVerification: false,
        isPendingApproval: Boolean(resp?.isPendingApproval || error.isPendingApproval),
        isRejected: Boolean(resp?.isRejected || error.isRejected),
        email: resp?.email || error.email || email,
        rejectionReason: resp?.rejectionReason || error.rejectionReason,
        error: sanitizeErrorMessage(error, 'Login failed. Please check your credentials.'),
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      if (isMockEnabled()) {
        const result = await mockRegister(name, email, password);
        const { token, ...userObj } = result.data;
        setAccessToken(token);
        setUser(userObj);
        try {
          sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
        } catch {
          // ignore
        }
        setIsDemo(true);
        return {
          success: true,
          requiresVerification: false,
          user: userObj,
          message: result.message,
        };
      }

      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Extract access token and user object directly from registration response payload
      const payload = response.data?.data || response.data || {};
      const { token, ...userObj } = payload.user ? { token: payload.token, ...payload.user } : payload;

      // Persist access token in memory store if provided
      if (token) {
        setAccessToken(token);
      }

      // Update current user state and cache in session storage for persistence
      setUser(userObj);
      try {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      } catch {
        // Safe fallback if sessionStorage is inaccessible or throws
      }

      return {
        success: true,
        requiresVerification: false,
        user: userObj,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: sanitizeErrorMessage(error, 'Registration failed. Please try again.'),
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      if (isMockEnabled()) {
        const result = await mockVerifyOtp(email, otp);
        if (result.data?.token) {
          const { token, ...userObj } = result.data;
          setAccessToken(token);
          setUser(userObj);
          try {
            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
          } catch {
            // ignore
          }
        }
        return {
          success: true,
          isVerified: result.isVerified,
          approvalStatus: result.approvalStatus,
          message: result.message,
          user: result.data,
        };
      }

      const response = await api.post('/auth/verify-otp', { email, otp });
      const payload = response.data?.data || response.data;

      if (payload?.token) {
        const { token, ...userObj } = payload;
        setAccessToken(token);
        setUser(userObj);
        try {
          sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        isVerified: true,
        approvalStatus: response.data?.approvalStatus || payload?.approvalStatus,
        message: response.data?.message,
        user: payload,
      };
    } catch (error) {
      return {
        success: false,
        error: sanitizeErrorMessage(error, 'Verification failed. Please check the code.'),
      };
    }
  };

  const resendOtp = async (email) => {
    try {
      if (isMockEnabled()) {
        const res = await mockResendOtp(email);
        return { success: true, message: res.message, simulatedOtp: res.simulatedOtp };
      }
      const response = await api.post('/auth/resend-otp', { email });
      return { success: true, message: response.data?.message || 'New OTP sent.' };
    } catch (error) {
      return {
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to resend code. Please try again.'),
      };
    }
  };

  const enableDemoMode = useCallback(async () => {
    setMockEnabled(true);
    setIsDemo(true);
    const result = await mockLogin('sarah.jenkins@taskmanagerpro.dev', 'demo1234');
    const { token, ...userObj } = result.data;
    setAccessToken(token);
    setUser(userObj);
    try {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
    } catch {
      // ignore
    }
    return { success: true, user: userObj };
  }, []);

  const disableDemoMode = useCallback(() => {
    setMockEnabled(false);
    setIsDemo(false);
    clearAccessToken();
    try {
      sessionStorage.removeItem(SESSION_USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const logout = () => {
    clearAccessToken();
    try {
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        loading,
        isDemo,
        enableDemoMode,
        disableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
