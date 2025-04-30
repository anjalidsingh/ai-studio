import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleLeftSidebar } from '../../redux/slices/workspaceSlice';
import { fetchProjects, createNewProject, setCurrentProject } from '../../redux/slices/projectsSlice';
import ProjectCard from '../projects/ProjectCard';
import './LeftSidebar.css';

const LeftSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get sidebar state from Redux
  const isOpen = useSelector(state => state.workspace.leftSidebarOpen);
  const projects = useSelector(state => state.projects.projects);
  const projectsStatus = useSelector(state => state.projects.status);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    templates: true
  });

  // Load projects on mount
  useEffect(() => {
    if (projectsStatus === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, projectsStatus]);

  // Filter projects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(project => 
      project.title.toLowerCase().includes(query) || 
      (project.description && project.description.toLowerCase().includes(query))
    );
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle section expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Create a new project
  const handleCreateProject = (templateType) => {
    dispatch(createNewProject({ 
      type: templateType || 'content',
      title: `New ${templateType || 'Content'} Project` 
    })).then((result) => {
      if (result.payload) {
        // Navigate to the new project
        navigate(`/studio/${result.payload.id}`);
      }
    });
  };

  // Open an existing project
  const handleOpenProject = (project) => {
    dispatch(setCurrentProject(project));
    navigate(`/studio/${project.id}`);
  };

  return (
    <div className={`left-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className="sidebar-toggle"
        onClick={() => dispatch(toggleLeftSidebar())}
        aria-label="Toggle sidebar"
      >
        <i className={`fas fa-chevron-${isOpen ? 'left' : 'right'}`}></i>
      </button>

      <div className="sidebar-section">
        <div 
          className="sidebar-header"
          onClick={() => toggleSection('projects')}
        >
          <span>Project Explorer</span>
          <div className="sidebar-header-actions">
            <button 
              className="header-action-button"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateProject();
              }}
              aria-label="New project"
            >
              <i className="fas fa-plus"></i>
            </button>
            <i className={`fas fa-chevron-${expandedSections.projects ? 'down' : 'right'}`}></i>
          </div>
        </div>

        {expandedSections.projects && (
          <>
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
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            <div className="project-gallery">
              {projectsStatus === 'loading' ? (
                <div className="loading-projects">
                  <div className="spinner"></div>
                  <p>Loading projects...</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onClick={() => handleOpenProject(project)}
                  />
                ))
              ) : (
                <div className="empty-projects">
                  {searchQuery ? (
                    <p>No projects match your search</p>
                  ) : (
                    <>
                      <p>No projects yet</p>
                      <button 
                        className="btn sm"
                        onClick={() => handleCreateProject()}
                      >
                        <i className="fas fa-plus"></i> Create First Project
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="sidebar-section">
        <div 
          className="sidebar-header"
          onClick={() => toggleSection('templates')}
        >
          <span>Smart Templates</span>
          <i className={`fas fa-chevron-${expandedSections.templates ? 'down' : 'right'}`}></i>
        </div>

        {expandedSections.templates && (
          <div className="model-selector">
            <div 
              className="model-option"
              onClick={() => handleCreateProject('content')}
            >
              <div className="model-icon"><i className="fas fa-lightbulb"></i></div>
              <div className="model-details">
                <div className="model-name">Brainstorm Canvas</div>
                <div className="model-description">Ideation and concept mapping</div>
              </div>
            </div>

            <div 
              className="model-option"
              onClick={() => handleCreateProject('code')}
            >
              <div className="model-icon"><i className="fas fa-code"></i></div>
              <div className="model-details">
                <div className="model-name">Code Blueprint</div>
                <div className="model-description">Software architecture and logic flows</div>
              </div>
            </div>

            <div 
              className="model-option"
              onClick={() => handleCreateProject('visual')}
            >
              <div className="model-icon"><i className="fas fa-chart-line"></i></div>
              <div className="model-details">
                <div className="model-name">Data Insights</div>
                <div className="model-description">Analytics and visualization</div>
              </div>
            </div>

            <div 
              className="model-option"
              onClick={() => handleCreateProject('document')}
            >
              <div className="model-icon"><i className="fas fa-book"></i></div>
              <div className="model-details">
                <div className="model-name">Content Creator</div>
                <div className="model-description">Articles, scripts, and stories</div>
              </div>
            </div>

            <div 
              className="model-option"
              onClick={() => handleCreateProject('workflow')}
            >
              <div className="model-icon"><i className="fas fa-sitemap"></i></div>
              <div className="model-details">
                <div className="model-name">Workflow Designer</div>
                <div className="model-description">Process optimization</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;