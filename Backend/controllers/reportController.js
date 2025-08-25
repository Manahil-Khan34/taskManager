const Task = require('../models/Task.js');
const User = require('../models/User.js');

const ExcelJS = require('exceljs');


const exportTasksReport = async (req, res) => {
  try {
    // Fetch tasks and populate assignedTo users
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');

    worksheet.columns = [
      { header: 'Task ID', key: '_id', width: 25 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Due Date', key: 'dueDate', width: 20 },
      { header: 'Assigned To', key: 'assignedTo', width: 40 },
    ];

    tasks.forEach(task => {
      // 🔑 Handle multiple assignees properly
      const assignedToFormatted = Array.isArray(task.assignedTo) && task.assignedTo.length > 0
        ? task.assignedTo.map(u => `${u.name} (${u.email})`).join(', ')
        : 'Unassigned';

      worksheet.addRow({
        _id: task._id.toString(),
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No Due Date',
        assignedTo: assignedToFormatted,
      });
    });

    // Send as attachment
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tasks_report.xlsx"'
    );
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Error Exporting Task', error: error.message });
  }
};





// const ExcelJS = require('exceljs');


// const exportTasksReport = async (req, res) => {
//   try {
//     const tasks = await Task.find().populate('assignedTo', 'name email').lean();

//     const workbook = new ExcelJS.Workbook(); // ✅ Correct variable name
//     const worksheet = workbook.addWorksheet('Tasks Report');

//     worksheet.columns = [
//       { header: 'Task ID', key: '_id', width: 25 },
//       { header: 'Title', key: 'title', width: 30 },
//       { header: 'Description', key: 'description', width: 50 },
//       { header: 'Priority', key: 'priority', width: 15 },
//       { header: 'Status', key: 'status', width: 20 },
//       { header: 'Due Date', key: 'dueDate', width: 20 },
//       { header: 'Assigned To', key: 'assignedTo', width: 30 },
//     ];

//     tasks.forEach(task => {
//       worksheet.addRow({
//         _id: task._id.toString(),
//         title: task.title,
//         description: task.description,
//         priority: task.priority,
//         status: task.status,
//         dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No Due Date',
//         assignedTo: task.assignedTo?.name || 'Unassigned',
//       });
//     });

//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       'attachment; filename="tasks_report.xlsx"'
//     );

//     await workbook.xlsx.write(res); // ✅ Stream directly to response
//     res.end();

//   } catch (error) {
//     console.error('Error exporting report:', error);
//     res.status(500).json({ message: 'Error Exporting Task', error: error.message });
//   }
// };
// @desc Export all tasks as an Excel file
// @route GET /api/reports/export/tasks                                     
// @access Private/Admin
// const exportTasksReport = async (req, res) => {
//   try {
//     const tasks = await Task.find().populate('assignedTo', 'name email').lean();

//     const workbook = new excelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Tasks Report');

//     worksheet.columns = [
//       { header: 'Task ID', key: '_id', width: 25 },
//       { header: 'Title', key: 'title', width: 30 },
//       { header: 'Description', key: 'description', width: 50 },
//       { header: 'Priority', key: 'priority', width: 15 },
//       { header: 'Status', key: 'status', width: 20 },
//       { header: 'Due Date', key: 'dueDate', width: 20 },
//       { header: 'Assigned To', key: 'assignedTo', width: 30 },
//     ];

//     tasks.forEach(task => {
//       const assignedTo = task.assignedTo?.name || 'Unassigned';

//       worksheet.addRow({
//         _id: task._id,
//         title: task.title,
//         description: task.description,
//         priority: task.priority,
//         status: task.status,
//         dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No Due Date',
//         assignedTo: assignedTo,
//       });
//     });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', 'attachment; filename="tasks_report.xlsx"');

//     return workbook.xlsx.write(res).then(() => res.end());

//   } catch (error) {
//     res.status(500).json({ message: 'Error Exporting Task', error: error.message });
//   }
// };






// module.exports = { exportTasksReport };


// @desc Export user-task report as an Excel file
// @route GET /api/reports/export/users
// @access Private/Admin
// const exportUsersReport = async (req, res) => {
//   try {
//     const users = await User.find().select('name email _id').lean();
//     const userTasks = await Task.find().populate("assignedTo", "name email _id");

//     const userTaskMap = {};
//     users.forEach((user) => {
//       userTaskMap[user._id] = {
//         name: user.name,
//         email: user.email,
//         taskCount: 0,
//         pendingTasks: 0,
//         inProgressTasks: 0,
//         completedTasks: 0
//       };
//     });

//     userTasks.forEach((task) => {
//       const assignedUser = task.assignedTo;
//       if (assignedUser && userTaskMap[assignedUser._id]) {
//         userTaskMap[assignedUser._id].taskCount += 1;

//         if (task.status === 'Pending') {
//           userTaskMap[assignedUser._id].pendingTasks += 1;
//         } else if (task.status === 'In Progress') {
//           userTaskMap[assignedUser._id].inProgressTasks += 1;
//         } else if (task.status === 'Completed') {
//           userTaskMap[assignedUser._id].completedTasks += 1;
//         }
//       }
//     });

//     const workbook = new excelJS.Workbook();
//     const worksheet = workbook.addWorksheet('User Task Report');

//     worksheet.columns = [
//       { header: 'User Name', key: 'name', width: 30 },
//       { header: 'Email', key: 'email', width: 40 },
//       { header: 'Total Assigned Tasks', key: 'taskCount', width: 20 },
//       { header: 'Pending Tasks', key: 'pendingTasks', width: 20 },
//       { header: 'In Progress Tasks', key: 'inProgressTasks', width: 20 },
//       { header: 'Completed Tasks', key: 'completedTasks', width: 20 }
//     ];

//     Object.values(userTaskMap).forEach((user) => {
//       worksheet.addRow(user);
//     });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', 'attachment; filename="user_report.xlsx"');

//     return workbook.xlsx.write(res).then(() => res.end());

//   } catch (error) {
//     res.status(500).json({ message: 'Error Exporting Task', error: error.message });
//   }
// };


// make sure this import is EXACTLY lowercase

// const Task = require('../models/Task');
// const User = require('../models/User');

const exportUsersReport = async (req, res) => {
  try {
    // Only fetch fields we need
    const users = await User.find().select('name email _id').lean();
    const tasks = await Task.find().select('assignedTo status').lean();

    // Prepare user map
    const userTaskMap = {};
    for (const u of users) {
      userTaskMap[u._id.toString()] = {
        name: u.name,
        email: u.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    }

    // Normalizer for status strings
    const norm = s => (s || '').toLowerCase().trim();

    // Count tasks per user (supports assignedTo as array or single id)
    for (const t of tasks) {
      const assignees = Array.isArray(t.assignedTo)
        ? t.assignedTo
        : (t.assignedTo ? [t.assignedTo] : []);

      for (const a of assignees) {
        const id = (a && a._id ? a._id : a); // works for populated docs or ObjectId
        if (!id) continue;

        const key = id.toString();
        const bucket = userTaskMap[key];
        if (!bucket) continue;

        bucket.taskCount += 1;

        const s = norm(t.status);
        if (s === 'pending') bucket.pendingTasks += 1;
        else if (s === 'in progress' || s === 'in-progress' || s === 'inprogress')
          bucket.inProgressTasks += 1;
        else if (s === 'completed' || s === 'complete' || s === 'done')
          bucket.completedTasks += 1;
      }
    }

    // Build workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('User Task Report');

    ws.columns = [
      { header: 'User Name', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 36 },
      { header: 'Total Assigned Tasks', key: 'taskCount', width: 22 },
      { header: 'Pending Tasks', key: 'pendingTasks', width: 18 },
      { header: 'In Progress Tasks', key: 'inProgressTasks', width: 20 },
      { header: 'Completed Tasks', key: 'completedTasks', width: 18 },
    ];

    Object.values(userTaskMap).forEach(row => ws.addRow(row));

    // Send as a buffer (most reliable across setups)
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="user_report.xlsx"'
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportUsersReport error:', err);
    res.status(500).json({ message: 'Error exporting report', error: err.message });
  }
};


module.exports = {
  exportTasksReport,
  exportUsersReport
};
