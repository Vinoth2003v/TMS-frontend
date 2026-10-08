import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  assignedTo: String,  
  dueDate: String,
  priority: String,
  status: {
    type: String,
    default: "Todo",
  },
});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);