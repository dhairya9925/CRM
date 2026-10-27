import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  apiSignup,
  apiGetCurrentUser,
  apiLogout,
  getStoredToken,
  clearStoredTokens,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize auth state by verifying session or stored token
  const verifySession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const profile = await apiGetCurrentUser();
      setUser(profile);
      setToken(getStoredToken());
    } catch (err) {
      setUser(null);
      clearStoredTokens();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const tokenData = await apiLogin(email, password);
      setToken(tokenData.access_token);
      const profile = await apiGetCurrentUser();
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName, email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const tokenData = await apiSignup(fullName, email, password);
      setToken(tokenData.access_token);
      const profile = await apiGetCurrentUser();
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check the input.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setToken(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        clearError,
        login,
        signup,
        logout,
        refreshUser: verifySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
