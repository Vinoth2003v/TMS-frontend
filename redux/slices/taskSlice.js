import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tasksApi } from "../../lib/api";

const initialState = { tasks: [], loading: false, error: null };

export const fetchTasks = createAsyncThunk("tasks/fetchAll", async (params) => {
  return await tasksApi.getAll(params);
});

export const createTask = createAsyncThunk("tasks/create", async (data) => {
  return await tasksApi.create(data);
});

export const updateTask = createAsyncThunk("tasks/update", async ({ id, data }) => {
  return await tasksApi.update(id, data);
});

export const deleteTask = createAsyncThunk("tasks/delete", async (id) => {
  await tasksApi.delete(id);
  return id;
});

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTask(state, action) { state.tasks.unshift(action.payload); },
    setTasks(state, action) { state.tasks = action.payload; },
    clearTasks(state) { state.tasks = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled,(state, action) => { state.loading = false; state.tasks = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? "Failed"; })
      .addCase(createTask.fulfilled,(state, action) => { state.tasks.unshift(action.payload); })
      .addCase(updateTask.fulfilled,(state, action) => {
        state.tasks = state.tasks.map((t) => t.id === action.payload.id ? action.payload : t);
      })
      .addCase(deleteTask.fulfilled,(state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      });
  },
});

export const { addTask, setTasks, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;