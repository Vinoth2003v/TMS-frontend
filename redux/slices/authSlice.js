import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../lib/api";

const getInitialState = () => ({
  user:    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
  token:   typeof window !== "undefined" ? localStorage.getItem("token") : null,
  loading: false,
  error:   null,
});

const initialState = getInitialState();

export const loginUser = createAsyncThunk("auth/login", async ({ email, password }) => {
  return await authApi.login(email, password);
});

export const registerUser = createAsyncThunk("auth/register", async (data) => {
  return await authApi.register(data);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    },
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled,  (state, action) => {
        state.loading = false;
        state.user  = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("user",  JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(loginUser.rejected,   (state, action) => { state.loading = false; state.error = action.error.message ?? "Login failed"; })
      .addCase(registerUser.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled,(state, action) => {
        state.loading = false;
        state.user  = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("user",  JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? "Registration failed"; });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
