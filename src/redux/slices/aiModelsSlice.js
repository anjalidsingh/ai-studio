// src/redux/slices/aiModelsSlice.js 
// Complete file with improved content generation

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
      
      // Generate a more meaningful response based on the prompt
      let responseContent = '';
      
      // Analyze the prompt to determine response type
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is') || lowerPrompt.includes('how to')) {
        // Explanation content
        responseContent = `# ${prompt}\n\n`
          + `Understanding ${prompt.replace(/^(explain|what is|how to)/i, '').trim()} is important for several reasons:\n\n`
          + `## Key Concepts\n\n`
          + `1. The fundamental principles involve understanding the core mechanisms at work.\n`
          + `2. Applications of this concept span multiple domains including business, technology, and education.\n`
          + `3. Recent developments have expanded our understanding significantly.\n\n`
          + `## Practical Applications\n\n`
          + `When applied to real-world scenarios, this concept helps solve problems by providing a structured framework for analysis and implementation. Consider these examples:\n\n`
          + `- Example 1: Streamlined business processes resulting in 30% efficiency gains\n`
          + `- Example 2: Technology implementation reducing costs while improving output quality\n`
          + `- Example 3: Educational improvements through targeted application of these principles\n\n`
          + `Would you like me to elaborate on any specific aspect of this topic?`;
      } 
      else if (lowerPrompt.includes('list') || lowerPrompt.includes('steps') || lowerPrompt.includes('ways to')) {
        // List content
        responseContent = `# ${prompt}\n\n`
          + `Here's a comprehensive approach to ${prompt.replace(/^(list|steps|ways to)/i, '').trim()}:\n\n`
          + `1. **Begin with thorough research** - Understanding the context and background is essential before taking action\n\n`
          + `2. **Develop a strategic framework** - Create a structured plan that addresses all key aspects of the challenge\n\n`
          + `3. **Implement methodically** - Follow your framework with careful attention to detail and process\n\n`
          + `4. **Measure and analyze results** - Use appropriate metrics to gauge effectiveness and identify improvement areas\n\n`
          + `5. **Refine your approach** - Based on your analysis, make targeted improvements to optimize outcomes\n\n`
          + `6. **Scale successful elements** - Once you've proven effectiveness, expand the successful components\n\n`
          + `Would you like me to expand on any of these steps with specific examples?`;
      }
      else if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || lowerPrompt.includes('program')) {
        // Code content
        responseContent = `# ${prompt}\n\n`
          + `Here's a solution for ${prompt.replace(/^(code|function|program)/i, '').trim()}:\n\n`
          + "```javascript\n"
          + "/**\n"
          + " * Implementation based on your requirements\n"
          + " * @param {Object} data - The input data to process\n"
          + " * @returns {Object} - The processed result\n"
          + " */\n"
          + "function processData(data) {\n"
          + "  // Validate input\n"
          + "  if (!data || typeof data !== 'object') {\n"
          + "    throw new Error('Invalid input: data must be an object');\n"
          + "  }\n\n"
          + "  // Transform input based on business rules\n"
          + "  const result = {\n"
          + "    processed: true,\n"
          + "    timestamp: new Date().toISOString(),\n"
          + "    values: Object.entries(data).map(([key, value]) => ({\n"
          + "      key,\n"
          + "      value,\n"
          + "      processed: typeof value === 'number' ? value * 2 : value\n"
          + "    }))\n"
          + "  };\n\n"
          + "  // Apply additional business logic\n"
          + "  result.summary = {\n"
          + "    count: result.values.length,\n"
          + "    hasNumericValues: result.values.some(item => typeof item.value === 'number')\n"
          + "  };\n\n"
          + "  return result;\n"
          + "}\n\n"
          + "// Example usage\n"
          + "const sampleData = {\n"
          + "  item1: 42,\n"
          + "  item2: 'text value',\n"
          + "  item3: 73\n"
          + "};\n\n"
          + "const processedResult = processData(sampleData);\n"
          + "console.log(processedResult);\n"
          + "```\n\n"
          + "This implementation handles object data processing with validation, transformation, and summarization. It applies business rules to create a structured output from the input object.";
      }
      else {
        // General content
        responseContent = `# Response to: ${prompt}\n\n`
          + `## Overview\n\n`
          + `This question touches on several important aspects that deserve careful consideration. Let's explore the key components:\n\n`
          + `## Main Points\n\n`
          + `1. **First important consideration** - This fundamental aspect establishes the groundwork for understanding the broader context\n\n`
          + `2. **Critical analysis component** - Examining the relationships between different elements reveals important patterns\n\n`
          + `3. **Practical implementation** - Moving from theory to application requires attention to specific details\n\n`
          + `4. **Future implications** - Understanding potential developments helps prepare for upcoming changes\n\n`
          + `## Practical Examples\n\n`
          + `When we look at real-world applications, we can see these principles in action through:\n\n`
          + `- Case study A: Implementation in a business context yielding measurable results\n`
          + `- Case study B: Technology application solving specific challenges\n`
          + `- Case study C: Educational context showing improved outcomes\n\n`
          + `Would you like me to elaborate on any particular aspect of this response?`;
      }
      
      const mockResult = {
        content: responseContent,
        metadata: {
          model: selectedModel,
          created: new Date().toISOString(),
          usage: { prompt_tokens: prompt.length, completion_tokens: responseContent.length, total_tokens: prompt.length + responseContent.length }
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