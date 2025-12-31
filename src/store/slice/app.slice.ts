import { createSlice } from "@reduxjs/toolkit";

const initialState: any = {
  menu: [],
  isCollapsed: false,
};
const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveMenu: (state, action) => {
      state.menu = action.payload;
    },
    setIsCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
    },
  },
});
export const { setActiveMenu, setIsCollapsed } = appSlice.actions;
export default appSlice.reducer;
