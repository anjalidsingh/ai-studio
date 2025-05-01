/**
 * AI Response Handler Utility
 * Processes AI responses and applies them to different workspace components
 */
import { v4 as uuidv4 } from 'uuid';
import { addContentBlock } from '../redux/slices/projectsSlice';
import { 
  addWorkflowNode, 
  addWorkflowConnection,
  setActiveMode 
} from '../redux/slices/workspaceSlice';
import { hideAIResponse } from '../redux/slices/uiSlice';

/**
 * Processes AI response and applies it to the current workspace
 * @param {Object} response - The AI response object
 * @param {string} activeMode - Current workspace mode
 * @param {function} dispatch - Redux dispatch function
 */
export const processAiResponse = (response, activeMode, dispatch) => {
  const content = typeof response.content === 'string' 
    ? response.content 
    : (response.content?.content || '');
  
  switch (activeMode) {
    case 'content':
      applyToContentEditor(content, dispatch);
      break;
    case 'workflow':
      applyToWorkflowDesigner(content, dispatch);
      break;
    case 'code':
      applyToCodeStudio(content, dispatch);
      break;
    case 'visual':
      applyToVisualLab(content, dispatch);
      break;
    default:
      applyToContentEditor(content, dispatch);
  }
  
  // Close the AI response card
  dispatch(hideAIResponse());
};

/**
 * Apply AI response to Content Editor
 * @param {string} content - AI response content
 * @param {function} dispatch - Redux dispatch function
 */
