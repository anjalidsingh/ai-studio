import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { addContentBlock } from '../../redux/slices/projectsSlice';
import './ActionMenu.css';

const ActionMenu = () => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  
  // Get active mode from Redux
  const activeMode = useSelector(state => state.workspace.activeMode);
  
  // Toggle menu expansion
  const toggleMenu = () => {
    setExpanded(!expanded);
  };
  
  // Open AI prompt area
  const openPromptArea = () => {
    dispatch(togglePromptArea());
    setExpanded(false);
  };
  
  // Add a new block of specific type
  const addBlock = (type) => {
    dispatch(addContentBlock({ type, content: '' }));
    setExpanded(false);
  };
  
  // Define actions based on active mode
  const getActionsForMode = () => {
    switch (activeMode) {
      case 'content':
        return [
          { id: 'text', icon: 'fas fa-align-left', label: 'Add Text', action: () => addBlock('text') },
          { id: 'heading', icon: 'fas fa-heading', label: 'Add Heading', action: () => addBlock('heading') },
          { id: 'list', icon: 'fas fa-list', label: 'Add List', action: () => addBlock('list') },
          { id: 'code', icon: 'fas fa-code', label: 'Add Code', action: () => addBlock('code') },
          { id: 'image', icon: 'fas fa-image', label: 'Add Image', action: () => addBlock('image') }
        ];
      case 'code':
        return [
          { id: 'function', icon: 'fas fa-cogs', label: 'Add Function', action: () => addBlock('function') },
          { id: 'class', icon: 'fas fa-cube', label: 'Add Class', action: () => addBlock('class') },
          { id: 'import', icon: 'fas fa-file-import', label: 'Add Import', action: () => addBlock('import') },
          { id: 'comment', icon: 'fas fa-comment', label: 'Add Comment', action: () => addBlock('comment') }
        ];
      case 'workflow':
        return [
          { id: 'node', icon: 'fas fa-square', label: 'Add Node', action: () => addBlock('node') },
          { id: 'connector', icon: 'fas fa-arrows-alt-h', label: 'Add Connector', action: () => addBlock('connector') },
          { id: 'conditional', icon: 'fas fa-random', label: 'Add Condition', action: () => addBlock('conditional') },
          { id: 'output', icon: 'fas fa-sign-out-alt', label: 'Add Output', action: () => addBlock('output') }
        ];
      case 'visual':
        return [
          { id: 'chart', icon: 'fas fa-chart-bar', label: 'Add Chart', action: () => addBlock('chart') },
          { id: 'table', icon: 'fas fa-table', label: 'Add Table', action: () => addBlock('table') },
          { id: 'grid', icon: 'fas fa-th', label: 'Add Grid', action: () => addBlock('grid') },
          { id: 'map', icon: 'fas fa-map', label: 'Add Map', action: () => addBlock('map') }
        ];
      default:
        return [];
    }
  };
  
  const actions = getActionsForMode();
  
  return (
    <div className="action-menu">
      {/* Mini action buttons (visible when expanded) */}
      {expanded && (
        <>
          {actions.map(action => (
            <button 
              key={action.id}
              className="action-button mini-action" 
              onClick={action.action}
              title={action.label}
            >
              <i className={action.icon}></i>
            </button>
          ))}
          
          {/* AI prompt action button (always available) */}
          <button 
            className="action-button mini-action accent"
            onClick={openPromptArea}
            title="Ask AI for help"
          >
            <i className="fas fa-robot"></i>
          </button>
        </>
      )}
      
      {/* Main action button (toggles expansion) */}
      <button 
        className="action-button" 
        id="main-action-button"
        onClick={toggleMenu}
      >
        <i className={expanded ? 'fas fa-times' : 'fas fa-plus'}></i>
      </button>
    </div>
  );
};

export default ActionMenu;