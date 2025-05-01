// src/api/aiCodeGenerator.js
// This file enhances the OpenRouter API integration with reliable code generation capabilities

import { generateContentApi } from './openRouterApi';
import { v4 as uuidv4 } from 'uuid';
import { ensureFreeModelId } from '../utils/modelUtils';

/**
 * Enhanced code generation function that handles proper formatting and error recovery
 * @param {string} apiKey - The OpenRouter API key
 * @param {string} modelId - The model ID to use
 * @param {string} prompt - The coding prompt
 * @param {Object} codeContext - Additional code context like language, existing code, etc.
 * @returns {Promise<Object>} - Generated code and metadata
 */
export const generateCode = async (apiKey, modelId, prompt, codeContext = {}) => {
  if (!apiKey) throw new Error('API key is required');
  if (!modelId) throw new Error('Model ID is required');
  
  // Ensure we're using the free tier
  const safeModelId = ensureFreeModelId(modelId);
  
  // Create an enhanced prompt with better code generation instructions
  const { language = 'javascript', existingCode = '' } = codeContext;
  
  const enhancedPrompt = formatCodePrompt(prompt, language, existingCode);
  
  // Set specific system instructions for code generation
  const systemPrompt = `You are an expert ${language} developer. Provide clean, efficient, and well-documented code. 
  Only respond with code and brief explanations. Format your response properly.`;
  
  try {
    // Call the OpenRouter API with the enhanced prompt
    const result = await generateContentApi(apiKey, safeModelId, enhancedPrompt, {
      systemPrompt,
      temperature: 0.3, // Lower temperature for more precise code generation
      maxTokens: 2048,  // Ensure enough tokens for complex code
    });
    
    // Process the response to extract just the code sections
    const processedCode = extractCodeFromResponse(result.content, language);
    
    return {
      id: uuidv4(),
      code: processedCode,
      language,
      timestamp: new Date().toISOString(),
      originalPrompt: prompt,
      model: safeModelId,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Code generation error:', error);
    throw new Error(error.message || 'Failed to generate code');
  }
};

/**
 * Format a code prompt to get better results from the AI
 */
function formatCodePrompt(prompt, language, existingCode) {
  let formattedPrompt = prompt;
  
  // Add language context if not already in the prompt
  if (!prompt.toLowerCase().includes(language.toLowerCase())) {
    formattedPrompt = `${language}: ${formattedPrompt}`;
  }
  
  // Add existing code context if provided
  if (existingCode && existingCode.trim()) {
    formattedPrompt += `\n\nHere's my current code that needs to be improved or extended:\n\`\`\`${language}\n${existingCode}\n\`\`\``;
  }
  
  // Add specific instructions for better code generation
  formattedPrompt += `\n\nPlease provide only the code solution without additional text. Ensure the code is complete, well-structured, and includes helpful comments.`;
  
  return formattedPrompt;
}

/**
 * Extract code blocks from the AI's response
 */
function extractCodeFromResponse(response, language) {
  if (!response) return '';
  
  // Check if the response already contains code blocks
  const codeBlockRegex = new RegExp('```(?:' + language + ')?\\n([\\s\\S]+?)\\n```', 'g');
  const matches = [...response.matchAll(codeBlockRegex)];
  
  if (matches.length > 0) {
    // Extract all code blocks and join them
    return matches.map(match => match[1].trim()).join('\n\n');
  }
  
  // If no code blocks found, return the whole response or try to clean it
  return response.replace(/^[^a-zA-Z0-9]*/, '').trim();
}