import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveUserSettings, loadUserSettings } from '../../api/localStorage';

const initialState = {
  isAuthenticated: false,
  profile: null,
  settings: {
    theme: 'light',
    autoSave: true,
    defaultProjectType: 'content',
    preferredModels: {},
    recentProjects: [],
    editorPreferences: {
      fontSize: 14,
      useSpaces: true,
      tabSize: 2,
      lineWrapping: true,
      highlightActiveLine: true
    }
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Async thunks
export const fetchUserSettings = createAsyncThunk(
  'user/fetchUserSettings',
  async () => {
    return await loadUserSettings();
  }
);

export const updateUserSettings = createAsyncThunk(
  'user/updateUserSettings',
  async (newSettings, { getState }) => {
    const { settings } = getState().user;
    const updatedSettings = { ...settings, ...newSettings };
    await saveUserSettings(updatedSettings);
    return updatedSettings;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    
    logout: (state) => {
      state.isAuthenticated = false;
      state.profile = null;
    },
    
    setTheme: (state, action) => {
      state.settings.theme = action.payload;
    },
    
    addRecentProject: (state, action) => {
      const projectId = action.payload;
      
      // Remove if it exists already
      state.settings.recentProjects = state.settings.recentProjects.filter(
        id => id !== projectId
      );
      
      // Add to front of array
      state.settings.recentProjects.unshift(projectId);
      
      // Limit to 10 recent projects
      if (state.settings.recentProjects.length > 10) {
        state.settings.recentProjects.pop();
      }
    },
    
    setPreferredModel: (state, action) => {
      const { taskType, modelId } = action.payload;
      state.settings.preferredModels[taskType] = modelId;
    },
    
    updateEditorPreferences: (state, action) => {
      state.settings.editorPreferences = {
        ...state.settings.editorPreferences,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user settings
      .addCase(fetchUserSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Merge with defaults for any missing settings
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Update user settings
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  }
});

export const {
  setAuthenticated,
  setProfile,
  logout,
  setTheme,
  addRecentProject,
  setPreferredModel,
  updateEditorPreferences
} = userSlice.actions;

export default userSlice.reducer;