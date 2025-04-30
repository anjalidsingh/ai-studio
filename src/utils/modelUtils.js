/**
 * Utility functions for working with AI models
 */

/**
 * Ensure that a model ID has the ':free' suffix to use the free tier
 * @param {string} modelId - The model ID to check
 * @returns {string} - Model ID with :free suffix
 */
export function ensureFreeModelId(modelId) {
    if (!modelId) return null;
    
    // If modelId already has :free or some other suffix, don't modify it
    if (modelId.includes(':')) return modelId;
    
    // Otherwise, append :free
    return `${modelId}:free`;
  }
  
  /**
   * Select the best model for a given task based on message content
   * @param {string} message - User message content
   * @param {boolean} hasImage - Whether the message includes an image
   * @param {Object} modelSpecializations - Object mapping task types to model arrays
   * @returns {string} - The selected model ID
   */
  export function selectBestModel(message, hasImage, modelSpecializations) {
    if (!modelSpecializations) {
      throw new Error('Model specializations must be provided');
    }
    
    let selectedModel;
    
    if (hasImage) {
      selectedModel = modelSpecializations.vision[0]; // Best vision model
    } else {
      const lowerMessage = message.toLowerCase();
      
      // Check for coding related content
      if (lowerMessage.includes('code') || 
          lowerMessage.includes('program') || 
          lowerMessage.includes('function') || 
          lowerMessage.includes('javascript') ||
          lowerMessage.includes('python') ||
          lowerMessage.includes('java') ||
          lowerMessage.includes('c++') ||
          lowerMessage.includes('html') ||
          lowerMessage.includes('css')) {
        selectedModel = modelSpecializations.coding[0];
      }
      
      // Check for creative tasks
      else if (lowerMessage.includes('story') || 
          lowerMessage.includes('poem') || 
          lowerMessage.includes('creative') || 
          lowerMessage.includes('imagine') ||
          lowerMessage.includes('fiction') ||
          lowerMessage.includes('write a') ||
          lowerMessage.includes('generate a')) {
        selectedModel = modelSpecializations.creative[0];
      }
      
      // Check for reasoning/math tasks
      else if (lowerMessage.includes('explain') || 
          lowerMessage.includes('reason') || 
          lowerMessage.includes('why') || 
          lowerMessage.includes('how') ||
          lowerMessage.includes('calculate') ||
          lowerMessage.includes('solve') ||
          lowerMessage.includes('math')) {
        selectedModel = modelSpecializations.reasoning[0];
      }
      
      // Check for science content
      else if (lowerMessage.includes('science') || 
          lowerMessage.includes('chemistry') || 
          lowerMessage.includes('biology') || 
          lowerMessage.includes('physics') ||
          lowerMessage.includes('molecule') ||
          lowerMessage.includes('compound') ||
          lowerMessage.includes('reaction')) {
        selectedModel = modelSpecializations.science[0];
      }
      
      // Default to general model
      else {
        selectedModel = modelSpecializations.general[0];
      }
    }
    
    // Ensure the selected model has the :free suffix
    return ensureFreeModelId(selectedModel);
  }
  
  /**
   * Format a model name for display (removes :free suffix)
   * @param {string} modelId - The model ID
   * @returns {string} - Formatted model name
   */
  export function formatModelName(modelId) {
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