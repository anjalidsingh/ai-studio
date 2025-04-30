import React from 'react';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { toggleFavorite, deleteProject } from '../../redux/slices/projectsSlice';
import { showConfirmDialog } from '../../redux/slices/uiSlice';
import './ProjectCard.css';

const ProjectCard = ({ project, onClick }) => {
  const dispatch = useDispatch();
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Get icon based on project type
  const getProjectIcon = () => {
    switch (project.type) {
      case 'code':
        return 'fas fa-code';
      case 'workflow':
        return 'fas fa-sitemap';
      case 'visual':
        return 'fas fa-chart-bar';
      case 'document':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-file';
    }
  };
  
  // Get color based on project type
  const getProjectColor = () => {
    switch (project.type) {
      case 'code':
        return '#6366f1'; // indigo
      case 'workflow':
        return '#8b5cf6'; // purple
      case 'visual':
        return '#ec4899'; // pink
      case 'document':
        return '#14b8a6'; // teal
      default:
        return '#6366f1'; // indigo default
    }
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (e) => {
    e.stopPropagation(); // Prevent card click
    dispatch(toggleFavorite(project.id));
  };
  
  // Handle delete project
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click
    
    dispatch(showConfirmDialog({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        dispatch(deleteProject(project.id));
      }
    }));
  };
  
  return (
    <div className="project-card" onClick={onClick}>
      <div 
        className="project-thumbnail" 
        style={{ backgroundColor: getProjectColor() }}
      >
        <i className={getProjectIcon()}></i>
      </div>
      
      <div className="project-info">
        <div className="project-title-row">
          <div className="project-title">{project.title || 'Untitled Project'}</div>
          <button 
            className={`favorite-button ${project.favorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <i className={project.favorite ? 'fas fa-star' : 'far fa-star'}></i>
          </button>
        </div>
        
        <div className="project-meta">
          <span>{formatDate(project.updatedAt || project.createdAt)}</span>
          <button 
            className="project-delete-btn"
            onClick={handleDelete}
            aria-label="Delete project"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;