import { configureStore } from "@reduxjs/toolkit";
import taskReducer  from "./slices/taskSlice";
import authReducer  from "./slices/authSlice";
import notifReducer from "./slices/notifSlice";

export const store = configureStore({
  reducer: {
    tasks:         taskReducer,
    auth:          authReducer,
    notifications: notifReducer,
  },
});