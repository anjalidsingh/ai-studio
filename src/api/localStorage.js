import localforage from 'localforage';

// Initialize localforage instances for different storage needs
const projectsStore = localforage.createInstance({
  name: 'ai-studio',
  storeName: 'projects'
});

const userSettingsStore = localforage.createInstance({
  name: 'ai-studio',
  storeName: 'user-settings'
});

const apiKeysStore = localforage.createInstance({
  name: 'ai-studio',
  storeName: 'api-keys'
});

const assetsStore = localforage.createInstance({
  name: 'ai-studio',
  storeName: 'assets'
});

/**
 * Save a project to local storage
 * @param {Object} project - Project object to save
 * @returns {Promise<Object>} - Saved project
 */
export const saveProject = async (project) => {
  try {
    if (!project || !project.id) {
      throw new Error('Invalid project data');
    }
    
    // Update the last modified timestamp
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };
    
    await projectsStore.setItem(project.id, updatedProject);
    return updatedProject;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

/**
 * Load all projects from local storage
 * @returns {Promise<Array>} - Array of projects
 */
export const loadProjects = async () => {
  try {
    const projects = [];
    
    await projectsStore.iterate((value) => {
      projects.push(value);
    });
    
    // Sort by update date (newest first)
    return projects.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

/**
 * Load a specific project by ID
 * @param {string} projectId - Project ID to load
 * @returns {Promise<Object|null>} - Project object or null if not found
 */
export const loadProject = async (projectId) => {
  try {
    return await projectsStore.getItem(projectId);
  } catch (error) {
    console.error(`Error loading project ${projectId}:`, error);
    return null;
  }
};

/**
 * Delete a project from local storage
 * @param {string} projectId - Project ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteProject = async (projectId) => {
  try {
    await projectsStore.removeItem(projectId);
    return true;
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    return false;
  }
};

/**
 * Save user settings to local storage
 * @param {Object} settings - User settings object
 * @returns {Promise<Object>} - Saved settings
 */
export const saveUserSettings = async (settings) => {
  try {
    await userSettingsStore.setItem('userSettings', settings);
    return settings;
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
};

/**
 * Load user settings from local storage
 * @returns {Promise<Object>} - User settings object
 */
export const loadUserSettings = async () => {
  try {
    const settings = await userSettingsStore.getItem('userSettings');
    return settings || {};
  } catch (error) {
    console.error('Error loading user settings:', error);
    return {};
  }
};

/**
 * Save API key to local storage
 * @param {string} service - Service name (e.g., 'openrouter')
 * @param {string} apiKey - API key to save
 * @returns {Promise<void>}
 */
export const saveApiKey = async (service, apiKey) => {
  try {
    await apiKeysStore.setItem(service, apiKey);
  } catch (error) {
    console.error(`Error saving ${service} API key:`, error);
    throw error;
  }
};

/**
 * Load API key from local storage
 * @param {string} service - Service name (e.g., 'openrouter')
 * @returns {Promise<string|null>} - API key or null if not found
 */
export const loadApiKey = async (service) => {
  try {
    return await apiKeysStore.getItem(service);
  } catch (error) {
    console.error(`Error loading ${service} API key:`, error);
    return null;
  }
};

/**
 * Delete API key from local storage
 * @param {string} service - Service name (e.g., 'openrouter')
 * @returns {Promise<boolean>} - Success status
 */
export const deleteApiKey = async (service) => {
  try {
    await apiKeysStore.removeItem(service);
    return true;
  } catch (error) {
    console.error(`Error deleting ${service} API key:`, error);
    return false;
  }
};

/**
 * Save an asset to local storage
 * @param {string} assetId - Unique asset ID
 * @param {Object} asset - Asset object with metadata and content
 * @returns {Promise<Object>} - Saved asset
 */
export const saveAsset = async (assetId, asset) => {
  try {
    if (!assetId || !asset) {
      throw new Error('Invalid asset data');
    }
    
    // Add timestamp if not present
    const assetWithTimestamp = {
      ...asset,
      updatedAt: asset.updatedAt || new Date().toISOString()
    };
    
    await assetsStore.setItem(assetId, assetWithTimestamp);
    return assetWithTimestamp;
  } catch (error) {
    console.error('Error saving asset:', error);
    throw error;
  }
};

/**
 * Load an asset from local storage
 * @param {string} assetId - Asset ID to load
 * @returns {Promise<Object|null>} - Asset object or null if not found
 */
export const loadAsset = async (assetId) => {
  try {
    return await assetsStore.getItem(assetId);
  } catch (error) {
    console.error(`Error loading asset ${assetId}:`, error);
    return null;
  }
};

/**
 * Load all assets from local storage
 * @returns {Promise<Array>} - Array of assets
 */
export const loadAllAssets = async () => {
  try {
    const assets = [];
    
    await assetsStore.iterate((value, key) => {
      assets.push({ id: key, ...value });
    });
    
    return assets;
  } catch (error) {
    console.error('Error loading assets:', error);
    return [];
  }
};

/**
 * Delete an asset from local storage
 * @param {string} assetId - Asset ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteAsset = async (assetId) => {
  try {
    await assetsStore.removeItem(assetId);
    return true;
  } catch (error) {
    console.error(`Error deleting asset ${assetId}:`, error);
    return false;
  }
};

/**
 * Clear all stored data (dangerous - use with caution)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllData = async () => {
  try {
    await projectsStore.clear();
    await userSettingsStore.clear();
    await assetsStore.clear();
    // Note: We don't clear API keys by default
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};