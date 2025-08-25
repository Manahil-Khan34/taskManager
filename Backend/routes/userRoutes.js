const express = require("express");

const { protect, admin} = require("../middlewares/authMiddleware");
const { getUsers, getUserById, } = require("../controllers/userController");

const router = express.Router();

// User Management Routes
router.get("/", protect, admin, getUsers); // Get all users (Admin only)
router.get("/:id", protect, getUserById); // Get user by ID (Admin only)


module.exports = router;    