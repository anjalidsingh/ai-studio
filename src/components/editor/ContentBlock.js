import React, { useState, useEffect, useRef } from 'react';
import './ContentBlock.css';

const ContentBlock = ({ block, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(block.content || '');
  const editRef = useRef(null);
  
  // Update local content when block content changes
  useEffect(() => {
    setContent(block.content || '');
  }, [block.content]);
  
  // Focus on the editable element when editing starts
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
    }
  }, [editing]);
  
  // Handle content change
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };
  
  // Save changes and exit editing mode
  const handleSave = () => {
    onUpdate(content);
    setEditing(false);
  };
  
  // Handle keydown events
  const handleKeyDown = (e) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
      return;
    }
    
    // Exit editing on Escape
    if (e.key === 'Escape') {
      setEditing(false);
      setContent(block.content || ''); // Reset to original
      return;
    }
  };
  
  // Render different block types
  const renderBlockContent = () => {
    if (editing) {
      return (
        <div className="block-editor">
          <textarea 
            ref={editRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`block-editor-input ${block.type}`}
            rows={Math.max(4, content.split('\n').length)}
          />
          <div className="editor-controls">
            <button className="editor-control-btn" onClick={handleSave}>
              <i className="fas fa-check"></i>
            </button>
            <button 
              className="editor-control-btn cancel"
              onClick={() => {
                setEditing(false);
                setContent(block.content || '');
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      );
    }
    
    switch (block.type) {
      case 'heading':
        return <h1 className="block-heading">{content}</h1>;
        
      case 'subheading':
        return <h2 className="block-subheading">{content}</h2>;
        
      case 'text':
        return (
          <div className="block-text">
            {content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        );
        
      case 'list':
        return (
          <div className="block-list">
            <ul>
              {content.split('\n').map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          </div>
        );
        
      case 'code':
        return (
          <div className="block-code">
            <pre>
              <code>{content}</code>
            </pre>
          </div>
        );
        
      case 'image':
        return (
          <div className="block-image">
            {content ? (
              <img src={content} alt="Content" />
            ) : (
              <div className="image-placeholder">
                <i className="fas fa-image"></i>
                <span>No image</span>
              </div>
            )}
          </div>
        );
        
      default:
        return <div className="block-text">{content}</div>;
    }
  };
  
  return (
    <div className={`content-block ${block.type}`}>
      <div 
        className="block-content" 
        onClick={() => !editing && setEditing(true)}
      >
        {renderBlockContent()}
      </div>
      
      {!editing && (
        <div className="block-actions">
          <button 
            className="block-action-btn edit"
            onClick={() => setEditing(true)}
            aria-label="Edit"
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button 
            className="block-action-btn delete"
            onClick={onDelete}
            aria-label="Delete"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentBlock;