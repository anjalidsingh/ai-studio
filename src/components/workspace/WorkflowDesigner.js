import React, { useState, useEffect } from 'react';
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
  
  // Reference to the canvas element
  const canvasRef = React.useRef(null);
  
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
    
    // Create the connection in Redux
    dispatch(addWorkflowConnection({
      id: uuidv4(),
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId
    }));
    
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
    
    const newNode = {
      id: uuidv4(),
      type,
      title: getNodeTitle(type),
      position: defaultPos,
      ports: {
        inputs: [{ id: 'in1', label: 'Input' }],
        outputs: [{ id: 'out1', label: 'Output' }]
      }
    };
    
    dispatch(addWorkflowNode(newNode));
  };
  
  // Delete selected node
  const handleDeleteNode = (nodeId) => {
    dispatch(removeWorkflowNode(nodeId));
    setSelectedNode(null);
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
    dispatch(togglePromptArea());
    
    // In a real implementation, this would be integrated with actual AI
    setTimeout(() => {
      dispatch(showAIResponse({
        title: 'Workflow Suggestions',
        content: 'Here are some suggestions to improve your workflow:\n\n1. Add an input node to receive data\n2. Connect to a processing node for data transformation\n3. Add a decision node for conditional routing\n4. Connect outputs to appropriate endpoint nodes'
      }));
    }, 500);
  };
  
  // Calculate connection path
  const getConnectionPath = (connection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    
    if (!sourceNode || !targetNode) return '';
    
    // Calculate connection points
    const startX = sourceNode.position.x + 180; // Right side
    const startY = sourceNode.position.y + 40; // Middle
    const endX = targetNode.position.x; // Left side
    const endY = targetNode.position.y + 40; // Middle
    
    // Control points for curve
    const midX = (startX + endX) / 2;
    
    // Create bezier curve path
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
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
            <path
              key={conn.id}
              d={getConnectionPath(conn)}
              className="connection-path"
            />
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
                  className="node-control"
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
              {node.type === 'decision' ? 'If condition is true' : 'Process data'}
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
            <button 
              className="btn"
              onClick={() => handleAddNode('input', { x: 100, y: 150 })}
            >
              <i className="fas fa-plus"></i> Add First Node
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDesigner;