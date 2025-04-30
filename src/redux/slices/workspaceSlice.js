import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Active workspace mode: 'content', 'workflow', 'code', 'visual', 'data'
  activeMode: 'content',
  
  // UI state
  leftSidebarOpen: true,
  toolsPanelOpen: true,
  
  // Selection state
  selectedElements: [],
  
  // History for undo/redo
  history: [],
  historyIndex: -1,
  
  // Canvas state
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  // Prompt area state
  promptAreaOpen: false,
  
  // Workflow designer nodes and connections
  workflowNodes: [],
  workflowConnections: []
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveMode: (state, action) => {
      state.activeMode = action.payload;
    },
    
    toggleLeftSidebar: (state) => {
      state.leftSidebarOpen = !state.leftSidebarOpen;
    },
    
    toggleToolsPanel: (state) => {
      state.toolsPanelOpen = !state.toolsPanelOpen;
    },
    
    selectElement: (state, action) => {
      const elementId = action.payload;
      if (!state.selectedElements.includes(elementId)) {
        state.selectedElements.push(elementId);
      }
    },
    
    deselectElement: (state, action) => {
      const elementId = action.payload;
      state.selectedElements = state.selectedElements.filter(id => id !== elementId);
    },
    
    clearSelection: (state) => {
      state.selectedElements = [];
    },
    
    addHistoryState: (state, action) => {
      // Truncate future history if we're not at the latest state
      if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
      }
      
      // Add new state to history
      state.history.push(action.payload);
      state.historyIndex = state.history.length - 1;
      
      // Limit history size
      if (state.history.length > 30) {
        state.history.shift();
        state.historyIndex--;
      }
    },
    
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
      }
    },
    
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
      }
    },
    
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },
    
    setPan: (state, action) => {
      state.pan = action.payload;
    },
    
    togglePromptArea: (state) => {
      state.promptAreaOpen = !state.promptAreaOpen;
    },
    
    setPromptAreaOpen: (state, action) => {
      state.promptAreaOpen = action.payload;
    },
    
    addWorkflowNode: (state, action) => {
      state.workflowNodes.push(action.payload);
    },
    
    updateWorkflowNode: (state, action) => {
      const { id, ...updates } = action.payload;
      const nodeIndex = state.workflowNodes.findIndex(node => node.id === id);
      
      if (nodeIndex !== -1) {
        state.workflowNodes[nodeIndex] = {
          ...state.workflowNodes[nodeIndex],
          ...updates
        };
      }
    },
    
    removeWorkflowNode: (state, action) => {
      const nodeId = action.payload;
      state.workflowNodes = state.workflowNodes.filter(node => node.id !== nodeId);
      
      // Also remove any connections involving this node
      state.workflowConnections = state.workflowConnections.filter(
        conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      );
    },
    
    addWorkflowConnection: (state, action) => {
      state.workflowConnections.push(action.payload);
    },
    
    removeWorkflowConnection: (state, action) => {
      const { sourceNodeId, sourcePortId, targetNodeId, targetPortId } = action.payload;
      
      state.workflowConnections = state.workflowConnections.filter(
        conn => 
          !(conn.sourceNodeId === sourceNodeId && 
            conn.sourcePortId === sourcePortId &&
            conn.targetNodeId === targetNodeId && 
            conn.targetPortId === targetPortId)
      );
    },
    
    clearWorkflow: (state) => {
      state.workflowNodes = [];
      state.workflowConnections = [];
    },
    
    resetWorkspace: () => initialState
  }
});

export const {
  setActiveMode,
  toggleLeftSidebar,
  toggleToolsPanel,
  selectElement,
  deselectElement,
  clearSelection,
  addHistoryState,
  undo,
  redo,
  setZoom,
  setPan,
  togglePromptArea,
  setPromptAreaOpen,
  addWorkflowNode,
  updateWorkflowNode,
  removeWorkflowNode,
  addWorkflowConnection,
  removeWorkflowConnection,
  clearWorkflow,
  resetWorkspace
} = workspaceSlice.actions;

export default workspaceSlice.reducer;