import React, { useState, useEffect } from 'react';
import './ModelSelector.css';

const ModelSelector = ({ models, selectedModel, onSelect }) => {
  // Group models by provider
  const [groupedModels, setGroupedModels] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModels, setFilteredModels] = useState([]);
  
  // Group models when models array changes
  useEffect(() => {
    const groups = {};
    
    models.forEach(model => {
      const provider = model.provider || 'unknown';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });
    
    // Sort models within each group by name
    Object.keys(groups).forEach(provider => {
      groups[provider].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    setGroupedModels(groups);
    setFilteredModels(models);
  }, [models]);
  
  // Filter models when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = models.filter(model => 
      model.name.toLowerCase().includes(query) || 
      model.provider.toLowerCase().includes(query) ||
      (model.description && model.description.toLowerCase().includes(query))
    );
    
    setFilteredModels(filtered);
  }, [searchQuery, models]);
  
  // Get list of providers
  const providers = Object.keys(groupedModels).sort();
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Get icon based on model capabilities
  const getModelIcon = (model) => {
    if (model.capabilities?.vision) {
      return 'fas fa-eye';
    }
    if (model.capabilities?.code) {
      return 'fas fa-code';
    }
    if (model.capabilities?.reasoning) {
      return 'fas fa-brain';
    }
    
    return 'fas fa-robot';
  };
  
  return (
    <div className="model-selector">
      <div className="search-box">
        <i className="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Search models..." 
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => setSearchQuery('')}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      {searchQuery ? (
        // Show flat list of filtered models when searching
        <div className="filtered-models">
          {filteredModels.length > 0 ? (
            filteredModels.map(model => (
              <div 
                key={model.id}
                className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                onClick={() => onSelect(model.id)}
              >
                <div className="model-icon">
                  <i className={getModelIcon(model)}></i>
                </div>
                <div className="model-details">
                  <div className="model-name">{model.name}</div>
                  <div className="model-description">{model.provider}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-models-found">
              <p>No models match your search</p>
            </div>
          )}
        </div>
      ) : (
        // Show grouped models when not searching
        providers.map(provider => (
          <div key={provider} className="model-group">
            <div className="provider-name">{formatProviderName(provider)}</div>
            {groupedModels[provider].map(model => (
              <div 
                key={model.id}
                className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                onClick={() => onSelect(model.id)}
              >
                <div className="model-icon">
                  <i className={getModelIcon(model)}></i>
                </div>
                <div className="model-details">
                  <div className="model-name">{model.name}</div>
                  <div className="model-description">
                    {model.description?.slice(0, 50) || 'General purpose AI model'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

// Format provider name for display
const formatProviderName = (provider) => {
  switch (provider) {
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google';
    case 'meta':
    case 'meta-llama':
      return 'Meta';
    case 'mistralai':
      return 'Mistral AI';
    case 'openai':
      return 'OpenAI';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};

export default ModelSelector;