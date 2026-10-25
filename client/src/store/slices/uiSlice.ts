import { createSlice } from "@reduxjs/toolkit";

interface UiState {
  isMobileSidebarOpen: boolean;
  isDesktopSidebarCollapsed: boolean;
}

const initialState: UiState = {
  isMobileSidebarOpen: false,
  isDesktopSidebarCollapsed: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMobileSidebar: (state) => {
      state.isMobileSidebarOpen = !state.isMobileSidebarOpen;
    },
    closeMobileSidebar: (state) => {
      state.isMobileSidebarOpen = false;
    },
    toggleDesktopSidebar: (state) => {
      state.isDesktopSidebarCollapsed = !state.isDesktopSidebarCollapsed;
    },
    setDesktopSidebarCollapsed: (state, action) => {
      state.isDesktopSidebarCollapsed = action.payload;
    },
  },
});

export const {
  toggleMobileSidebar,
  closeMobileSidebar,
  toggleDesktopSidebar,
  setDesktopSidebarCollapsed,
} = uiSlice.actions;

export default uiSlice.reducer;
