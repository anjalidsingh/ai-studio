import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { openModal } from '../../redux/slices/uiSlice';
import { saveCurrentProject } from '../../redux/slices/projectsSlice';
import './TopBar.css';

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get current project from Redux
  const currentProject = useSelector(state => state.projects.currentProject);
  
  // State for user dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Open projects modal
  const handleOpenProjects = () => {
    navigate('/');
  };
  
  // Save current project
  const handleSave = async () => {
    if (!currentProject) {
      dispatch(openModal('newProject'));
      return;
    }
    
    try {
      await dispatch(saveCurrentProject()).unwrap();
      // Use a toast or notification component here
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };
  
  // Export the current project
  const handleExport = () => {
    if (!currentProject) {
      alert('No project to export');
      return;
    }
    
    dispatch(openModal('exportProject'));
  };
  
  // Toggle user menu
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div className="top-bar">
      <div className="logo-area">
        <span className="logo-icon"><i className="fas fa-brain"></i></span>
        <span className="logo-text">AI Studio</span>
      </div>
      
      {currentProject && (
        <div className="project-title-area">
          <input 
            type="text"
            className="project-title-input"
            value={currentProject.title || 'Untitled Project'}
            onChange={(e) => {
              // We'd dispatch an action to update the title
              // This is simplified for brevity
            }}
          />
        </div>
      )}
      
      <div className="top-bar-actions">
        <button className="btn secondary" onClick={handleOpenProjects}>
          <i className="fas fa-folder-open"></i>
          <span>Projects</span>
        </button>
        
        <button className="btn" onClick={handleSave}>
          <i className="fas fa-save"></i>
          <span>Save</span>
        </button>
        
        <button className="btn" onClick={handleExport}>
          <i className="fas fa-share"></i>
          <span>Export</span>
        </button>
        
        <button className="theme-toggle" onClick={toggleTheme}>
          <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
        
        <div className="user-menu-container">
          <button className="user-menu-button" onClick={toggleUserMenu}>
            {isAuthenticated && user ? (
              user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name?.charAt(0) || '?'}
                </div>
              )
            ) : (
              <i className="fas fa-user"></i>
            )}
          </button>
          
          {userMenuOpen && (
            <div className="user-dropdown">
              {isAuthenticated ? (
                <>
                  <div className="user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <i className="fas fa-cog"></i> Settings
                  </button>
                  <button className="dropdown-item" onClick={() => dispatch(openModal('about'))}>
                    <i className="fas fa-info-circle"></i> About
                  </button>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Log Out
                  </button>
                </>
              ) : (
                <>
                  <button className="dropdown-item" onClick={() => navigate('/auth/login')}>
                    <i className="fas fa-sign-in-alt"></i> Log In
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/auth/signup')}>
                    <i className="fas fa-user-plus"></i> Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;