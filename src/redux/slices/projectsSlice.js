import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { saveProject, loadProjects, deleteProject as deleteStoredProject } from '../../api/localStorage';

const initialState = {
  projects: [],
  currentProject: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async () => {
    return await loadProjects();
  }
);

export const saveCurrentProject = createAsyncThunk(
  'projects/saveCurrentProject',
  async (_, { getState }) => {
    const { currentProject } = getState().projects;
    if (!currentProject) return null;
    await saveProject(currentProject);
    return currentProject;
  }
);

export const createNewProject = createAsyncThunk(
  'projects/createNewProject',
  async (projectData) => {
    const newProject = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: projectData.title || 'Untitled Project',
      description: projectData.description || '',
      type: projectData.type || 'content',
      favorite: false,
      content: projectData.content || {
        blocks: [],
        version: '1.0'
      }
    };
    
    await saveProject(newProject);
    return newProject;
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId) => {
    await deleteStoredProject(projectId);
    return projectId;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    updateCurrentProject: (state, action) => {
      if (state.currentProject) {
        state.currentProject = {
          ...state.currentProject,
          ...action.payload,
          updatedAt: new Date().toISOString()
        };
      }
    },
    toggleFavorite: (state, action) => {
      const projectId = action.payload;
      const project = state.projects.find(p => p.id === projectId);
      if (project) {
        project.favorite = !project.favorite;
      }
      if (state.currentProject && state.currentProject.id === projectId) {
        state.currentProject.favorite = !state.currentProject.favorite;
      }
    },
    addContentBlock: (state, action) => {
      if (state.currentProject) {
        if (!state.currentProject.content) {
          state.currentProject.content = { blocks: [], version: '1.0' };
        }
        
        const newBlock = {
          id: uuidv4(),
          type: action.payload.type,
          content: action.payload.content,
          createdAt: new Date().toISOString()
        };
        
        state.currentProject.content.blocks.push(newBlock);
        state.currentProject.updatedAt = new Date().toISOString();
      }
    },
    updateContentBlock: (state, action) => {
      if (state.currentProject && state.currentProject.content) {
        const { blockId, content } = action.payload;
        const blockIndex = state.currentProject.content.blocks.findIndex(
          block => block.id === blockId
        );
        
        if (blockIndex !== -1) {
          state.currentProject.content.blocks[blockIndex].content = content;
          state.currentProject.content.blocks[blockIndex].updatedAt = new Date().toISOString();
          state.currentProject.updatedAt = new Date().toISOString();
        }
      }
    },
    deleteContentBlock: (state, action) => {
      if (state.currentProject && state.currentProject.content) {
        const blockId = action.payload;
        state.currentProject.content.blocks = state.currentProject.content.blocks.filter(
          block => block.id !== blockId
        );
        state.currentProject.updatedAt = new Date().toISOString();
      }
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Save current project
      .addCase(saveCurrentProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        } else {
          state.projects.push(action.payload);
        }
      })
      
      // Create new project
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
        state.currentProject = action.payload;
      })
      
      // Delete project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject && state.currentProject.id === action.payload) {
          state.currentProject = null;
        }
      });
  }
});

export const { 
  setCurrentProject, 
  updateCurrentProject, 
  toggleFavorite, 
  addContentBlock, 
  updateContentBlock, 
  deleteContentBlock,
  clearCurrentProject
} = projectsSlice.actions;

export default projectsSlice.reducer;