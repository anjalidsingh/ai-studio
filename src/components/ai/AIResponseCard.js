import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideAIResponse } from '../../redux/slices/uiSlice';
import { addContentBlock } from '../../redux/slices/projectsSlice';
import './AIResponseCard.css';

const AIResponseCard = () => {
  const dispatch = useDispatch();
  
  // Get AI response data from Redux
  const aiResponse = useSelector(state => state.ui.aiResponse);
  const { content, title } = aiResponse;
  
  // State for handling the dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // State to identify selected suggestions for applying
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  
  // Reset position when the component is first shown
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [aiResponse.open]);
  
  // Parse suggestions from content
  const parseSuggestions = () => {
    // Simple parsing based on common patterns
    if (!content) return [];
    
    const suggestions = [];
    
    // Try to parse numbered list items
    const numberedListRegex = /\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gs;
    let match;
    while ((match = numberedListRegex.exec(content)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    // If no numbered items, try bullet points
    if (suggestions.length === 0) {
      const bulletListRegex = /[•\-\*]\s+(.+?)(?=\n[•\-\*]|\n\n|$)/gs;
      while ((match = bulletListRegex.exec(content)) !== null) {
        suggestions.push(match[1].trim());
      }
    }
    
    // If still empty, split by lines
    if (suggestions.length === 0) {
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
    
    return suggestions;
  };
  
  const suggestions = parseSuggestions();
  
  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.suggestion-item') || e.target.closest('.ai-response-actions')) {
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
  
  // Position styles with transform
  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab'
  };
  
  return (
    <div 
      className="ai-response-card"
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="ai-response-header">
        <div>{title || 'AI Suggestions'}</div>
        <button 
          className="close-button"
          onClick={() => dispatch(hideAIResponse())}
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="ai-response-content">
        {suggestions.length > 0 ? (
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
        ) : (
          <p>{content}</p>
        )}
      </div>
      
      <div className="ai-response-actions">
        <button 
          className="btn secondary"
          onClick={() => dispatch(hideAIResponse())}
        >
          Dismiss
        </button>
        <button 
          className="btn"
          onClick={applySuggestions}
        >
          {selectedSuggestions.length > 0 
            ? `Apply (${selectedSuggestions.length})` 
            : 'Apply All'}
        </button>
      </div>
    </div>
  );
};

export default AIResponseCard;