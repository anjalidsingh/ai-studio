import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modals: {
    apiKey: false,
    newProject: false,
    saveProject: false,
    deleteConfirmation: false,
    settings: false,
    about: false,
    share: false,
    exportProject: false
  },
  
  dialogs: {
    notification: {
      open: false,
      message: '',
      type: 'info' // 'info', 'success', 'warning', 'error'
    },
    
    confirmAction: {
      open: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null
    }
  },
  
  activeTab: 'content',
  
  actionMenu: {
    open: false,
    position: { x: 0, y: 0 },
    actions: []
  },
  
  aiResponse: {
    open: false,
    content: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    
    showNotification: (state, action) => {
      const { message, type = 'info' } = action.payload;
      state.dialogs.notification = {
        open: true,
        message,
        type
      };
    },
    
    hideNotification: (state) => {
      state.dialogs.notification.open = false;
    },
    
    showConfirmDialog: (state, action) => {
      state.dialogs.confirmAction = {
        ...state.dialogs.confirmAction,
        ...action.payload,
        open: true
      };
    },
    
    hideConfirmDialog: (state) => {
      state.dialogs.confirmAction.open = false;
    },
    
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    openActionMenu: (state, action) => {
      const { position, actions } = action.payload;
      state.actionMenu = {
        open: true,
        position,
        actions
      };
    },
    
    closeActionMenu: (state) => {
      state.actionMenu.open = false;
    },
    
    showAIResponse: (state, action) => {
      state.aiResponse = {
        open: true,
        content: action.payload
      };
    },
    
    hideAIResponse: (state) => {
      state.aiResponse.open = false;
    },
    
    resetUI: () => initialState
  }
});

export const {
  openModal,
  closeModal,
  closeAllModals,
  showNotification,
  hideNotification,
  showConfirmDialog,
  hideConfirmDialog,
  setActiveTab,
  openActionMenu,
  closeActionMenu,
  showAIResponse,
  hideAIResponse,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer;