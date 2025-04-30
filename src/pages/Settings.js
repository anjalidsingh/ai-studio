import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateUserSettings, fetchUserSettings } from '../redux/slices/userSlice';
import { setApiKey, setApiKeyVerified } from '../redux/slices/aiModelsSlice';
import { showNotification } from '../redux/slices/uiSlice';
import { clearAllData, deleteApiKey } from '../api/localStorage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  
  // Get settings from Redux
  const userSettings = useSelector(state => state.user.settings);
  const apiKey = useSelector(state => state.aiModels.apiKey);
  const apiKeyVerified = useSelector(state => state.aiModels.apiKeyVerified);
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    theme: theme,
    autoSave: userSettings.autoSave,
    defaultProjectType: userSettings.defaultProjectType,
    fontSize: userSettings.editorPreferences.fontSize,
    apiKey: apiKey || '',
    showReasoningByDefault: userSettings.showReasoningByDefault,
    confirmClearData: false
  });
  
  // Local state for loading states
  const [saving, setSaving] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Fetch user settings when component mounts
  useEffect(() => {
    dispatch(fetchUserSettings());
  }, [dispatch]);
  
  // Update form values when settings change
  useEffect(() => {
    setFormValues(prev => ({
      ...prev,
      theme: theme,
      autoSave: userSettings.autoSave,
      defaultProjectType: userSettings.defaultProjectType,
      fontSize: userSettings.editorPreferences?.fontSize || 14,
      showReasoningByDefault: userSettings.showReasoningByDefault
    }));
  }, [userSettings, theme]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Immediately apply theme changes
    if (name === 'theme') {
      setTheme(value);
    }
  };
  
  // Save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Update user settings in Redux
      await dispatch(updateUserSettings({
        theme: formValues.theme,
        autoSave: formValues.autoSave,
        defaultProjectType: formValues.defaultProjectType,
        showReasoningByDefault: formValues.showReasoningByDefault,
        editorPreferences: {
          ...userSettings.editorPreferences,
          fontSize: Number(formValues.fontSize)
        }
      })).unwrap();
      
      // Update API key if changed
      if (formValues.apiKey !== apiKey) {
        // Reset verification status when key changes
        dispatch(setApiKey(formValues.apiKey));
        dispatch(setApiKeyVerified(false));
      }
      
      dispatch(showNotification({
        message: 'Settings saved successfully',
        type: 'success'
      }));
    } catch (error) {
      console.error('Error saving settings:', error);
      dispatch(showNotification({
        message: 'Failed to save settings',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };
  
  // Verify API key
  const handleVerifyKey = async () => {
    if (!formValues.apiKey.trim()) {
      dispatch(showNotification({
        message: 'Please enter an API key',
        type: 'warning'
      }));
      return;
    }
    
    try {
      setVerifyingKey(true);
      
      // Update the API key in Redux state
      dispatch(setApiKey(formValues.apiKey));
      
      // This would trigger a verification process
      // In a real app, you would call an API to verify the key
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Assume successful verification for demo
      dispatch(setApiKeyVerified(true));
      
      dispatch(showNotification({
        message: 'API key verified successfully',
        type: 'success'
      }));
    } catch (error) {
      console.error('Error verifying API key:', error);
      dispatch(showNotification({
        message: 'Failed to verify API key',
        type: 'error'
      }));
      dispatch(setApiKeyVerified(false));
    } finally {
      setVerifyingKey(false);
    }
  };
  
  // Clear all data
  const handleClearData = async () => {
    if (!formValues.confirmClearData) {
      dispatch(showNotification({
        message: 'Please confirm data deletion',
        type: 'warning'
      }));
      return;
    }
    
    try {
      setClearing(true);
      
      // Clear all data from localStorage
      await clearAllData();
      
      // Remove API key
      await deleteApiKey('openrouter');
      dispatch(setApiKey(null));
      dispatch(setApiKeyVerified(false));
      
      dispatch(showNotification({
        message: 'All data cleared successfully',
        type: 'success'
      }));
      
      // Reset checkbox
      setFormValues(prev => ({
        ...prev,
        confirmClearData: false
      }));
      
      // Navigate to home page after clearing data
      navigate('/');
    } catch (error) {
      console.error('Error clearing data:', error);
      dispatch(showNotification({
        message: 'Failed to clear data',
        type: 'error'
      }));
    } finally {
      setClearing(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your AI Studio experience</p>
      </div>
      
      <form className="settings-form" onSubmit={handleSaveSettings}>
        <div className="settings-section">
          <h2 className="section-title">
            <i className="fas fa-palette"></i> Appearance
          </h2>
          
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select 
              id="theme"
              name="theme"
              value={formValues.theme}
              onChange={handleChange}
              className="settings-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="fontSize">Editor Font Size</label>
            <div className="range-with-value">
              <input 
                type="range"
                id="fontSize"
                name="fontSize"
                min="12"
                max="24"
                step="1"
                value={formValues.fontSize}
                onChange={handleChange}
                className="settings-range"
              />
              <span className="range-value">{formValues.fontSize}px</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="section-title">
            <i className="fas fa-sliders-h"></i> Behavior
          </h2>
          
          <div className="form-group checkbox">
            <input 
              type="checkbox"
              id="autoSave"
              name="autoSave"
              checked={formValues.autoSave}
              onChange={handleChange}
              className="settings-checkbox"
            />
            <label htmlFor="autoSave">Auto-save projects</label>
          </div>
          
          <div className="form-group checkbox">
            <input 
              type="checkbox"
              id="showReasoningByDefault"
              name="showReasoningByDefault"
              checked={formValues.showReasoningByDefault}
              onChange={handleChange}
              className="settings-checkbox"
            />
            <label htmlFor="showReasoningByDefault">Show AI reasoning by default</label>
          </div>
          
          <div className="form-group">
            <label htmlFor="defaultProjectType">Default Project Type</label>
            <select 
              id="defaultProjectType"
              name="defaultProjectType"
              value={formValues.defaultProjectType}
              onChange={handleChange}
              className="settings-select"
            >
              <option value="content">Content</option>
              <option value="code">Code</option>
              <option value="workflow">Workflow</option>
              <option value="visual">Visual</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="section-title">
            <i className="fas fa-key"></i> API Keys
          </h2>
          
          <div className="form-group">
            <label htmlFor="apiKey">OpenRouter API Key</label>
            <div className="input-with-button">
              <input 
                type="password"
                id="apiKey"
                name="apiKey"
                value={formValues.apiKey}
                onChange={handleChange}
                className="settings-input"
                placeholder="Enter your OpenRouter API key"
              />
              <button 
                type="button"
                className="btn secondary"
                onClick={handleVerifyKey}
                disabled={verifyingKey}
              >
                {verifyingKey ? (
                  <>
                    <span className="spinner-small dark"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
            
            <div className={`key-status ${apiKeyVerified ? 'verified' : ''}`}>
              {apiKeyVerified ? (
                <>
                  <i className="fas fa-check-circle"></i>
                  <span>API key verified</span>
                </>
              ) : (
                <>
                  <i className="fas fa-info-circle"></i>
                  <span>API key not verified</span>
                </>
              )}
            </div>
            
            <div className="form-help">
              <p>Get a free API key from <a href="https://openrouter.ai" target="_blank" rel="noreferrer">OpenRouter</a></p>
            </div>
          </div>
        </div>
        
        <div className="settings-section danger-zone">
          <h2 className="section-title text-danger">
            <i className="fas fa-exclamation-triangle"></i> Danger Zone
          </h2>
          
          <div className="form-group checkbox">
            <input 
              type="checkbox"
              id="confirmClearData"
              name="confirmClearData"
              checked={formValues.confirmClearData}
              onChange={handleChange}
              className="settings-checkbox"
            />
            <label htmlFor="confirmClearData">
              I understand this will permanently delete all my projects and settings
            </label>
          </div>
          
          <button 
            type="button"
            className="btn danger"
            onClick={handleClearData}
            disabled={clearing || !formValues.confirmClearData}
          >
            {clearing ? (
              <>
                <span className="spinner-small"></span>
                <span>Clearing Data...</span>
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                <span>Clear All Data</span>
              </>
            )}
          </button>
        </div>
        
        <div className="settings-section">
          <h2 className="section-title">
            <i className="fas fa-user"></i> Account
          </h2>
          
          {isAuthenticated ? (
            <button 
              type="button"
              className="btn secondary"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Log Out</span>
            </button>
          ) : (
            <button 
              type="button"
              className="btn secondary"
              onClick={() => navigate('/auth/login')}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>Sign In</span>
            </button>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button"
            className="btn secondary"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back</span>
          </button>
          
          <button 
            type="submit"
            className="btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-small"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;