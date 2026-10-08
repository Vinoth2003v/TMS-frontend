import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationsApi } from "../../lib/api";

const initialState = { notifications: [], unreadCount: 0, loading: false };

export const fetchNotifications = createAsyncThunk("notif/fetch", async (email) => {
  return await notificationsApi.getAll(email);
});

export const markAllRead = createAsyncThunk("notif/markAllRead", async (email) => {
  await notificationsApi.markAllAsRead(email);
  return email;
});

const notifSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      state.unreadCount++;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.unreadCount   = action.payload.filter((n) => !n.read).length;
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount   = 0;
      });
  },
});

export const { addNotification, clearNotifications } = notifSlice.actions;
export default notifSlice.reducer;
