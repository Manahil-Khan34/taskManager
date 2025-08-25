const express = require('express');
const { admin, protect } = require('../middlewares/authMiddleware');
const { getDashboardData, getUserDashboardData, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskChecklist } = require('../controllers/taskController');

const router = express.Router();

// Task Managemant Routes
router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks);// get all task (Admin: all , user: assigned)
router.get("/:id", protect, getTaskById); // get task by id
router.post("/", protect,admin ,createTask); // create task (admin only)
router.put("/:id", protect,  updateTask); // update task detAils
router.delete("/:id", protect, admin, deleteTask); // delete task (admin only)
router.put("/:id/status", protect, updateTaskStatus); // update task status
router.put("/:id/todo", protect, updateTaskChecklist); // update task todo

module.exports = router;