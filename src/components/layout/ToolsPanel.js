// src/components/layout/ToolsPanel.js
// This update makes the ToolsPanel load models from constants

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleToolsPanel } from '../../redux/slices/workspaceSlice';
import { selectModel, loadModelsFromConstants } from '../../redux/slices/aiModelsSlice';
import { openModal } from '../../redux/slices/uiSlice';
import ModelSelector from '../ai/ModelSelector';
import CreativeToolkit from '../ai/CreativeToolkit';
import './ToolsPanel.css';

const ToolsPanel = () => {
  const dispatch = useDispatch();
  
  // Get active mode from Redux
  const activeMode = useSelector(state => state.workspace.activeMode);
  const selectedModel = useSelector(state => state.aiModels.selectedModel);
  const models = useSelector(state => state.aiModels.models);
  const apiKeyVerified = useSelector(state => state.aiModels.apiKeyVerified);
  const loadingModels = useSelector(state => state.aiModels.loadingModels);
  
  // Local state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    aiModels: true,
    creativeToolkit: true,
    aiCapabilities: true,
    assetLibrary: true
  });
  
  // Expand different sections based on active mode
  useEffect(() => {
    switch (activeMode) {
      case 'content':
        setExpandedSections({
          aiModels: true,
          creativeToolkit: true,
          aiCapabilities: true,
          assetLibrary: true
        });
        break;
      case 'code':
        setExpandedSections({
          aiModels: true,
          creativeToolkit: false,
          aiCapabilities: true,
          assetLibrary: true
        });
        break;
      case 'workflow':
        setExpandedSections({
          aiModels: true,
          creativeToolkit: false,
          aiCapabilities: false,
          assetLibrary: true
        });
        break;
      case 'visual':
        setExpandedSections({
          aiModels: true,
          creativeToolkit: false,
          aiCapabilities: true,
          assetLibrary: true
        });
        break;
      default:
        break;
    }
  }, [activeMode]);
  
  // Load models from constants when component mounts
  useEffect(() => {
    if (apiKeyVerified && models.length === 0) {
      dispatch(loadModelsFromConstants());
    }
  }, [dispatch, apiKeyVerified, models.length]);
  
  // Toggle section expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle model selection
  const handleModelSelect = (modelId) => {
    dispatch(selectModel(modelId));
  };
  
  // Set up API key
  const handleSetupApiKey = () => {
    dispatch(openModal('apiKey'));
  };
  
  return (
    <div className="tools-panel">
      <button 
        className="toggle-tools-panel"
        onClick={() => dispatch(toggleToolsPanel())}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
      
      <div className="tools-section">
        <div 
          className="tools-header"
          onClick={() => toggleSection('aiModels')}
        >
          <span>AI Models</span>
          <div className="tools-header-actions">
            <button 
              className="header-action-button"
              onClick={(e) => {
                e.stopPropagation();
                handleSetupApiKey();
              }}
              title="API Settings"
            >
              <i className="fas fa-cog"></i>
            </button>
            <i className={`fas fa-chevron-${expandedSections.aiModels ? 'down' : 'right'}`}></i>
          </div>
        </div>
        
        {expandedSections.aiModels && (
          <>
            {!apiKeyVerified ? (
              <div className="api-key-required">
                <p>API key required to access AI models</p>
                <button 
                  className="btn sm"
                  onClick={handleSetupApiKey}
                >
                  <i className="fas fa-key"></i> Set API Key
                </button>
              </div>
            ) : loadingModels ? (
              <div className="loading-models">
                <div className="spinner"></div>
                <p>Loading available models...</p>
              </div>
            ) : models.length === 0 ? (
              <div className="loading-models">
                <p>No models available</p>
                <button 
                  className="btn sm"
                  onClick={() => dispatch(loadModelsFromConstants())}
                >
                  <i className="fas fa-sync"></i> Load Models
                </button>
              </div>
            ) : (
              <ModelSelector 
                models={models}
                selectedModel={selectedModel}
                onSelect={handleModelSelect}
              />
            )}
          </>
        )}
      </div>
      
      <div className="tools-section">
        <div 
          className="tools-header"
          onClick={() => toggleSection('creativeToolkit')}
        >
          <span>Creative Toolkit</span>
          <i className={`fas fa-chevron-${expandedSections.creativeToolkit ? 'down' : 'right'}`}></i>
        </div>
        
        {expandedSections.creativeToolkit && (
          <CreativeToolkit mode={activeMode} />
        )}
      </div>
      
      <div className="tools-section">
        <div 
          className="tools-header"
          onClick={() => toggleSection('aiCapabilities')}
        >
          <span>AI Capabilities</span>
          <i className={`fas fa-chevron-${expandedSections.aiCapabilities ? 'down' : 'right'}`}></i>
        </div>
        
        {expandedSections.aiCapabilities && (
          <div className="ai-capabilities">
            <div className="capabilities-wrapper">
              <div className="chip"><i className="fas fa-magic"></i> Summarize</div>
              <div className="chip"><i className="fas fa-expand"></i> Expand</div>
              <div className="chip"><i className="fas fa-language"></i> Rephrase</div>
              <div className="chip"><i className="fas fa-check"></i> Analyze</div>
              <div className="chip"><i className="fas fa-lightbulb"></i> Ideate</div>
              <div className="chip"><i className="fas fa-paint-brush"></i> Visualize</div>
              <div className="chip"><i className="fas fa-code"></i> Code</div>
              <div className="chip"><i className="fas fa-calculator"></i> Calculate</div>
              <div className="chip"><i className="fas fa-search"></i> Research</div>
              <div className="chip"><i className="fas fa-edit"></i> Edit</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="tools-section">
        <div 
          className="tools-header"
          onClick={() => toggleSection('assetLibrary')}
        >
          <span>Asset Library</span>
          <div className="tools-header-actions">
            <button 
              className="header-action-button"
              onClick={(e) => {
                e.stopPropagation();
                // Handle add asset (placeholder)
                console.log('Add asset clicked');
              }}
              title="Add Asset"
            >
              <i className="fas fa-plus"></i>
            </button>
            <i className={`fas fa-chevron-${expandedSections.assetLibrary ? 'down' : 'right'}`}></i>
          </div>
        </div>
        
        {expandedSections.assetLibrary && (
          <div className="asset-library">
            <div className="asset-item"><i className="fas fa-image"></i></div>
            <div className="asset-item"><i className="fas fa-file-pdf"></i></div>
            <div className="asset-item"><i className="fas fa-file-csv"></i></div>
            <div className="asset-item"><i className="fas fa-file-code"></i></div>
            <div className="asset-item"><i className="fas fa-file-audio"></i></div>
            <div className="asset-item"><i className="fas fa-file-video"></i></div>
            <div className="asset-item"><i className="fas fa-file-alt"></i></div>
            <div className="asset-item"><i className="fas fa-plus"></i></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPanel;