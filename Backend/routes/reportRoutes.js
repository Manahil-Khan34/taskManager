const express = require('express');
const { admin, protect } = require('../middlewares/authMiddleware');
const { exportTasksReport, exportUsersReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/export/tasks', protect, admin, exportTasksReport); // Export tasks as excel/pdf

router.get('/export/users', protect, admin, exportUsersReport); // Export users as excel/pdf

module.exports = router;