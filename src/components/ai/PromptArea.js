// src/components/ai/PromptArea.js
// This update makes content generation work properly

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { generateContent, loadModelsFromConstants } from '../../redux/slices/aiModelsSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import './PromptArea.css';

const PromptArea = () => {
  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  
  // Get state from Redux
  const selectedModel = useSelector(state => state.aiModels.selectedModel);
  const apiKeyVerified = useSelector(state => state.aiModels.apiKeyVerified);
  const generating = useSelector(state => state.aiModels.generatingContent);
  const models = useSelector(state => state.aiModels.models);
  
  // Focus on textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Load models if needed
  useEffect(() => {
    if (apiKeyVerified && models.length === 0) {
      dispatch(loadModelsFromConstants());
    }
  }, [dispatch, apiKeyVerified, models.length]);
  
  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        200,
        textareaRef.current.scrollHeight
      )}px`;
    }
  }, [prompt]);
  
  // Handle prompt submission
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      // No need to show notification for empty prompt
      return;
    }
    
    if (!apiKeyVerified) {
      dispatch(showNotification({
        message: 'Please set up your API key first in Settings',
        type: 'warning'
      }));
      return;
    }
    
    if (!selectedModel) {
      dispatch(showNotification({
        message: 'Please select an AI model first',
        type: 'warning'
      }));
      return;
    }
    
    try {
      // Generate content using the selected model
      await dispatch(generateContent({
        prompt: prompt.trim(),
        model: selectedModel
      })).unwrap();
      
      // Clear prompt and close prompt area on success
      setPrompt('');
      dispatch(togglePromptArea());
    } catch (error) {
      console.error('Content generation error:', error);
      dispatch(showNotification({
        message: error.message || 'Failed to generate content',
        type: 'error'
      }));
    }
  };
  
  // Handle key press events
  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      dispatch(togglePromptArea());
    }
  };
  
  return (
    <div className="prompt-area">
      <textarea
        ref={textareaRef}
        className="prompt-input"
        placeholder="Ask AI for help or suggestions... (Ctrl+Enter to send)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={generating}
      />
      
      <button 
        className="btn"
        onClick={handleSubmit}
        disabled={generating || !prompt.trim()}
      >
        {generating ? (
          <>
            <span className="spinner-small"></span>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <i className="fas fa-robot"></i>
            <span>Generate</span>
          </>
        )}
      </button>
      
      <button 
        className="btn secondary"
        onClick={() => dispatch(togglePromptArea())}
        disabled={generating}
      >
        <i className="fas fa-times"></i>
        <span>Cancel</span>
      </button>
    </div>
  );
};

export default PromptArea;