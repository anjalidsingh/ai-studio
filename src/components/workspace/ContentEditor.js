import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { 
  addContentBlock, 
  updateContentBlock, 
  deleteContentBlock,
  updateCurrentProject
} from '../../redux/slices/projectsSlice';
import ContentBlock from '../editor/ContentBlock';
import GenerateCard from '../editor/GenerateCard';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { showAIResponse } from '../../redux/slices/uiSlice';
import './ContentEditor.css';

const ContentEditor = () => {
  const dispatch = useDispatch();
  
  // Get current project from Redux
  const currentProject = useSelector(state => state.projects.currentProject);
  const blocks = currentProject?.content?.blocks || [];
  
  // Local state for drag and drop
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  
  // Handle autosave
  useEffect(() => {
    // Setup autosave timer
    const autosaveInterval = setInterval(() => {
      // Only save if there are changes
      if (currentProject && currentProject.content?.blocks?.length > 0) {
        // In a real implementation, you might want to check if there are actual changes
        // before dispatching the save action
        // dispatch(saveCurrentProject());
      }
    }, 30000); // Autosave every 30 seconds
    
    return () => clearInterval(autosaveInterval);
  }, [dispatch, currentProject]);
  
  // Add a new content block
  const handleAddBlock = (type = 'text', content = '', position = -1) => {
    if (!currentProject) return;
    
    const newBlock = {
      id: uuidv4(),
      type,
      content: content || getDefaultContentForType(type),
      createdAt: new Date().toISOString()
    };
    
    // If the content is empty and blocks array doesn't exist yet,
    // initialize the project content structure
    if (!currentProject.content || !Array.isArray(currentProject.content.blocks)) {
      dispatch(updateCurrentProject({
        content: {
          blocks: [newBlock],
          version: '1.0'
        }
      }));
      return;
    }
    
    // Otherwise, add the block using the dedicated action
    dispatch(addContentBlock({
      type: newBlock.type,
      content: newBlock.content
    }));
  };
  
  // Update a content block
  const handleUpdateBlock = (blockId, content) => {
    dispatch(updateContentBlock({ blockId, content }));
  };
  
  // Delete a content block
  const handleDeleteBlock = (blockId) => {
    dispatch(deleteContentBlock(blockId));
  };
  
  // Request AI suggestions for content
  const handleRequestSuggestions = (context = '') => {
    // Open the prompt area with the context pre-filled
    dispatch(togglePromptArea());
    
    // In a real implementation, you'd set the prompt area with context
    // For simplicity, we'll just show a mock AI response
    setTimeout(() => {
      dispatch(showAIResponse({
        title: 'Content Suggestions',
        content: 'Based on your current document, here are some suggestions for expansion:\n\n1. Add a section on market analysis\n2. Include data visualizations for key metrics\n3. Develop a case study example\n4. Add implementation timeline'
      }));
    }, 1000);
  };
  
  // Get default content based on block type
  const getDefaultContentForType = (type) => {
    switch (type) {
      case 'heading':
        return 'New Heading';
      case 'subheading':
        return 'New Subheading';
      case 'text':
        return 'Start typing or use AI to generate content...';
      case 'list':
        return '- Item 1\n- Item 2\n- Item 3';
      case 'code':
        return '// Your code here';
      case 'image':
        return '';
      default:
        return '';
    }
  };
  
  // Handle drag and drop
  const handleDragStart = (e, blockId) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    // For better UX, set a ghost image
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('drag-ghost');
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };
  
  const handleDragOver = (e, blockId) => {
    e.preventDefault();
    if (blockId !== dropTargetId) {
      setDropTargetId(blockId);
    }
  };
  
  const handleDragEnd = () => {
    if (draggedBlockId && dropTargetId && draggedBlockId !== dropTargetId) {
      // Reorder blocks logic would go here
      // For simplicity, we're not implementing the full reordering
      console.log(`Move block ${draggedBlockId} to position near ${dropTargetId}`);
      
      // In a real implementation, you'd dispatch an action to reorder blocks
    }
    
    // Reset drag state
    setDraggedBlockId(null);
    setDropTargetId(null);
  };
  
  // Get block styles based on drag state
  const getBlockStyles = (blockId) => {
    if (blockId === draggedBlockId) {
      return 'content-block-container dragging';
    }
    if (blockId === dropTargetId) {
      return 'content-block-container drop-target';
    }
    return 'content-block-container';
  };
  
  return (
    <div className="content-editor">
      <div className="canvas">
        {blocks.length > 0 ? (
          <div className="content-blocks">
            {blocks.map((block, index) => (
              <div 
                key={block.id}
                className={getBlockStyles(block.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragEnd={handleDragEnd}
              >
                <ContentBlock
                  block={block}
                  onUpdate={(content) => handleUpdateBlock(block.id, content)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
              </div>
            ))}
            
            <GenerateCard 
              onClick={() => handleRequestSuggestions()}
              title="Generate Next Section"
              description="Let AI suggest the next part of your document based on current content"
            />
          </div>
        ) : (
          <div className="empty-content">
            <div className="empty-content-message">
              <div className="empty-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>Start Creating</h3>
              <p>Add content blocks or let AI help you get started</p>
              <div className="empty-actions">
                <button className="btn" onClick={() => handleAddBlock('heading')}>
                  <i className="fas fa-heading"></i> Add Heading
                </button>
                <button className="btn" onClick={() => handleAddBlock('text')}>
                  <i className="fas fa-align-left"></i> Add Text
                </button>
                <button className="btn accent" onClick={() => handleRequestSuggestions()}>
                  <i className="fas fa-robot"></i> Ask AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="floating-actions">
        <button className="add-block-button" onClick={() => handleAddBlock()}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </div>
  );
};

export default ContentEditor;