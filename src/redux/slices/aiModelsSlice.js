import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchModelsApi, generateContentApi } from '../../api/openRouterApi';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  models: [],
  selectedModel: null,
  loadingModels: false,
  modelError: null,
  
  generatingContent: false,
  generatedContent: null,
  generationError: null,
  
  responseHistory: [],
  
  apiKey: null,
  apiKeyVerified: false
};

// Helper to ensure free model
const ensureFreeModel = (modelId) => {
  if (!modelId) return null;
  
  // If modelId already has :free or some other suffix, don't modify it
  if (modelId.includes(':')) return modelId;
  
  // Otherwise, append :free
  return `${modelId}:free`;
};

// Async thunks
export const fetchModels = createAsyncThunk(
  'aiModels/fetchModels',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { apiKey } = getState().aiModels;
      if (!apiKey) return rejectWithValue('API key is required');
      
      const models = await fetchModelsApi(apiKey);
      return models;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generateContent = createAsyncThunk(
  'aiModels/generateContent',
  async ({ prompt, model, options = {} }, { getState, rejectWithValue }) => {
    try {
      const { apiKey } = getState().aiModels;
      if (!apiKey) return rejectWithValue('API key is required');
      
      let selectedModel = model || getState().aiModels.selectedModel;
      if (!selectedModel) return rejectWithValue('No model selected');
      
      // Ensure we're using the free tier
      selectedModel = ensureFreeModel(selectedModel);
      
      const result = await generateContentApi(apiKey, selectedModel, prompt, options);
      
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        prompt,
        model: selectedModel,
        result,
        options
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const aiModelsSlice = createSlice({
  name: 'aiModels',
  initialState,
  reducers: {
    setApiKey: (state, action) => {
      state.apiKey = action.payload;
      // Reset verification status when key changes
      state.apiKeyVerified = false;
    },
    
    setApiKeyVerified: (state, action) => {
      state.apiKeyVerified = action.payload;
    },
    
    selectModel: (state, action) => {
      // Ensure we always store with :free suffix
      state.selectedModel = ensureFreeModel(action.payload);
    },
    
    clearGeneratedContent: (state) => {
      state.generatedContent = null;
    },
    
    addResponseToHistory: (state, action) => {
      state.responseHistory.unshift(action.payload);
      
      // Limit history size
      if (state.responseHistory.length > 50) {
        state.responseHistory.pop();
      }
    },
    
    clearResponseHistory: (state) => {
      state.responseHistory = [];
    },
    
    deleteResponseFromHistory: (state, action) => {
      const responseId = action.payload;
      state.responseHistory = state.responseHistory.filter(
        response => response.id !== responseId
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch models
      .addCase(fetchModels.pending, (state) => {
        state.loadingModels = true;
        state.modelError = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loadingModels = false;
        state.models = action.payload;
        state.apiKeyVerified = true;
        
        // If we don't have a selected model yet and we got models back,
        // select the first general-purpose one
        if (!state.selectedModel && action.payload.length > 0) {
          // Try to find a good default model
          const defaultModel = action.payload.find(
            model => model.id.includes('gpt') || model.id.includes('claude') || model.id.includes('llama')
          ) || action.payload[0];
          
          state.selectedModel = defaultModel.id;
        }
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loadingModels = false;
        state.modelError = action.payload || 'Failed to fetch models';
        state.apiKeyVerified = false;
      })
      
      // Generate content
      .addCase(generateContent.pending, (state) => {
        state.generatingContent = true;
        state.generationError = null;
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.generatingContent = false;
        state.generatedContent = action.payload;
        state.responseHistory.unshift(action.payload);
        
        // Limit history size
        if (state.responseHistory.length > 50) {
          state.responseHistory.pop();
        }
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.generatingContent = false;
        state.generationError = action.payload || 'Content generation failed';
      });
  }
});

export const {
  setApiKey,
  setApiKeyVerified,
  selectModel,
  clearGeneratedContent,
  addResponseToHistory,
  clearResponseHistory,
  deleteResponseFromHistory
} = aiModelsSlice.actions;

export default aiModelsSlice.reducer;