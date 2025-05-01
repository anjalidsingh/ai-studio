import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideAIResponse, showNotification } from '../../redux/slices/uiSlice';
import { addContentBlock } from '../../redux/slices/projectsSlice';
import { setActiveMode } from '../../redux/slices/workspaceSlice';
import { processAiResponse } from '../../utils/aiResponseHandler';
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

  // Parse markdown formatting in text
  const parseMarkdownFormatting = (text) => {
    if (!text) return text;
    
    // Handle bold text (**text**)
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (*text*)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle inline code (`code`)
    formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formattedText;
  };
  
  // Parse content for headings, paragraphs, and structure
  const parseContentStructure = (contentText) => {
    if (!contentText) return [];
    
    const sections = [];
    const lines = contentText.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
      // Check for headers
      if (line.startsWith('# ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'heading', level: 1, content: line.substring(2), children: [] };
        sections.push(currentSection);
        currentSection = null;
      } 
      else if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'heading', level: 2, content: line.substring(3), children: [] };
        sections.push(currentSection);
        currentSection = null;
      }
      // Check for lists
      else if (line.match(/^\d+\.\s+/) || line.match(/^[•\-\*]\s+/)) {
        if (!currentSection || currentSection.type !== 'list') {
          if (currentSection) sections.push(currentSection);
          currentSection = { type: 'list', items: [] };
        }
        currentSection.items.push(line);
      }
      // Check for code blocks
      else if (line.startsWith('```')) {
        if (currentSection && currentSection.type === 'code') {
          // End of code block
          currentSection.content += line + '\n';
          sections.push(currentSection);
          currentSection = null;
        } else {
          // Start of code block
          if (currentSection) sections.push(currentSection);
          currentSection = { type: 'code', content: line + '\n' };
        }
      }
      // Regular text/paragraph
      else {
        if (currentSection && currentSection.type === 'code') {
          currentSection.content += line + '\n';
        } else if (line.trim() === '') {
          if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
          }
        } else {
          if (!currentSection || currentSection.type !== 'text') {
            if (currentSection) sections.push(currentSection);
            currentSection = { type: 'text', content: line };
          } else {
            currentSection.content += '\n' + line;
          }
        }
      }
    });
    
    // Add the last section if any
    if (currentSection) sections.push(currentSection);
    
    return sections;
  };
  
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

  // Extract images from content
  const extractImages = () => {
    const contentText = typeof content === 'string' ? content : 
      (content && typeof content === 'object' && content.content ? content.content : '');
    
    if (!contentText) return [];
    
    const images = [];
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;
    
    while ((match = imageRegex.exec(contentText)) !== null) {
      const alt = match[1];
      const url = match[2];
      images.push({ alt, url });
    }
    
    return images;
  };
  
  const suggestions = contentType === 'list' ? parseSuggestions() : [];
  const codeBlocks = contentType === 'code' ? extractCodeBlocks() : [];
  const images = extractImages();
  const contentSections = parseContentStructure(typeof content === 'string' ? content : 
    (content && typeof content === 'object' && content.content ? content.content : ''));
  
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
    
    // Add each selected suggestion as a content block to the appropriate workspace
    // This now correctly respects the current activeMode
    indicesToApply.forEach(index => {
      const content = suggestions[index];
      
      // Use processAiResponse to apply to the current workspace
      processAiResponse({ content }, activeMode, dispatch);
    });
    
    // Close the response card
    dispatch(hideAIResponse());
  };
  
  // Apply a code block
  const applyCodeBlock = (code, language) => {
    // If we're in code studio, add the code block there directly
    if (activeMode === 'code') {
      dispatch(addContentBlock({
        type: 'code',
        content: code,
        title: `generated-${getFileExtension(language)}`,
        metadata: {
          language
        }
      }));
    } else {
      // Otherwise, use the general processAiResponse which will handle it based on mode
      processAiResponse({ content: code }, activeMode, dispatch);
    }
    
    dispatch(hideAIResponse());
  };

  // Apply content to appropriate workspace based on mode
  const applyToCurrentWorkspace = () => {
    try {
      // Pass the entire AI response object and the current activeMode
      processAiResponse(aiResponse, activeMode, dispatch);
      
      // Show success notification
      dispatch(showNotification({
        message: `Applied to ${getWorkspaceName(activeMode)}`,
        type: 'success'
      }));
    } catch (error) {
      console.error('Error applying to workspace:', error);
      dispatch(showNotification({
        message: 'Failed to apply content to workspace',
        type: 'error'
      }));
    }
  };

  // Apply to Content Editor
  const applyToContentEditor = () => {
    dispatch(setActiveMode('content'));
    processAiResponse(aiResponse, 'content', dispatch);
  };

  // Apply to Code Studio
  const applyToCodeStudio = () => {
    dispatch(setActiveMode('code'));
    processAiResponse(aiResponse, 'code', dispatch);
  };

  // Apply to Workflow Designer
  const applyToWorkflowDesigner = () => {
    dispatch(setActiveMode('workflow'));
    processAiResponse(aiResponse, 'workflow', dispatch);
  };

  // Apply to Visual Lab
  const applyToVisualLab = () => {
    dispatch(setActiveMode('visual'));
    processAiResponse(aiResponse, 'visual', dispatch);
  };

  // Get workspace name for display
  const getWorkspaceName = (mode) => {
    switch (mode) {
      case 'content': return 'Content Editor';
      case 'code': return 'Code Studio';
      case 'workflow': return 'Workflow Designer';
      case 'visual': return 'Visual Lab';
      default: return 'Workspace';
    }
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
  
  // Render content section
  const renderContentSection = (section, index) => {
    if (section.type === 'heading') {
      return (
        <div key={index} className={`heading-${section.level}`}>
          <h3 dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(section.content) }} />
        </div>
      );
    } else if (section.type === 'text') {
      return (
        <div key={index} className="text-content">
          {section.content.split('\n').map((line, lineIndex) => (
            <p key={lineIndex} dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(line) }} />
          ))}
        </div>
      );
    } else if (section.type === 'list') {
      // Check if the list is numbered
      const isNumbered = section.items[0] && section.items[0].match(/^\d+\./);
      if (isNumbered) {
        return (
          <div key={index} className="list-content">
            <ol>
              {section.items.map((item, itemIndex) => {
                // Remove the bullet or number prefix
                const cleanItem = item.replace(/^(\d+\.|\*|\-|\•)\s+/, '');
                return <li key={itemIndex} dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(cleanItem) }} />;
              })}
            </ol>
          </div>
        );
      } else {
        return (
          <div key={index} className="list-content">
            <ul>
              {section.items.map((item, itemIndex) => {
                // Remove the bullet or number prefix
                const cleanItem = item.replace(/^(\d+\.|\*|\-|\•)\s+/, '');
                return <li key={itemIndex} dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(cleanItem) }} />;
              })}
            </ul>
          </div>
        );
      }
    } else if (section.type === 'code') {
      // Extract language if available
      const match = section.content.match(/```(\w+)/);
      const language = match ? match[1] : 'javascript';
      
      // Extract code without the triple backticks
      const codeContent = section.content
        .replace(/```\w*\n/, '')
        .replace(/```\s*$/, '')
        .trim();
      
      return (
        <div key={index} className="code-block">
          <div className="code-block-header">
            <span className="code-language">{language}</span>
            <div className="code-block-actions">
              <button 
                className="code-action-btn"
                onClick={() => applyCodeBlock(codeContent, language)}
                title="Apply this code"
              >
                <i className="fas fa-check"></i>
              </button>
            </div>
          </div>
          <pre className="code-content">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    }
    
    return null;
  };
  
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
                <div className="suggestion-text" dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(suggestion) }} />
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
        ) : contentSections.length > 0 ? (
          <div className="structured-content">
            {contentSections.map((section, index) => renderContentSection(section, index))}
          </div>
        ) : (
          <div className="text-content">
            {displayContent.split('\n').map((line, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: parseMarkdownFormatting(line) }} />
            ))}
          </div>
        )}
        
        {images.length > 0 && (
          <div className="image-content">
            <h4>Images</h4>
            <div className="image-grid">
              {images.map((image, index) => (
                <div key={index} className="image-item">
                  <img src={image.url} alt={image.alt} />
                  <p>{image.alt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick action buttons to apply to specific workspace */}
        <div className="apply-to-workspace">
          <h4>Apply to:</h4>
          <div className="workspace-buttons">
            <button 
              className={`workspace-btn ${activeMode === 'content' ? 'active' : ''}`}
              onClick={applyToContentEditor}
            >
              <i className="fas fa-file-alt"></i>
              <span>Content</span>
            </button>
            <button 
              className={`workspace-btn ${activeMode === 'code' ? 'active' : ''}`}
              onClick={applyToCodeStudio}
            >
              <i className="fas fa-code"></i>
              <span>Code</span>
            </button>
            <button 
              className={`workspace-btn ${activeMode === 'workflow' ? 'active' : ''}`}
              onClick={applyToWorkflowDesigner}
            >
              <i className="fas fa-sitemap"></i>
              <span>Workflow</span>
            </button>
            <button 
              className={`workspace-btn ${activeMode === 'visual' ? 'active' : ''}`}
              onClick={applyToVisualLab}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Visual</span>
            </button>
          </div>
        </div>
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
        
        <button 
          className="btn accent"
          onClick={applyToCurrentWorkspace}
        >
          <i className="fas fa-magic"></i>
          <span>Apply to {getWorkspaceName(activeMode)}</span>
        </button>
      </div>
    </div>
  );
};

export default AIResponseCard;