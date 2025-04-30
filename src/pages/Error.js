import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Error.css';

const Error = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if it's a 404 or another error
  const is404 = location.state?.notFound || location.pathname === '/404';
  
  // Error message based on type
  const errorTitle = is404 ? "Page Not Found" : "Something Went Wrong";
  const errorMessage = is404
    ? "The page you're looking for doesn't exist or has been moved."
    : "We encountered an error while processing your request.";
  const errorIcon = is404 ? "fas fa-map-signs" : "fas fa-exclamation-circle";
  
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon">
          <i className={errorIcon}></i>
        </div>
        
        <h1 className="error-title">{errorTitle}</h1>
        <p className="error-message">{errorMessage}</p>
        
        <div className="error-actions">
          <button 
            className="btn secondary"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Go Back</span>
          </button>
          
          <button 
            className="btn"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-home"></i>
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error;