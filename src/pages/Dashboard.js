import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, createNewProject } from '../redux/slices/projectsSlice';
import ProjectCard from '../components/projects/ProjectCard';
import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get projects from Redux
  const projects = useSelector(state => state.projects.projects);
  const projectsStatus = useSelector(state => state.projects.status);
  const projectsError = useSelector(state => state.projects.error);
  
  // Local state for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    if (projectsStatus === 'idle') {
      dispatch(fetchProjects());
    }
  }, [projectsStatus, dispatch]);
  
  // Update filtered projects when projects, search query or filter changes
  useEffect(() => {
    let filtered = [...projects];
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(project => project.type === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(query) || 
        (project.description && project.description.toLowerCase().includes(query))
      );
    }
    
    // Sort filtered projects (favorites first, then by date)
    filtered.sort((a, b) => {
      // First by favorite status
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      
      // Then by update date (newest first)
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    
    setFilteredProjects(filtered);
  }, [projects, searchQuery, activeFilter]);
  
  // Create a new project with a specific type
  const handleCreateProject = (type = 'content') => {
    dispatch(createNewProject({
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Project`
    })).then((result) => {
      if (result.payload) {
        navigate(`/studio/${result.payload.id}`);
      }
    });
  };
  
  // Open an existing project
  const handleOpenProject = (project) => {
    navigate(`/studio/${project.id}`);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Project type options for filter tabs
  const projectTypes = [
    { id: 'all', label: 'All Projects', icon: 'fas fa-th-large' },
    { id: 'content', label: 'Content', icon: 'fas fa-file-alt' },
    { id: 'code', label: 'Code', icon: 'fas fa-code' },
    { id: 'workflow', label: 'Workflows', icon: 'fas fa-sitemap' },
    { id: 'visual', label: 'Visual', icon: 'fas fa-chart-bar' }
  ];
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Projects</h1>
        <button className="btn" onClick={() => handleCreateProject()}>
          <i className="fas fa-plus"></i> New Project
        </button>
      </div>
      
      <div className="dashboard-controls">
        <div className="project-filters">
          {projectTypes.map(type => (
            <button 
              key={type.id}
              className={`filter-btn ${activeFilter === type.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(type.id)}
            >
              <i className={type.icon}></i>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={handleClearSearch}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        {projectsStatus === 'loading' ? (
          <div className="loading-projects">
            <div className="spinner"></div>
            <p>Loading your projects...</p>
          </div>
        ) : projectsError ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{projectsError}</p>
            <button 
              className="btn"
              onClick={() => dispatch(fetchProjects())}
            >
              Try Again
            </button>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => handleOpenProject(project)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-projects">
            <div className="empty-state-icon">
              <i className="fas fa-folder-open"></i>
            </div>
            
            {searchQuery ? (
              <>
                <h2>No matching projects</h2>
                <p>Try a different search term or clear your filters</p>
                <button 
                  className="btn secondary"
                  onClick={handleClearSearch}
                >
                  Clear Search
                </button>
              </>
            ) : activeFilter !== 'all' ? (
              <>
                <h2>No {activeFilter} projects yet</h2>
                <p>Create your first {activeFilter} project to get started</p>
                <button 
                  className="btn"
                  onClick={() => handleCreateProject(activeFilter)}
                >
                  <i className="fas fa-plus"></i> New {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Project
                </button>
              </>
            ) : (
              <>
                <h2>No projects yet</h2>
                <p>Create your first project to get started</p>
                <div className="template-buttons">
                  <button 
                    className="btn"
                    onClick={() => handleCreateProject('content')}
                  >
                    <i className="fas fa-file-alt"></i> Content Project
                  </button>
                  <button 
                    className="btn"
                    onClick={() => handleCreateProject('code')}
                  >
                    <i className="fas fa-code"></i> Code Project
                  </button>
                  <button 
                    className="btn"
                    onClick={() => handleCreateProject('workflow')}
                  >
                    <i className="fas fa-sitemap"></i> Workflow Project
                  </button>
                  <button 
                    className="btn"
                    onClick={() => handleCreateProject('visual')}
                  >
                    <i className="fas fa-chart-bar"></i> Visual Project
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;