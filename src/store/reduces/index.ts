import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // sử dụng localStorage
import appReducer from "../slice/app.slice";
import authReducer from "../slice/auth.slice";
import { api } from "../../store/api/base";
const authPersistConfig = {
  key: "auth",
  storage,
};
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  app: persistReducer({ key: "application", storage }, appReducer),
  auth: persistReducer(authPersistConfig, authReducer),
});
export default rootReducer;
