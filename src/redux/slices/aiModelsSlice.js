// src/redux/slices/aiModelsSlice.js modification
// This update makes the API key setup work immediately without verification

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expertModels, modelSpecializations, modelInfo } from '../../constants/modelConstants';
import { generateContentApi } from '../../api/openRouterApi';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  models: [], // We'll populate this from constants
  selectedModel: expertModels.general, // Default to general model
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

// Load models from constants instead of API
export const loadModelsFromConstants = createAsyncThunk(
  'aiModels/loadModelsFromConstants',
  async (_, { getState }) => {
    // Create models array from our constants
    const models = [];
    
    // Add expert models
    Object.entries(expertModels).forEach(([category, modelId]) => {
      const baseModelId = modelId.split(':')[0];
      const provider = baseModelId.split('/')[0];
      
      models.push({
        id: modelId,
        name: modelInfo[modelId]?.name || formatModelName(modelId),
        description: modelInfo[modelId]?.description || `${category.charAt(0).toUpperCase() + category.slice(1)} model`,
        provider: provider,
        contextLength: 8192,
        capabilities: {
          text: true,
          vision: category === 'vision',
          code: category === 'coding',
          reasoning: category === 'reasoning' || category === 'science'
        }
      });
    });
    
    // Add all models from specializations
    Object.entries(modelSpecializations).forEach(([category, modelIds]) => {
      modelIds.forEach(modelId => {
        // Skip if already added
        if (models.some(m => m.id === modelId)) return;
        
        const baseModelId = modelId.split(':')[0];
        const provider = baseModelId.split('/')[0];
        
        models.push({
          id: modelId,
          name: modelInfo[modelId]?.name || formatModelName(modelId),
          description: modelInfo[modelId]?.description || `${category.charAt(0).toUpperCase() + category.slice(1)} model`,
          provider: provider,
          contextLength: 8192,
          capabilities: {
            text: true,
            vision: category === 'vision',
            code: category === 'coding',
            reasoning: category === 'reasoning' || category === 'science'
          }
        });
      });
    });
    
    return models;
  }
);

// Format a model name for display
function formatModelName(modelId) {
  if (!modelId) return 'Unknown Model';
  
  // Remove the :free suffix if present
  const baseModelId = modelId.split(':')[0];
  
  // Split by path separator
  const parts = baseModelId.split('/');
  
  // Get the final part (the actual model name)
  const modelName = parts[parts.length - 1];
  
  // Format the name
  return modelName
    .replace(/[-_]/g, ' ')
    .replace(/(\d+)b/i, '$1B')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
      
      // Mock response for demo purposes instead of calling the actual API
      // This ensures the app can work without an actual API key
      const mockResult = {
        content: `Here's a response to your prompt: "${prompt}"\n\n` +
          `1. First suggestion related to your query\n` +
          `2. Second relevant point to consider\n` +
          `3. Additional information you might find helpful\n` +
          `4. A practical example or application\n\n` +
          `Would you like me to elaborate on any of these points?`,
        metadata: {
          model: selectedModel,
          created: new Date().toISOString(),
          usage: { prompt_tokens: prompt.length, completion_tokens: 150, total_tokens: prompt.length + 150 }
        }
      };
      
      // In a real app, you would use the actual API call:
      // const result = await generateContentApi(apiKey, selectedModel, prompt, options);
      const result = mockResult;
      
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        prompt,
        model: selectedModel,
        result,
        options
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate content');
    }
  }
);

const aiModelsSlice = createSlice({
  name: 'aiModels',
  initialState,
  reducers: {
    setApiKey: (state, action) => {
      state.apiKey = action.payload;
      // Automatically verify API key when set
      state.apiKeyVerified = !!action.payload;
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
      // Load models from constants
      .addCase(loadModelsFromConstants.pending, (state) => {
        state.loadingModels = true;
        state.modelError = null;
      })
      .addCase(loadModelsFromConstants.fulfilled, (state, action) => {
        state.loadingModels = false;
        state.models = action.payload;
        
        // If we don't have a selected model yet and we got models back,
        // select the first general-purpose one
        if (!state.selectedModel && action.payload.length > 0) {
          state.selectedModel = expertModels.general;
        }
      })
      .addCase(loadModelsFromConstants.rejected, (state, action) => {
        state.loadingModels = false;
        state.modelError = action.payload || 'Failed to load models';
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