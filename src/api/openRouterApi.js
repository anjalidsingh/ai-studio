import axios from 'axios';

const BASE_URL = 'https://openrouter.ai/api/v1';

// Helper to create headers with API key
const createHeaders = (apiKey) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': window.location.href,
  'X-Title': 'AI Studio'
});

/**
 * Fetch available models from OpenRouter
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<Array>} - List of available models
 */
export const fetchModelsApi = async (apiKey) => {
  try {
    const response = await axios.get(`${BASE_URL}/models`, {
      headers: createHeaders(apiKey)
    });
    
    // Format the models data for easier consumption
    return response.data.data.map(model => ({
      id: ensureFreeModel(model.id),
      name: model.name || formatModelName(model.id),
      description: model.description || '',
      contextLength: model.context_length || 4096,
      pricing: model.pricing || {},
      provider: model.provider || extractProvider(model.id),
      capabilities: deriveCapabilities(model)
    }));
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch models');
  }
};

/**
 * Generate content using OpenRouter API
 * @param {string} apiKey - OpenRouter API key
 * @param {string} modelId - Model ID to use
 * @param {string} prompt - Text prompt for generation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Generated content and metadata
 */
export const generateContentApi = async (apiKey, modelId, prompt, options = {}) => {
  try {
    const {
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 1024,
      stream = false,
      onUpdate = null,
      imageData = null
    } = options;
    
    // Ensure the model is using the free tier
    const freeModelId = ensureFreeModel(modelId);
    
    // Prepare the messages
    let messages = [
      { role: "system", content: systemPrompt }
    ];

    // Check if image is included and add it to message content
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }
    
    // Prepare the request body
    const requestBody = {
      model: freeModelId,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    };
    
    // Handle streaming if requested
    if (stream && typeof onUpdate === 'function') {
      const response = await axios.post(`${BASE_URL}/chat/completions`, requestBody, {
        headers: createHeaders(apiKey),
        responseType: 'stream'
      });
      
      let fullResponse = '';
      let responseMetadata = null;
      
      // Process the stream
      const processStream = (chunk) => {
        // Parse the chunk data
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              // Stream completed
              onUpdate(null, { done: true, content: fullResponse, metadata: responseMetadata });
              return;
            }
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.choices && parsedData.choices[0]) {
                const content = parsedData.choices[0].delta.content || '';
                fullResponse += content;
                
                // Collect metadata from the completion
                if (!responseMetadata && parsedData.model) {
                  responseMetadata = {
                    model: parsedData.model,
                    created: parsedData.created,
                    usage: parsedData.usage
                  };
                }
                
                // Send the update
                onUpdate(content, { done: false, content: fullResponse, metadata: responseMetadata });
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      };
      
      // Set up the stream
      response.data.on('data', processStream);
      response.data.on('end', () => {
        // Ensure we mark as done even if no [DONE] marker received
        onUpdate(null, { done: true, content: fullResponse, metadata: responseMetadata });
      });
      
      // Return a promise that resolves when streaming ends
      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve({
            content: fullResponse,
            metadata: responseMetadata
          });
        });
        
        response.data.on('error', (err) => {
          reject(err);
        });
      });
    } else {
      // Non-streaming request
      const response = await axios.post(`${BASE_URL}/chat/completions`, requestBody, {
        headers: createHeaders(apiKey)
      });
      
      return {
        content: response.data.choices[0].message.content,
        metadata: {
          model: response.data.model,
          created: response.data.created,
          usage: response.data.usage
        }
      };
    }
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to generate content');
  }
};

/**
 * Ensure the model ID has the ':free' suffix
 * @param {string} modelId - The model ID to check
 * @returns {string} - Model ID with :free suffix
 */
function ensureFreeModel(modelId) {
  if (!modelId) return modelId;
  
  // If modelId already has :free or some other suffix, don't modify it
  if (modelId.includes(':')) return modelId;
  
  // Otherwise, append :free
  return `${modelId}:free`;
}

/**
 * Format a model ID into a readable name
 * @param {string} modelId - The model ID from the API
 * @returns {string} - Formatted name
 */
function formatModelName(modelId) {
  try {
    // Remove the :free suffix if present for display
    const idWithoutSuffix = modelId.split(':')[0];
    
    // Extract the model name from the ID (e.g., "meta/llama-3-8b-instruct" -> "Llama 3 8B Instruct")
    const parts = idWithoutSuffix.split('/');
    const modelPart = parts[parts.length - 1];
    
    // Clean up the model name
    return modelPart
      .replace(/[-_]/g, ' ')
      .replace(/(\d+)b/i, '$1B')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (e) {
    return modelId;
  }
}

/**
 * Extract provider name from model ID
 * @param {string} modelId - The model ID from the API
 * @returns {string} - Provider name
 */
function extractProvider(modelId) {
  try {
    return modelId.split('/')[0];
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Derive model capabilities based on model information
 * @param {Object} model - The model object from the API
 * @returns {Object} - Capabilities of the model
 */
function deriveCapabilities(model) {
  const capabilities = {
    text: true,
    vision: false,
    code: false,
    reasoning: false,
    creativity: false,
    knowledge: false
  };
  
  // Check for vision capabilities (models with vision in the name or description)
  if (
    model.id.includes('vision') || 
    model.id.includes('vl') || 
    model.id.includes('visual') ||
    (model.description && (
      model.description.toLowerCase().includes('vision') || 
      model.description.toLowerCase().includes('image')
    ))
  ) {
    capabilities.vision = true;
  }
  
  // Check for coding capabilities
  if (
    model.id.includes('code') || 
    model.id.includes('coder') ||
    (model.description && (
      model.description.toLowerCase().includes('code') || 
      model.description.toLowerCase().includes('programming')
    ))
  ) {
    capabilities.code = true;
  }
  
  // Check for reasoning capabilities
  if (
    model.id.includes('reasoning') || 
    model.id.includes('instruct') ||
    (model.description && (
      model.description.toLowerCase().includes('reasoning') || 
      model.description.toLowerCase().includes('logic')
    ))
  ) {
    capabilities.reasoning = true;
  }
  
  return capabilities;
}

export default {
  fetchModelsApi,
  generateContentApi
};