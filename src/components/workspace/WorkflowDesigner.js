import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { 
  addWorkflowNode, 
  updateWorkflowNode, 
  removeWorkflowNode, 
  addWorkflowConnection, 
  removeWorkflowConnection 
} from '../../redux/slices/workspaceSlice';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { showAIResponse } from '../../redux/slices/uiSlice';
import GenerateCard from '../editor/GenerateCard';
import './WorkflowDesigner.css';

const WorkflowDesigner = () => {
  const dispatch = useDispatch();
  
  // Get workflow nodes and connections from Redux
  const nodes = useSelector(state => state.workspace.workflowNodes);
  const connections = useSelector(state => state.workspace.workflowConnections);
  
  // Local state for interactive operations
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });
  const [connectingPort, setConnectingPort] = useState(null);
  const [connectionLine, setConnectionLine] = useState(null);
  const [mousePosInCanvas, setMousePosInCanvas] = useState({ x: 0, y: 0 });
  const [nodeBeingEdited, setNodeBeingEdited] = useState(null);
  const [editedNodeContent, setEditedNodeContent] = useState('');
  
  // Reference to the canvas element
  const canvasRef = useRef(null);
  
  // Handle node selection
  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };
  
  // Start dragging a node
  const handleNodeDragStart = (e, nodeId) => {
    // Prevent default behavior to avoid text selection
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    // Find the node
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Calculate mouse position relative to canvas
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Calculate offset from mouse to node position
    const offsetX = mouseX - node.position.x;
    const offsetY = mouseY - node.position.y;
    
    setDraggingNode(nodeId);
    setDraggingOffset({ x: offsetX, y: offsetY });
    setSelectedNode(nodeId);
  };
  
  // Update node position during drag
  const handleNodeDrag = (e) => {
    if (!draggingNode || !canvasRef.current) return;
    
    // Calculate new position based on mouse and offset
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    const newX = mouseX - draggingOffset.x;
    const newY = mouseY - draggingOffset.y;
    
    // Update node position in Redux
    dispatch(updateWorkflowNode({
      id: draggingNode,
      position: { x: newX, y: newY }
    }));
  };
  
  // End node dragging
  const handleNodeDragEnd = () => {
    setDraggingNode(null);
    setDraggingOffset({ x: 0, y: 0 });
  };
  
  // Start making a connection from a port
  const handlePortDragStart = (e, nodeId, portId, isOutput) => {
    e.stopPropagation(); // Prevent node drag
    
    if (!canvasRef.current) return;
    
    // Find the node and port
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Set port details
    setConnectingPort({
      nodeId,
      portId,
      isOutput,
      x: node.position.x + (isOutput ? 180 : 0), // Adjust based on port position
      y: node.position.y + 40 // Vertical center of the node
    });
    
    // Init connection line
    setConnectionLine({
      start: {
        x: node.position.x + (isOutput ? 180 : 0),
        y: node.position.y + 40
      },
      end: {
        x: node.position.x + (isOutput ? 180 : 0),
        y: node.position.y + 40
      }
    });
  };
  
  // Update connection line during dragging
  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    // Update mouse position
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    setMousePosInCanvas({ x: mouseX, y: mouseY });
    
    // Update connection line if connecting ports
    if (connectingPort && connectionLine) {
      setConnectionLine({
        ...connectionLine,
        end: { x: mouseX, y: mouseY }
      });
    }
    
    // Handle node dragging
    if (draggingNode) {
      handleNodeDrag(e);
    }
  };
  
  // Complete connection when dropping on a port
  const handlePortDrop = (nodeId, portId, isOutput) => {
    if (!connectingPort) return;
    
    // Can't connect to self
    if (nodeId === connectingPort.nodeId) return;
    
    // Can't connect output to output or input to input
    if (isOutput === connectingPort.isOutput) return;
    
    // Determine source and target based on port direction
    let sourceNodeId, sourcePortId, targetNodeId, targetPortId;
    
    if (connectingPort.isOutput) {
      // Connecting from output to input
      sourceNodeId = connectingPort.nodeId;
      sourcePortId = connectingPort.portId;
      targetNodeId = nodeId;
      targetPortId = portId;
    } else {
      // Connecting from input to output
      sourceNodeId = nodeId;
      sourcePortId = portId;
      targetNodeId = connectingPort.nodeId;
      targetPortId = connectingPort.portId;
    }
    
    // Check if connection already exists
    const connectionExists = connections.some(
      conn => conn.sourceNodeId === sourceNodeId &&
              conn.sourcePortId === sourcePortId &&
              conn.targetNodeId === targetNodeId &&
              conn.targetPortId === targetPortId
    );
    
    if (!connectionExists) {
      // Create the connection in Redux
      dispatch(addWorkflowConnection({
        id: uuidv4(),
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId
      }));
    }
    
    // Reset connection state
    setConnectingPort(null);
    setConnectionLine(null);
  };
  
  // End connection attempt when releasing mouse
  const handleCanvasMouseUp = () => {
    if (connectingPort) {
      setConnectingPort(null);
      setConnectionLine(null);
    }
    
    if (draggingNode) {
      handleNodeDragEnd();
    }
  };
  
  // Create a new node
  const handleAddNode = (type = 'default', position = null) => {
    // Default position in center if not specified
    const defaultPos = position || { 
      x: canvasRef.current ? canvasRef.current.offsetWidth / 2 - 90 : 100,
      y: canvasRef.current ? canvasRef.current.offsetHeight / 2 - 50 : 100
    };
    
    // Determine number of ports based on node type
    let inputs = [{ id: 'in1', label: 'Input' }];
    let outputs = [{ id: 'out1', label: 'Output' }];
    
    if (type === 'decision') {
      outputs = [
        { id: 'out1', label: 'True' },
        { id: 'out2', label: 'False' }
      ];
    } else if (type === 'input') {
      inputs = [];
      outputs = [{ id: 'out1', label: 'Output' }];
    } else if (type === 'output') {
      inputs = [{ id: 'in1', label: 'Input' }];
      outputs = [];
    }
    
    const newNode = {
      id: uuidv4(),
      type,
      title: getNodeTitle(type),
      position: defaultPos,
      content: getDefaultContent(type),
      ports: { inputs, outputs }
    };
    
    dispatch(addWorkflowNode(newNode));
    setSelectedNode(newNode.id);
  };
  
  // Delete selected node
  const handleDeleteNode = (nodeId) => {
    dispatch(removeWorkflowNode(nodeId));
    setSelectedNode(null);
  };
  
  // Delete a connection
  const handleDeleteConnection = (sourceNodeId, sourcePortId, targetNodeId, targetPortId) => {
    dispatch(removeWorkflowConnection({
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId
    }));
  };
  
  // Enter edit mode for a node
  const handleEditNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setNodeBeingEdited(nodeId);
      setEditedNodeContent(node.content || '');
    }
  };
  
  // Save node content changes
  const handleSaveNodeContent = () => {
    if (nodeBeingEdited) {
      dispatch(updateWorkflowNode({
        id: nodeBeingEdited,
        content: editedNodeContent
      }));
      setNodeBeingEdited(null);
    }
  };
  
  // Get node title based on type
  const getNodeTitle = (type) => {
    switch (type) {
      case 'input':
        return 'Input';
      case 'process':
        return 'Process';
      case 'output':
        return 'Output';
      case 'decision':
        return 'Decision';
      default:
        return 'Node';
    }
  };
  
  // Get default content based on node type
  const getDefaultContent = (type) => {
    switch (type) {
      case 'input':
        return 'Start process';
      case 'process':
        return 'Process data';
      case 'output':
        return 'End process';
      case 'decision':
        return 'Check condition';
      default:
        return 'Node content';
    }
  };
  
  // Get node icon based on type
  const getNodeIcon = (type) => {
    switch (type) {
      case 'input':
        return 'fas fa-arrow-right';
      case 'process':
        return 'fas fa-cogs';
      case 'output':
        return 'fas fa-arrow-left';
      case 'decision':
        return 'fas fa-question';
      default:
        return 'fas fa-square';
    }
  };
  
  // Ask AI for workflow suggestions
  const handleAIHelp = () => {
    const workflowDescription = nodes.length > 0 ? 
      `Current workflow has ${nodes.length} nodes: ` + 
      nodes.map(node => `"${node.title}" (${node.type})`).join(', ') + '. ' :
      '';
    
    const prompt = workflowDescription + `Please help me improve this workflow by suggesting additional nodes and connections. I need a complete process flow with proper input, processing, and output stages.`;
    
    dispatch(togglePromptArea());
    
    // In a real implementation, this would be integrated with actual AI
    setTimeout(() => {
      dispatch(showAIResponse({
        title: 'Workflow Suggestions',
        content: 
        `# Improved Workflow Design

Based on your current workflow, I recommend enhancing it with the following structure:

## Node Structure

1. **Start with an Input Node** - This serves as the entry point for your workflow
2. **Add a Data Validation Process** - Verify incoming data meets requirements
3. **Add a Decision Node** - Branch the workflow based on validation results
4. **Add Processing Nodes** - Handle the core business logic in these nodes
5. **Finish with Output Nodes** - Provide appropriate outputs for each path

## Implementation Details

- Create an "Input" node called "Data Entry"
- Connect "Data Entry" to a "Process" node called "Validation"
- Connect "Validation" to a "Decision" node called "Is Valid?"
- From "Is Valid?", create two paths:
  - True path connects to "Process" node called "Data Processing"
  - False path connects to "Output" node called "Error Handling"
- Connect "Data Processing" to "Output" node called "Success"

Would you like me to help implement any specific part of this workflow?`
      }));
    }, 500);
  };
  
  // Calculate connection path
  const getConnectionPath = (connection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    
    if (!sourceNode || !targetNode) return '';
    
    // Find output port position (right side of source node)
    const outputPort = sourceNode.ports.outputs.find(p => p.id === connection.sourcePortId);
    const outputIndex = sourceNode.ports.outputs.indexOf(outputPort);
    const totalOutputs = sourceNode.ports.outputs.length;
    const outputOffset = outputIndex !== -1 ? 
      (outputIndex - (totalOutputs - 1) / 2) * 20 : 0;
    
    // Find input port position (left side of target node)
    const inputPort = targetNode.ports.inputs.find(p => p.id === connection.targetPortId);
    const inputIndex = targetNode.ports.inputs.indexOf(inputPort);
    const totalInputs = targetNode.ports.inputs.length;
    const inputOffset = inputIndex !== -1 ? 
      (inputIndex - (totalInputs - 1) / 2) * 20 : 0;
    
    // Calculate connection points
    const startX = sourceNode.position.x + 180; // Right side
    const startY = sourceNode.position.y + 40 + outputOffset; // Middle with offset
    const endX = targetNode.position.x; // Left side
    const endY = targetNode.position.y + 40 + inputOffset; // Middle with offset
    
    // Control points for curve - adjust based on distance
    const distance = Math.abs(endX - startX);
    const curvature = Math.min(distance * 0.5, 100); // Limit curvature
    
    // Create bezier curve path
    return `M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}`;
  };
  
  // Import workflow from JSON
  const importWorkflow = (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (data && data.nodes && Array.isArray(data.nodes)) {
        // Clear existing nodes and connections
        nodes.forEach(node => dispatch(removeWorkflowNode(node.id)));
        
        // Import nodes
        data.nodes.forEach(node => {
          dispatch(addWorkflowNode({
            ...node,
            id: node.id || uuidv4() // Use existing ID or generate new one
          }));
        });
        
        // Import connections
        if (data.connections && Array.isArray(data.connections)) {
          data.connections.forEach(conn => {
            dispatch(addWorkflowConnection({
              ...conn,
              id: conn.id || uuidv4()
            }));
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing workflow:', error);
      return false;
    }
  };
  
  // Export workflow to JSON
  const exportWorkflow = () => {
    try {
      const workflow = {
        nodes,
        connections
      };
      
      return JSON.stringify(workflow, null, 2);
    } catch (error) {
      console.error('Error exporting workflow:', error);
      return null;
    }
  };
  
  // Find optimal positions for new nodes based on workflow description
  const createNodesFromDescription = (description) => {
    // This is a placeholder for actual NLP processing
    // In a real app, you would use NLP to extract nodes and connections
    
    // For demo, let's create a simple workflow
    const baseX = canvasRef.current ? canvasRef.current.offsetWidth / 2 - 250 : 100;
    const baseY = canvasRef.current ? canvasRef.current.offsetHeight / 2 - 50 : 100;
    
    // Create input node
    const inputNode = {
      id: uuidv4(),
      type: 'input',
      title: 'Data Entry',
      position: { x: baseX, y: baseY },
      content: 'Start workflow process',
      ports: {
        inputs: [],
        outputs: [{ id: 'out1', label: 'Output' }]
      }
    };
    
    // Create process node
    const processNode = {
      id: uuidv4(),
      type: 'process',
      title: 'Data Processing',
      position: { x: baseX + 250, y: baseY },
      content: 'Process the input data',
      ports: {
        inputs: [{ id: 'in1', label: 'Input' }],
        outputs: [{ id: 'out1', label: 'Output' }]
      }
    };
    
    // Create decision node
    const decisionNode = {
      id: uuidv4(),
      type: 'decision',
      title: 'Validation',
      position: { x: baseX + 500, y: baseY },
      content: 'Is data valid?',
      ports: {
        inputs: [{ id: 'in1', label: 'Input' }],
        outputs: [
          { id: 'out1', label: 'True' },
          { id: 'out2', label: 'False' }
        ]
      }
    };
    
    // Create success output node
    const successNode = {
      id: uuidv4(),
      type: 'output',
      title: 'Success',
      position: { x: baseX + 750, y: baseY - 80 },
      content: 'Operation completed successfully',
      ports: {
        inputs: [{ id: 'in1', label: 'Input' }],
        outputs: []
      }
    };
    
    // Create error output node
    const errorNode = {
      id: uuidv4(),
      type: 'output',
      title: 'Error',
      position: { x: baseX + 750, y: baseY + 80 },
      content: 'Operation failed',
      ports: {
        inputs: [{ id: 'in1', label: 'Input' }],
        outputs: []
      }
    };
    
    // Add nodes
    dispatch(addWorkflowNode(inputNode));
    dispatch(addWorkflowNode(processNode));
    dispatch(addWorkflowNode(decisionNode));
    dispatch(addWorkflowNode(successNode));
    dispatch(addWorkflowNode(errorNode));
    
    // Add connections
    dispatch(addWorkflowConnection({
      id: uuidv4(),
      sourceNodeId: inputNode.id,
      sourcePortId: 'out1',
      targetNodeId: processNode.id,
      targetPortId: 'in1'
    }));
    
    dispatch(addWorkflowConnection({
      id: uuidv4(),
      sourceNodeId: processNode.id,
      sourcePortId: 'out1',
      targetNodeId: decisionNode.id,
      targetPortId: 'in1'
    }));
    
    dispatch(addWorkflowConnection({
      id: uuidv4(),
      sourceNodeId: decisionNode.id,
      sourcePortId: 'out1',
      targetNodeId: successNode.id,
      targetPortId: 'in1'
    }));
    
    dispatch(addWorkflowConnection({
      id: uuidv4(),
      sourceNodeId: decisionNode.id,
      sourcePortId: 'out2',
      targetNodeId: errorNode.id,
      targetPortId: 'in1'
    }));
  };
  
  // Process AI-suggested workflow
  const processAISuggestion = (suggestion) => {
    // In a real app, this would parse natural language into a workflow
    // For demo, we'll just create a simple workflow
    createNodesFromDescription(suggestion);
  };
  
  return (
    <div className="workflow-designer">
      <div className="workflow-toolbar">
        <div className="node-types">
          <button 
            className="node-type-btn"
            onClick={() => handleAddNode('input')}
            title="Add Input Node"
          >
            <i className="fas fa-arrow-right"></i>
            <span>Input</span>
          </button>
          
          <button 
            className="node-type-btn"
            onClick={() => handleAddNode('process')}
            title="Add Process Node"
          >
            <i className="fas fa-cogs"></i>
            <span>Process</span>
          </button>
          
          <button 
            className="node-type-btn"
            onClick={() => handleAddNode('decision')}
            title="Add Decision Node"
          >
            <i className="fas fa-question"></i>
            <span>Decision</span>
          </button>
          
          <button 
            className="node-type-btn"
            onClick={() => handleAddNode('output')}
            title="Add Output Node"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Output</span>
          </button>
        </div>
        
        <div className="toolbar-actions">
          <button 
            className="toolbar-btn"
            onClick={handleAIHelp}
            title="AI Suggestions"
          >
            <i className="fas fa-robot"></i>
            <span>AI Help</span>
          </button>
          
          {selectedNode && (
            <button 
              className="toolbar-btn delete"
              onClick={() => handleDeleteNode(selectedNode)}
              title="Delete Selected Node"
            >
              <i className="fas fa-trash"></i>
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="workflow-canvas"
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Render connection lines */}
        <svg className="connections-layer">
          {/* Existing connections */}
          {connections.map(conn => (
            <g key={conn.id} className="connection-group">
              <path
                d={getConnectionPath(conn)}
                className="connection-path"
              />
              
              {/* Add small delete button on connection path */}
              <g 
                className="connection-delete-btn" 
                onClick={() => handleDeleteConnection(
                  conn.sourceNodeId, 
                  conn.sourcePortId, 
                  conn.targetNodeId, 
                  conn.targetPortId
                )}
                transform={`translate(${getConnectionMidpoint(conn)})`}
              >
                <circle cx="0" cy="0" r="8" fill="#fff" stroke="#ddd" />
                <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="10">×</text>
              </g>
            </g>
          ))}
          
          {/* Currently drawing connection */}
          {connectionLine && (
            <path
              d={`M ${connectionLine.start.x} ${connectionLine.start.y} C ${(connectionLine.start.x + connectionLine.end.x) / 2} ${connectionLine.start.y}, ${(connectionLine.start.x + connectionLine.end.x) / 2} ${connectionLine.end.y}, ${connectionLine.end.x} ${connectionLine.end.y}`}
              className="connection-path drawing"
            />
          )}
        </svg>
        
        {/* Render nodes */}
        {nodes.map(node => (
          <div 
            key={node.id}
            className={`workflow-node ${node.type} ${selectedNode === node.id ? 'selected' : ''}`}
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`
            }}
            onMouseDown={(e) => handleNodeDragStart(e, node.id)}
            onClick={() => handleNodeSelect(node.id)}
          >
            <div className="node-header">
              <i className={getNodeIcon(node.type)}></i>
              <span className="node-title">{node.title}</span>
              <div className="node-controls">
                <button
                  className="node-control edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditNode(node.id);
                  }}
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button
                  className="node-control delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(node.id);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="node-content">
              {nodeBeingEdited === node.id ? (
                <div className="node-content-editor">
                  <textarea
                    value={editedNodeContent}
                    onChange={(e) => setEditedNodeContent(e.target.value)}
                    onBlur={handleSaveNodeContent}
                    autoFocus
                  />
                  <button 
                    className="save-content-btn"
                    onClick={handleSaveNodeContent}
                  >
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                node.content || (
                  node.type === 'decision' ? 
                    'Check condition' : 
                    node.type === 'process' ?
                      'Process data' :
                      node.type === 'input' ?
                        'Start' :
                        'End'
                )
              )}
            </div>
            
            <div className="node-ports">
              <div className="input-ports">
                {node.ports.inputs.map(port => (
                  <div 
                    key={port.id}
                    className="port input-port"
                    onMouseDown={(e) => handlePortDragStart(e, node.id, port.id, false)}
                    onMouseUp={() => handlePortDrop(node.id, port.id, false)}
                  >
                    <div className="port-point"></div>
                    <span className="port-label">{port.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="output-ports">
                {node.ports.outputs.map(port => (
                  <div 
                    key={port.id}
                    className="port output-port"
                    onMouseDown={(e) => handlePortDragStart(e, node.id, port.id, true)}
                    onMouseUp={() => handlePortDrop(node.id, port.id, true)}
                  >
                    <span className="port-label">{port.label}</span>
                    <div className="port-point"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty state message */}
        {nodes.length === 0 && (
          <div className="empty-workflow">
            <div className="empty-icon">
              <i className="fas fa-sitemap"></i>
            </div>
            <h3>Start Building Your Workflow</h3>
            <p>Add nodes from the toolbar above and connect them to create a workflow</p>
            
            <div className="empty-actions">
              <button 
                className="btn"
                onClick={() => handleAddNode('input', { x: 100, y: 150 })}
              >
                <i className="fas fa-plus"></i> Add First Node
              </button>
              
              <button 
                className="btn accent"
                onClick={handleAIHelp}
              >
                <i className="fas fa-robot"></i> Get AI Suggestions
              </button>
            </div>
            
            <GenerateCard 
              onClick={handleAIHelp}
              title="Let AI Design Your Workflow"
              description="AI can suggest an optimized workflow based on common patterns and best practices"
              icon="fas fa-sitemap"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate the midpoint of a connection
function getConnectionMidpoint(connection) {
  // This is a placeholder since actual calculation depends on the connection path
  // In a real app, you'd calculate this based on the path
  return "50%,0";
}

export default WorkflowDesigner;