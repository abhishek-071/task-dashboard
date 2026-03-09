const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
// const { authorizeRoles } = require("../middleware/roleMiddleware");

const taskController = require("../controllers/taskController");

// ================= USER ROUTES =================

// Get logged-in user's tasks
router.get("/", protect, taskController.getTasks);

// Create task
router.post("/", protect, taskController.createTask);

// Clear only user's tasks
router.delete("/", protect, taskController.clearUserTasks);

// Delete single task (should check ownership inside controller)
router.delete("/:id", protect, taskController.deleteTask);

// Toggle task
router.put("/:id/toggle", protect, taskController.toggleTask);

// Update task
router.put("/:id", protect, taskController.updateTask);


// ================= ADMIN ROUTES =================

// Admin: Get all tasks
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  taskController.getAllTasks
);

// Admin: Delete any task
router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  taskController.adminDeleteTask
);

module.exports = router;