const applyToContentEditor = (content, dispatch) => {
  // Parse the content structure
  const sections = parseContentStructure(content);
  
  // Add each section as a content block
  sections.forEach(section => {
    if (section.type === 'heading') {
      dispatch(addContentBlock({
        type: section.level === 1 ? 'heading' : 'subheading',
        content: section.content
      }));
    } else if (section.type === 'text') {
      dispatch(addContentBlock({
        type: 'text',
        content: section.content
      }));
    } else if (section.type === 'list') {
      dispatch(addContentBlock({
        type: 'list',
        content: section.items.join('\n')
      }));
    } else if (section.type === 'code') {
      // Extract language if available
      const match = section.content.match(/```(\w+)/);
      const language = match ? match[1] : 'javascript';
      
      // Extract code without the triple backticks
      const codeContent = section.content
        .replace(/```\w*\n/, '')
        .replace(/```\s*$/, '')
        .trim();
      
      dispatch(addContentBlock({
        type: 'code',
        content: codeContent,
        title: `generated-code.${getFileExtension(language)}`,
        metadata: {
          language
        }
      }));
    }
  });
};

/**
 * Apply AI response to Workflow Designer
 * @param {string} content - AI response content
 * @param {function} dispatch - Redux dispatch function
 */
const applyToWorkflowDesigner = (content, dispatch) => {
  // Check if the content describes workflow nodes and connections
  const workflowDescription = parseWorkflowDescription(content);
  
  if (workflowDescription.nodes.length > 0) {
    // Apply nodes first
    const nodeIdMap = {}; // Map to store AI node names to actual IDs
    
    // Create position grid
    const grid = {
      startX: 100,
      startY: 150,
      rows: Math.ceil(Math.sqrt(workflowDescription.nodes.length)),
      cols: Math.ceil(Math.sqrt(workflowDescription.nodes.length)),
      rowHeight: 120,
      colWidth: 220
    };
    
    // Process nodes
    workflowDescription.nodes.forEach((node, index) => {
      const row = Math.floor(index / grid.cols);
      const col = index % grid.cols;
      
      const nodeId = uuidv4();
      nodeIdMap[node.name] = nodeId;
      
      // Create the node with proper positioning
      dispatch(addWorkflowNode({
        id: nodeId,
        type: node.type || 'default',
        title: node.name,
        content: node.content || '',
        position: {
          x: grid.startX + (col * grid.colWidth),
          y: grid.startY + (row * grid.rowHeight)
        },
        ports: {
          inputs: [{ id: 'in1', label: 'Input' }],
          outputs: [{ id: 'out1', label: 'Output' }]
        }
      }));
    });
    
    // Process connections
    workflowDescription.connections.forEach(conn => {
      if (nodeIdMap[conn.from] && nodeIdMap[conn.to]) {
        dispatch(addWorkflowConnection({
          id: uuidv4(),
          sourceNodeId: nodeIdMap[conn.from],
          sourcePortId: 'out1',
          targetNodeId: nodeIdMap[conn.to],
          targetPortId: 'in1'
        }));
      }
    });
    
    // Switch to workflow mode if not already there
    dispatch(setActiveMode('workflow'));
  } else {
    // Fallback: create a text block with the content if not workflow-specific
    dispatch(addContentBlock({
      type: 'text',
      content
    }));
  }
};

/**
 * Apply AI response to Code Studio
 * @param {string} content - AI response content
 * @param {function} dispatch - Redux dispatch function
 */
const applyToCodeStudio = (content, dispatch) => {
  // Extract code blocks from the content
  const codeBlocks = extractCodeBlocks(content);
  
  if (codeBlocks.length > 0) {
    // Add each code block as a separate file
    codeBlocks.forEach((block, index) => {
      const { language, code } = block;
      
      dispatch(addContentBlock({
        type: 'code',
        content: code,
        title: `generated-${index + 1}.${getFileExtension(language)}`,
        metadata: {
          language
        }
      }));
    });
    
    // Switch to code mode if not already there
    dispatch(setActiveMode('code'));
  } else {
    // If no code blocks found, add as text
    dispatch(addContentBlock({
      type: 'text',
      content
    }));
  }
};

/**
 * Apply AI response to Visual Lab
 * @param {string} content - AI response content
 * @param {function} dispatch - Redux dispatch function
 */
const applyToVisualLab = (content, dispatch) => {
  // Try to parse data table from the content
  const tableData = extractTableData(content);
  
  if (tableData.length > 0) {
    // Create a chart visualization
    dispatch(addContentBlock({
      type: 'visualization',
      title: 'AI Generated Chart',
      content: 'chart-placeholder',
      metadata: {
        chartType: 'bar', // Default type
        chartData: tableData.map(row => ({
          category: row.label || row.category || `Item ${row.index + 1}`,
          value: parseFloat(row.value || row.data || 0)
        })),
        chartConfig: {
          title: extractChartTitle(content) || 'Generated Chart',
          xAxis: 'Categories',
          yAxis: 'Values',
          colors: ['#5e35b1', '#03a9f4', '#ff6e40', '#4caf50', '#ffab00']
        }
      }
    }));
    
    // Switch to visual mode if not already there
    dispatch(setActiveMode('visual'));
  } else {
    // If no table data found, add as text
    dispatch(addContentBlock({
      type: 'text',
      content
    }));
  }
};

/**
 * Parse content structure from AI response
 * @param {string} content - AI response content
 * @returns {Array} - Array of section objects
 */
const parseContentStructure = (content) => {
  if (!content) return [];
  
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  
  lines.forEach(line => {
    // Check for headers
    if (line.startsWith('# ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { type: 'heading', level: 1, content: line.substring(2), children: [] };
      sections.push(currentSection);
      currentSection = null;
    } 
    else if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { type: 'heading', level: 2, content: line.substring(3), children: [] };
      sections.push(currentSection);
      currentSection = null;
    }
    // Check for lists
    else if (line.match(/^\d+\.\s+/) || line.match(/^[•\-\*]\s+/)) {
      if (!currentSection || currentSection.type !== 'list') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'list', items: [] };
      }
      currentSection.items.push(line);
    }
    // Check for code blocks
    else if (line.startsWith('```')) {
      if (currentSection && currentSection.type === 'code') {
        // End of code block
        currentSection.content += line + '\n';
        sections.push(currentSection);
        currentSection = null;
      } else {
        // Start of code block
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'code', content: line + '\n' };
      }
    }
    // Regular text/paragraph
    else {
      if (currentSection && currentSection.type === 'code') {
        currentSection.content += line + '\n';
      } else if (line.trim() === '') {
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
      } else {
        if (!currentSection || currentSection.type !== 'text') {
          if (currentSection) sections.push(currentSection);
          currentSection = { type: 'text', content: line };
        } else {
          currentSection.content += '\n' + line;
        }
      }
    }
  });
  
  // Add the last section if any
  if (currentSection) sections.push(currentSection);
  
  return sections;
};

/**
 * Parse workflow description from AI response
 * @param {string} content - AI response content
 * @returns {Object} - Object with nodes and connections
 */
