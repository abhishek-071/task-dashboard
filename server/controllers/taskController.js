const Task = require("../models/task");

// Get all tasks
exports.getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id });
  res.json(tasks);
};

// Create task
exports.createTask = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const task = await Task.create({
    title,
    user: req.user._id   // 👈 IMPORTANT
  });

  res.status(201).json(task);
};

// Delete task
exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  // If task not found
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // If task belongs to different user
  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "Not authorized" });
  }

  await task.deleteOne();

  res.json({ message: "Task deleted" });
};

// Toggle task
exports.toggleTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "Not authorized" });
  }

  task.completed = !task.completed;
  await task.save();

  res.json(task);
};

// Update task
exports.updateTask = async (req, res) => {
  const { title } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "Not authorized" });
  }

  task.title = title;
  await task.save();

  res.json(task);
};

// ================= ADMIN DELETE TASK =================
exports.adminDeleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted by admin" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// ================= ADMIN: GET ALL TASKS =================
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("user", "name email role");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN DELETE TASK =================
exports.adminDeleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted by admin" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Clear only logged-in user's tasks
exports.clearUserTasks = async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user._id });
    res.json({ message: "All your tasks cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};