import { configureStore } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";
import rootReducer from "./reduces";
import { api } from "./api/base";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/FLUSH",
        ],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

// 👉 BẮT BUỘC PHẢI CÓ TYPE NÀY để Docker/TS không báo lỗi middleware
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
