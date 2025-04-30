import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { 
  addContentBlock, 
  updateContentBlock, 
  deleteContentBlock,
  updateCurrentProject
} from '../../redux/slices/projectsSlice';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { showAIResponse } from '../../redux/slices/uiSlice';
import GenerateCard from '../editor/GenerateCard';
import './CodeStudio.css';

const CodeStudio = () => {
  const dispatch = useDispatch();
  
  // Get current project and content blocks from Redux
  const currentProject = useSelector(state => state.projects.currentProject);
  const blocks = currentProject?.content?.blocks || [];
  
  // Local state for code editor
  const [activeFile, setActiveFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  
  // Initialize files from blocks when component mounts
  useEffect(() => {
    if (blocks.length > 0) {
      const codeBlocks = blocks.filter(block => block.type === 'code');
      
      // Convert code blocks to file format
      const fileData = codeBlocks.map(block => {
        // Try to extract language from content metadata if available
        let language = 'javascript'; // Default language
        let content = block.content;
        
        // Check if content has metadata
        if (block.metadata && block.metadata.language) {
          language = block.metadata.language;
        } else {
          // Try to detect language from first line comments
          const firstLine = content.split('\n')[0];
          
          if (firstLine.includes('python') || firstLine.includes('# ')) {
            language = 'python';
          } else if (firstLine.includes('javascript') || firstLine.includes('// ')) {
            language = 'javascript';
          } else if (firstLine.includes('html') || content.includes('<html')) {
            language = 'html';
          } else if (firstLine.includes('css')) {
            language = 'css';
          }
        }
        
        return {
          id: block.id,
          name: block.title || `file-${block.id.substring(0, 6)}.${getExtensionForLanguage(language)}`,
          content: block.content,
          language
        };
      });
      
      setFiles(fileData);
      
      // Set first file as active if none is selected
      if (fileData.length > 0 && !activeFile) {
        setActiveFile(fileData[0].id);
      }
    } else {
      // Create default file if no files exist
      const defaultFileId = uuidv4();
      const defaultFile = {
        id: defaultFileId,
        name: 'main.js',
        content: '// Write your code here\n\n',
        language: 'javascript'
      };
      
      setFiles([defaultFile]);
      setActiveFile(defaultFileId);
      
      // Create block in Redux
      dispatch(addContentBlock({
        type: 'code',
        content: defaultFile.content,
        title: defaultFile.name,
        metadata: {
          language: defaultFile.language
        }
      }));
    }
  }, [blocks, activeFile, dispatch]);
  
  // Get file extension based on language
  const getExtensionForLanguage = (language) => {
    switch (language) {
      case 'javascript':
        return 'js';
      case 'python':
        return 'py';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'typescript':
        return 'ts';
      case 'json':
        return 'json';
      default:
        return 'txt';
    }
  };
  
  // Get language options
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'json', label: 'JSON' }
  ];
  
  // Get active file
  const getActiveFile = () => {
    return files.find(file => file.id === activeFile);
  };
  
  // Handle code editing
  const handleCodeChange = (e) => {
    const file = getActiveFile();
    if (!file) return;
    
    // Update file in local state
    const updatedFiles = files.map(f => 
      f.id === file.id ? { ...f, content: e.target.value } : f
    );
    setFiles(updatedFiles);
    
    // Update block in Redux
    dispatch(updateContentBlock({
      blockId: file.id,
      content: e.target.value
    }));
  };
  
  // Create a new file
  const handleCreateFile = (e) => {
    e.preventDefault();
    
    if (!newFileName.trim()) {
      alert('Please enter a file name');
      return;
    }
    
    // Add extension if not provided
    const fileName = newFileName.includes('.') 
      ? newFileName 
      : `${newFileName}.${getExtensionForLanguage(selectedLanguage)}`;
    
    const newFileId = uuidv4();
    const newFile = {
      id: newFileId,
      name: fileName,
      content: '',
      language: selectedLanguage
    };
    
    // Update local state
    setFiles([...files, newFile]);
    setActiveFile(newFileId);
    setNewFileName('');
    setShowNewFileForm(false);
    
    // Create block in Redux
    dispatch(addContentBlock({
      type: 'code',
      content: '',
      title: fileName,
      metadata: {
        language: selectedLanguage
      }
    }));
  };
  
  // Delete a file
  const handleDeleteFile = (fileId) => {
    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    // Update local state
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    
    // If deleting active file, set a new active file
    if (activeFile === fileId && updatedFiles.length > 0) {
      setActiveFile(updatedFiles[0].id);
    } else if (updatedFiles.length === 0) {
      setActiveFile(null);
    }
    
    // Delete block in Redux
    dispatch(deleteContentBlock(fileId));
  };
  
  // Request AI code generation
  const handleRequestCodeGeneration = () => {
    const file = getActiveFile();
    
    dispatch(togglePromptArea());
    
    // In a real implementation, this would pass context from the current file
    const contextText = file ? `Please help with this ${file.language} code:\n\n${file.content}` : '';
    
    // Mock AI response
    setTimeout(() => {
      dispatch(showAIResponse({
        title: 'Code Suggestions',
        content: `Here's how you could improve your code:\n\n1. Add error handling with try/catch blocks\n2. Use async/await for cleaner promise handling\n3. Add comments to explain complex logic\n4. Consider extracting the repeated logic into a helper function`
      }));
    }, 500);
  };
  
  // Run the code
  const handleRunCode = () => {
    const file = getActiveFile();
    if (!file) return;
    
    // In a real implementation, this would execute the code in a sandbox
    // For demo purposes, we'll just show a notification
    alert('Code execution is simulated in this demo. In a real application, this would run your code in a secure sandbox environment.');
  };
  
  return (
    <div className="code-studio">
      <div className="code-studio-header">
        <div className="file-tabs">
          {files.map(file => (
            <div 
              key={file.id}
              className={`file-tab ${activeFile === file.id ? 'active' : ''}`}
              onClick={() => setActiveFile(file.id)}
            >
              <span className="file-icon">
                <i className={`fas fa-${getFileIcon(file.language)}`}></i>
              </span>
              <span className="file-name">{file.name}</span>
              <button 
                className="file-close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.id);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
          
          <button 
            className="new-file-btn"
            onClick={() => setShowNewFileForm(true)}
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
        
        <div className="code-actions">
          <button 
            className="code-action-btn"
            onClick={handleRequestCodeGeneration}
          >
            <i className="fas fa-robot"></i>
            <span>AI Help</span>
          </button>
          
          <button 
            className="code-action-btn primary"
            onClick={handleRunCode}
          >
            <i className="fas fa-play"></i>
            <span>Run</span>
          </button>
        </div>
      </div>
      
      {showNewFileForm && (
        <div className="new-file-form">
          <form onSubmit={handleCreateFile}>
            <div className="form-group">
              <input 
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="File name"
                className="file-name-input"
                autoFocus
              />
              
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-select"
              >
                {languageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="button"
                className="btn secondary"
                onClick={() => setShowNewFileForm(false)}
              >
                Cancel
              </button>
              
              <button 
                type="submit"
                className="btn"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="code-editor-container">
        {getActiveFile() ? (
          <div className="editor-with-line-numbers">
            <div className="line-numbers">
              {getActiveFile().content.split('\n').map((_, i) => (
                <div key={i} className="line-number">{i + 1}</div>
              ))}
            </div>
            
            <textarea 
              className="code-editor"
              value={getActiveFile().content}
              onChange={handleCodeChange}
              spellCheck="false"
            ></textarea>
          </div>
        ) : (
          <div className="empty-editor">
            <div className="empty-icon">
              <i className="fas fa-code"></i>
            </div>
            <h3>Create or Select a File</h3>
            <p>Create a new file or select an existing one to start coding</p>
            <button 
              className="btn"
              onClick={() => setShowNewFileForm(true)}
            >
              <i className="fas fa-plus"></i> New File
            </button>
          </div>
        )}
        
        {getActiveFile() && (
          <GenerateCard 
            onClick={handleRequestCodeGeneration}
            title="Generate Code"
            description="Let AI help you complete your code or suggest improvements"
            icon="fas fa-code"
          />
        )}
      </div>
    </div>
  );
};

// Helper function to get file icon based on language
const getFileIcon = (language) => {
  switch (language) {
    case 'javascript':
      return 'js';
    case 'python':
      return 'python';
    case 'html':
      return 'html5';
    case 'css':
      return 'css3-alt';
    case 'typescript':
      return 'file-code';
    case 'json':
      return 'file-alt';
    default:
      return 'file-code';
  }
};

export default CodeStudio;