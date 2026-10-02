import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStorage';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

const AuthContext = createContext(null);

const SESSION_USER_KEY = 'taskmanager_auth_user_v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

        let storedUser = null;
        try {
          const raw = sessionStorage.getItem(SESSION_USER_KEY);
          if (raw) {
            storedUser = JSON.parse(raw);
          }
        } catch {
          // sessionStorage inaccessible
        }

        if (storedUser && getAccessToken()) {
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
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data || response.data;
      const { token, ...userObj } = payload;

      if (token) {
        setAccessToken(token);
      }
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
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const payload = response.data?.data || response.data || {};
      const { token, ...userObj } = payload.user ? { token: payload.token, ...payload.user } : payload;

      if (token) {
        setAccessToken(token);
      }

      setUser(userObj);
      try {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      } catch {
        // Safe fallback if sessionStorage is inaccessible
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
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
