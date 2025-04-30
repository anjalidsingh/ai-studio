import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { login, isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Login component
  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleLogin = async (e) => {
      e.preventDefault();
      
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password');
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const result = await login({ email, password });
        
        if (result.success) {
          dispatch(showNotification({
            message: 'Logged in successfully',
            type: 'success'
          }));
          
          // Navigate to the home page or intended destination
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Login error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="auth-form-container">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your AI Studio account</p>
        
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
            <div className="form-help-text">
              <a href="/auth/reset-password" className="text-link">Forgot password?</a>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="auth-divider">
          <span>Don't have an account?</span>
        </div>
        
        <button 
          className="btn secondary signup-link"
          onClick={() => navigate('/auth/signup')}
        >
          Create Account
        </button>
      </div>
    );
  };
  
  // Signup component
  const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleSignup = async (e) => {
      e.preventDefault();
      
      // Basic validation
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      // This is a demo, so we'll just simulate a successful signup
      // In a real app, you would call an API to create the user
      try {
        setLoading(true);
        setError('');
        
        // Fake delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // After successful signup, login the user
        const result = await login({ email, password });
        
        if (result.success) {
          dispatch(showNotification({
            message: 'Account created successfully',
            type: 'success'
          }));
          
          navigate('/');
        } else {
          setError('Account created but could not log in automatically');
        }
      } catch (error) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Signup error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="auth-form-container">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Start building with AI Studio</p>
        
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <div className="input-with-icon">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>
        
        <button 
          className="btn secondary login-link"
          onClick={() => navigate('/auth/login')}
        >
          Sign In
        </button>
      </div>
    );
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <i className="fas fa-brain"></i>
          <h2>AI Studio</h2>
        </div>
        
        <div className="auth-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* Add more routes as needed (password reset, etc.) */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Auth;