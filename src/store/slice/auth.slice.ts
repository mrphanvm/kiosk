import { createSlice } from "@reduxjs/toolkit";
const initialState: any = {
  user: {},
  isLogin: false,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.user = action.payload;
    },
    setIsLogin: (state, action) => {
      state.isLogin = action.payload;
    },
  },
});
export const { setCurrentUser, setIsLogin } = authSlice.actions;
export default authSlice.reducer;
