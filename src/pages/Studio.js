import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LeftSidebar from '../components/layout/LeftSidebar';
import ToolsPanel from '../components/layout/ToolsPanel';
import ContentEditor from '../components/workspace/ContentEditor';
import WorkflowDesigner from '../components/workspace/WorkflowDesigner';
import CodeStudio from '../components/workspace/CodeStudio';
import VisualLab from '../components/workspace/VisualLab';
import ActionMenu from '../components/layout/ActionMenu';
import PromptArea from '../components/ai/PromptArea';
import AIResponseCard from '../components/ai/AIResponseCard';
import { setCurrentProject } from '../redux/slices/projectsSlice';
import { loadProject } from '../api/localStorage';
import { setActiveMode } from '../redux/slices/workspaceSlice';
import { addRecentProject } from '../redux/slices/userSlice';
import { showNotification } from '../redux/slices/uiSlice';
import './Studio.css';

const Studio = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Local loading state
  const [loading, setLoading] = useState(true);
  
  // Get workspace state from Redux
  const activeMode = useSelector(state => state.workspace.activeMode);
  const leftSidebarOpen = useSelector(state => state.workspace.leftSidebarOpen);
  const toolsPanelOpen = useSelector(state => state.workspace.toolsPanelOpen);
  const promptAreaOpen = useSelector(state => state.workspace.promptAreaOpen);
  const aiResponse = useSelector(state => state.ui.aiResponse);
  
  // Load the project when component mounts or projectId changes
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const project = await loadProject(projectId);
        
        if (!project) {
          dispatch(showNotification({
            message: 'Project not found',
            type: 'error'
          }));
          navigate('/');
          return;
        }
        
        // Set the project in Redux state
        dispatch(setCurrentProject(project));
        
        // Set active mode based on project type
        if (project.type) {
          dispatch(setActiveMode(project.type));
        }
        
        // Add to recent projects
        dispatch(addRecentProject(projectId));
      } catch (error) {
        console.error('Error loading project:', error);
        dispatch(showNotification({
          message: 'Failed to load project',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, dispatch, navigate]);
  
  // Render the active workspace component based on mode
  const renderWorkspace = () => {
    switch (activeMode) {
      case 'content':
        return <ContentEditor />;
      case 'workflow':
        return <WorkflowDesigner />;
      case 'code':
        return <CodeStudio />;
      case 'visual':
        return <VisualLab />;
      default:
        return <ContentEditor />;
    }
  };
  
  if (loading) {
    return (
      <div className="studio-loading">
        <div className="spinner"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }
  
  return (
    <div className="studio-container">
      <div className="app-container">
        {leftSidebarOpen && <LeftSidebar />}
        
        <div className="main-workspace">
          <div className="workspace-tabs">
            <div 
              className={`tab ${activeMode === 'content' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveMode('content'))}
            >
              Content Editor
            </div>
            <div 
              className={`tab ${activeMode === 'workflow' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveMode('workflow'))}
            >
              Workflow Designer
            </div>
            <div 
              className={`tab ${activeMode === 'code' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveMode('code'))}
            >
              Code Studio
            </div>
            <div 
              className={`tab ${activeMode === 'visual' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveMode('visual'))}
            >
              Visual Lab
            </div>
          </div>
          
          <div className="workspace-content">
            <div className="canvas-area">
              {renderWorkspace()}
            </div>
            
            {toolsPanelOpen && <ToolsPanel />}
          </div>
        </div>
      </div>
      
      <ActionMenu />
      
      {promptAreaOpen && <PromptArea />}
      
      {aiResponse.open && <AIResponseCard />}
    </div>
  );
};

export default Studio;