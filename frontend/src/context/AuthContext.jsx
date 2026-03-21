import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    // Set axios header immediately if token exists
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    // Set timeout to prevent indefinite hanging
    axios.defaults.timeout = 15000; // 15 seconds
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Only verify token if we don't already have user data
      // This prevents redundant API calls immediately after login/signup
      if (!user) {
        verifyToken();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/verify`);
      setUser(res.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        name,
        email: email.toLowerCase().trim(),
        password
      });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      return { success: true };
    } catch (error) {
      if (!error.response || error.response.status >= 500) {
        console.error('Signup error:', error);
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email: email.toLowerCase().trim(),
        password
      });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      return { success: true };
    } catch (error) {
      if (!error.response || error.response.status >= 500) {
        console.error('Login error detail:', error);
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Notify server about logout to record exact time
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
    } catch (error) {
      console.error('Server-side logout failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const refreshUser = async () => {
    await verifyToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
