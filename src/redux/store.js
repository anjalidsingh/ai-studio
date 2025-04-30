import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from './slices/projectsSlice';
import workspaceReducer from './slices/workspaceSlice';
import aiModelsReducer from './slices/aiModelsSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    projects: projectsReducer,
    workspace: workspaceReducer,
    aiModels: aiModelsReducer,
    user: userReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;