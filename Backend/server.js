require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

const connectDB = require("./config/db");

const app = express();

// Middleware to handle CORS
app.use(
    cors({ 
        origin: process.env.CLIENT_URL || "*" ,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);



// middleware
app.use(express.json());

// Database connection
connectDB();

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

// Server uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// server Start  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
