import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthenticated, setProfile } from '../redux/slices/userSlice';

// Create the auth context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  loading: true
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // For demo purposes, we'll check localStorage
        // In a real app, you would validate a token with your backend
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          dispatch(setAuthenticated(true));
          dispatch(setProfile(userData));
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // For the demo, we'll simulate a successful login
      
      // Simple validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      // Create a mock user
      const userData = {
        id: 'user-123',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        avatar: null,
        role: 'user'
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state and Redux
      setUser(userData);
      dispatch(setAuthenticated(true));
      dispatch(setProfile(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    dispatch(setAuthenticated(false));
    dispatch(setProfile(null));
  };

  // Context value
  const contextValue = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;