// src/components/ai/AIResponseCard.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideAIResponse } from '../../redux/slices/uiSlice';
import { addContentBlock } from '../../redux/slices/projectsSlice';
import './AIResponseCard.css';

const AIResponseCard = () => {
  const dispatch = useDispatch();
  
  // Get AI response data from Redux
  const aiResponse = useSelector(state => state.ui.aiResponse);
  const activeMode = useSelector(state => state.workspace.activeMode);
  const { content, title } = aiResponse;
  
  // State for handling the dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // State to identify selected suggestions for applying
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  
  // State for content type detection
  const [contentType, setContentType] = useState('text'); // 'text', 'code', 'list'
  
  // Reset position when the component is first shown
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    
    // Detect content type
    const contentString = typeof content === 'string' ? content : 
      (content && typeof content === 'object' && content.content ? content.content : '');
    
    // Detect if the content contains code blocks
    if (contentString.includes('```') || contentString.includes('function') || 
        contentString.includes('class') || contentString.includes('import') ||
        contentString.includes('const ') || contentString.includes('var ') ||
        contentString.includes('let ')) {
      setContentType('code');
    } 
    // Detect if the content is a list
    else if (contentString.match(/^\d+\.\s+/m) || contentString.match(/^[•\-\*]\s+/m)) {
      setContentType('list');
    } else {
      setContentType('text');
    }
  }, [aiResponse.open, content]);
  
  // Parse suggestions from content
  const parseSuggestions = () => {
    // Check if content is a string before using string methods
    const contentText = typeof content === 'string' ? content : 
      (content && typeof content === 'object' && content.content ? content.content : '');
    
    if (!contentText) return [];
    
    const suggestions = [];
    
    // Try to parse numbered list items
    const numberedListRegex = /\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gs;
    let match;
    while ((match = numberedListRegex.exec(contentText)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    // If no numbered items, try bullet points
    if (suggestions.length === 0) {
      const bulletListRegex = /[•\-\*]\s+(.+?)(?=\n[•\-\*]|\n\n|$)/gs;
      while ((match = bulletListRegex.exec(contentText)) !== null) {
        suggestions.push(match[1].trim());
      }
    }
    
    // If still empty, try to extract code blocks
    if (suggestions.length === 0 && contentType === 'code') {
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)```/g;
      while ((match = codeBlockRegex.exec(contentText)) !== null) {
        suggestions.push(match[1].trim());
      }
    }
    
    // If still empty, split by lines
    if (suggestions.length === 0) {
      return contentText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
    
    return suggestions;
  };
  
  // Extract code blocks from content
  const extractCodeBlocks = () => {
    // Check if content is a string before using string methods
    const contentText = typeof content === 'string' ? content : 
      (content && typeof content === 'object' && content.content ? content.content : '');
    
    if (!contentText) return [];
    
    const codeBlocks = [];
    const codeBlockRegex = /```(?:(\w+))?\n([\s\S]+?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(contentText)) !== null) {
      const language = match[1] || 'javascript';
      const code = match[2].trim();
      codeBlocks.push({ language, code });
    }
    
    return codeBlocks;
  };
  
  const suggestions = contentType === 'list' ? parseSuggestions() : [];
  const codeBlocks = contentType === 'code' ? extractCodeBlocks() : [];
  
  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.suggestion-item') || e.target.closest('.ai-response-actions') || 
        e.target.closest('.code-block-actions')) {
      // Don't start dragging if clicking on a suggestion or action button
      return;
    }
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    });
  };
  
  // Handle mouse move during drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Toggle a suggestion selection
  const toggleSuggestion = (index) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Apply selected suggestions
  const applySuggestions = () => {
    // If no suggestions are selected, apply all
    const indicesToApply = selectedSuggestions.length > 0 
      ? selectedSuggestions 
      : suggestions.map((_, i) => i);
    
    // Add each selected suggestion as a content block
    indicesToApply.forEach(index => {
      dispatch(addContentBlock({
        type: 'text',
        content: suggestions[index]
      }));
    });
    
    // Close the response card
    dispatch(hideAIResponse());
  };
  
  // Apply a code block
  const applyCodeBlock = (code, language) => {
    dispatch(addContentBlock({
      type: 'code',
      content: code,
      title: `generated-${getFileExtension(language)}`,
      metadata: {
        language
      }
    }));
    
    dispatch(hideAIResponse());
  };
  
  // Helper to get file extension from language
  const getFileExtension = (language) => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'js';
      case 'python':
      case 'py':
        return 'py';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'typescript':
      case 'ts':
        return 'ts';
      default:
        return 'txt';
    }
  };
  
  // Position styles with transform
  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab'
  };
  
  // Get the content to display
  const displayContent = typeof content === 'string' ? content : (
    content && typeof content === 'object' && content.content ? content.content : ''
  );
  
  return (
    <div 
      className="ai-response-card"
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="ai-response-header">
        <div>{title || 'AI Response'}</div>
        <button 
          className="close-button"
          onClick={() => dispatch(hideAIResponse())}
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="ai-response-content">
        {contentType === 'list' && suggestions.length > 0 ? (
          <div className="suggestion-list">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className={`suggestion-item ${selectedSuggestions.includes(index) ? 'selected' : ''}`}
                onClick={() => toggleSuggestion(index)}
              >
                <div className="suggestion-checkbox">
                  {selectedSuggestions.includes(index) && <i className="fas fa-check"></i>}
                </div>
                <div className="suggestion-text">{suggestion}</div>
              </div>
            ))}
          </div>
        ) : contentType === 'code' && codeBlocks.length > 0 ? (
          <div className="code-blocks">
            {codeBlocks.map((block, index) => (
              <div key={index} className="code-block">
                <div className="code-block-header">
                  <span className="code-language">{block.language}</span>
                  <div className="code-block-actions">
                    <button 
                      className="code-action-btn"
                      onClick={() => applyCodeBlock(block.code, block.language)}
                      title="Apply this code"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  </div>
                </div>
                <pre className="code-content">
                  <code>{block.code}</code>
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-content">
            {displayContent.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
      </div>
      
      <div className="ai-response-actions">
        <button 
          className="btn secondary"
          onClick={() => dispatch(hideAIResponse())}
        >
          Dismiss
        </button>
        
        {contentType === 'list' && suggestions.length > 0 && (
          <button 
            className="btn"
            onClick={applySuggestions}
          >
            {selectedSuggestions.length > 0 
              ? `Apply (${selectedSuggestions.length})` 
              : 'Apply All'}
          </button>
        )}
        
        {contentType === 'code' && codeBlocks.length > 0 && (
          <button 
            className="btn"
            onClick={() => applyCodeBlock(codeBlocks[0].code, codeBlocks[0].language)}
          >
            Apply Code
          </button>
        )}
        
        {contentType === 'text' && (
          <button 
            className="btn"
            onClick={() => {
              dispatch(addContentBlock({
                type: 'text',
                content: displayContent
              }));
              dispatch(hideAIResponse());
            }}
          >
            Add to Project
          </button>
        )}
      </div>
    </div>
  );
};

export default AIResponseCard;