const parseWorkflowDescription = (content) => {
  const workflowDescription = {
    nodes: [],
    connections: []
  };
  
  // Check if content contains a workflow description
  if (!content.includes('workflow') && 
      !content.includes('node') && 
      !content.includes('process') && 
      !content.includes('connect')) {
    return workflowDescription;
  }
  
  // Try to extract nodes with regex patterns
  const nodePatterns = [
    /node\s+"([^"]+)"\s*(?:is|as|type)?\s*(?:a|an)?\s*(?:"([^"]+)")?/gi,
    /create\s+(?:a|an)?\s*(?:([a-z]+))?\s*node\s+(?:called|named)?\s*"([^"]+)"/gi,
    /([a-z]+)\s+node\s+(?:called|named)?\s*"([^"]+)"/gi
  ];
  
  // Extract nodes
  nodePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Handle different pattern matches
      let name, type;
      if (match[2] && match[1]) {
        if (pattern.source.includes('create')) {
          type = match[1];
          name = match[2];
        } else {
          name = match[1];
          type = match[2];
        }
      } else if (match[2]) {
        name = match[1];
        type = 'default';
      } else {
        name = match[1] || match[2];
        type = 'default';
      }
      
      // Avoid duplicate nodes
      if (!workflowDescription.nodes.some(n => n.name === name)) {
        workflowDescription.nodes.push({
          name,
          type: mapNodeType(type),
          content: `${name} node`
        });
      }
    }
  });
  
  // Extract connections
  const connectionPatterns = [
    /connect\s+"([^"]+)"\s+to\s+"([^"]+)"/gi,
    /"([^"]+)"\s+connects\s+to\s+"([^"]+)"/gi,
    /from\s+"([^"]+)"\s+to\s+"([^"]+)"/gi
  ];
  
  connectionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      workflowDescription.connections.push({
        from: match[1],
        to: match[2]
      });
    }
  });
  
  // If no connections explicitly defined but have multiple nodes,
  // create sequential connections
  if (workflowDescription.connections.length === 0 && workflowDescription.nodes.length > 1) {
    for (let i = 0; i < workflowDescription.nodes.length - 1; i++) {
      workflowDescription.connections.push({
        from: workflowDescription.nodes[i].name,
        to: workflowDescription.nodes[i + 1].name
      });
    }
  }
  
  return workflowDescription;
};

/**
 * Map node type string to standard types
 * @param {string} typeStr - Node type string
 * @returns {string} - Standardized node type
 */
const mapNodeType = (typeStr) => {
  const type = typeStr.toLowerCase();
  
  if (type.includes('input') || type.includes('start')) {
    return 'input';
  } else if (type.includes('output') || type.includes('end')) {
    return 'output';
  } else if (type.includes('decision') || type.includes('conditional')) {
    return 'decision';
  } else if (type.includes('process')) {
    return 'process';
  } else {
    return 'default';
  }
};

/**
 * Extract code blocks from content
 * @param {string} content - AI response content
 * @returns {Array} - Array of code block objects
 */
const extractCodeBlocks = (content) => {
  if (!content) return [];
  
  const codeBlocks = [];
  const codeBlockRegex = /```(?:(\w+))?\n([\s\S]+?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'javascript';
    const code = match[2].trim();
    codeBlocks.push({ language, code });
  }
  
  return codeBlocks;
};

/**
 * Extract table data from content
 * @param {string} content - AI response content
 * @returns {Array} - Array of data objects
 */
const extractTableData = (content) => {
  // First try to find JSON data
  const jsonMatch = content.match(/```(?:json)?\n([\s\S]+?)```/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      if (Array.isArray(jsonData)) {
        return jsonData.map((item, index) => ({
          ...item,
          index
        }));
      }
    } catch (e) {
      // JSON parsing failed, continue with other methods
    }
  }
  
  // Try to extract tabular data
  const tableData = [];
  const tableRows = content.match(/\|(.+?)\|/g);
  
  if (tableRows && tableRows.length > 1) {
    // Skip header and separator rows
    const dataRows = tableRows.slice(2);
    
    dataRows.forEach((row, index) => {
      const cells = row.split('|').filter(cell => cell.trim());
      if (cells.length >= 2) {
        tableData.push({
          category: cells[0].trim(),
          value: parseFloat(cells[1].trim()) || 0,
          index
        });
      }
    });
    
    return tableData;
  }
  
  // Try to extract from bulleted or numbered lists
  const listItems = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const listMatch = line.match(/^[-*•]\s+(.+?):\s*(\d+(?:\.\d+)?)/);
    const numberedMatch = line.match(/^\d+\.\s+(.+?):\s*(\d+(?:\.\d+)?)/);
    
    if (listMatch || numberedMatch) {
      const match = listMatch || numberedMatch;
      listItems.push({
        category: match[1].trim(),
        value: parseFloat(match[2]),
        index
      });
    }
  });
  
  if (listItems.length > 0) {
    return listItems;
  }
  
  return [];
};

/**
 * Extract chart title from content
 * @param {string} content - AI response content
 * @returns {string} - Chart title
 */
const extractChartTitle = (content) => {
  // Try to find a title in the content
  const titleMatch = content.match(/title[:\s]+["']?([^"'\n]+)["']?/i) || 
                     content.match(/chart[:\s]+["']?([^"'\n]+)["']?/i) ||
                     content.match(/graph[:\s]+["']?([^"'\n]+)["']?/i) ||
                     content.match(/# (.+)/);
  
  return titleMatch ? titleMatch[1].trim() : '';
};

/**
 * Get file extension from language
 * @param {string} language - Programming language
 * @returns {string} - File extension
 */
const getFileExtension = (language) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return 'js';
    case 'python':
    case 'py':
      return 'py';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'typescript':
    case 'ts':
      return 'ts';
    case 'json':
      return 'json';
    default:
      return 'txt';
  }
};

export default {
  processAiResponse,
  parseContentStructure,
  extractCodeBlocks,
  extractTableData
};