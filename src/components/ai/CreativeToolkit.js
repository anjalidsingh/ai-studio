import React from 'react';
import { useDispatch } from 'react-redux';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import './CreativeToolkit.css';

const CreativeToolkit = ({ mode = 'content' }) => {
  const dispatch = useDispatch();
  
  // Handle tool click
  const handleToolClick = (toolType) => {
    // Open prompt area with specific context based on tool
    dispatch(togglePromptArea());
    
    // In a real implementation, you'd set specific prompt templates
    // based on the selected tool
    console.log(`${toolType} tool selected`);
  };
  
  // Get tools based on active mode
  const getToolsForMode = (mode) => {
    const baseTools = [
      { id: 'heading', icon: 'fas fa-heading', name: 'Headers' },
      { id: 'list', icon: 'fas fa-list', name: 'Lists' },
      { id: 'table', icon: 'fas fa-table', name: 'Tables' },
      { id: 'image', icon: 'fas fa-image', name: 'Images' },
      { id: 'code', icon: 'fas fa-code', name: 'Code' },
      { id: 'chart', icon: 'fas fa-chart-bar', name: 'Charts' },
      { id: 'embed', icon: 'fas fa-file-alt', name: 'Embed' },
      { id: 'link', icon: 'fas fa-link', name: 'Links' },
      { id: 'comment', icon: 'fas fa-comment', name: 'Comments' },
      { id: 'add', icon: 'fas fa-plus-circle', name: 'Add' } // Added new Add button
    ];
    
    // Add mode-specific tools
    switch (mode) {
      case 'code':
        return [
          ...baseTools,
          { id: 'function', icon: 'fas fa-cogs', name: 'Function' },
          { id: 'class', icon: 'fas fa-cube', name: 'Class' },
          { id: 'api', icon: 'fas fa-plug', name: 'API' }
        ];
      case 'workflow':
        return [
          ...baseTools,
          { id: 'node', icon: 'fas fa-square', name: 'Node' },
          { id: 'connector', icon: 'fas fa-arrows-alt-h', name: 'Connector' },
          { id: 'conditional', icon: 'fas fa-random', name: 'Condition' }
        ];
      case 'visual':
        return [
          ...baseTools,
          { id: 'shape', icon: 'fas fa-shapes', name: 'Shape' },
          { id: 'text', icon: 'fas fa-font', name: 'Text' },
          { id: 'filter', icon: 'fas fa-filter', name: 'Filter' }
        ];
      default:
        return baseTools;
    }
  };
  
  const tools = getToolsForMode(mode);
  
  return (
    <div className="creative-toolkit">
      <div className="toolkit-items">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            className="toolkit-item"
            onClick={() => handleToolClick(tool.id)}
          >
            <i className={tool.icon}></i>
            <span className="toolkit-name">{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreativeToolkit;