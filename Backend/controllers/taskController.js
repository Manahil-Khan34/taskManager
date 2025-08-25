const Task = require('../models/Task');


//@desc Get all tasks (admins all, user onle who assingned)
//@route GET /api/tasks/
//@access Private (protect middleware)

const getTasks = async (req, res) => {
    try {
       const { status } = req.query;
         let filter = {};

        if (status) {
            filter.status = status;
        }

        let tasks;

        if (req.user.role === 'admin') {
            tasks = await Task.find(filter).populate('assignedTo', 'name email profileImage');
        }
        else {
            tasks = await Task.find({ ...filter, assignedTo: req.user._id })
                .populate('assignedTo', 'name email profileImage');
        }

        // Add completed todochecklist count to each task
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter(
                    (item) => item.completed
                ) .length;
                return { ...task._doc, completedTodoCount: completedCount };
            })
        );

        // status summary COUNTS 
        const allTasks = await Task.countDocuments(
            req.user.role === 'admin' ? {} : { assignedTo: req.user._id }
        );

        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: 'Pending',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: 'In Progress',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });

        const completedTasks = await Task.countDocuments({
            ...filter,
            status: 'Completed',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });

        res.status(200).json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            }
        });

    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Get task by id
//@route GET /api/tasks/:id
//@access Private (protect middleware)
const getTaskById = async (req, res) => {
    try {

        const task = await Task.findById(req.params.id).populate('assignedTo', 'name email profileImage');

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        };

        res.json(task);
       
    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Create a new task (only admins)
//@route POST /api/tasks/
//@access Private (protect middleware) and Admin (admin middleware)

const createTask = async (req, res) => {
    try {
       const {
              title,
              description,
              priority,
              dueDate,
              assignedTo,
              attachments,
              todoChecklist
            } = req.body;

            if (!Array.isArray(assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
            }

            const task = await Task.create({
                title,
                description,
                priority,
                dueDate,
                assignedTo,
                createdBy: req.user._id, // assuming req.user is populated by the protect middleware
                todoChecklist,
                attachments
            });
            res.status(201).json({
                message: "Task created successfully",
                task
            });
       }
    catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Update task details
//@route PUT /api/tasks/:id 
//@access Private (protect middleware)
const updateTask = async (req, res) => {
    try {

       const task = await Task.findById(req.params.id);
       
       if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;        
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;        
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if(!req.body.assignedTo ){
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
            }
            task.assignedTo = req.body.assignedTo;

    }
    const updatedTask = await task.save();
        res.json({
            message: "Task updated successfully", updatedTask
        });

       
    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Delete task (only admins)
//@route DELETE /api/tasks/:id
//@access Private (protect middleware) and Admin (admin middleware)
const deleteTask = async (req, res) => {
    try {

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }   
        await task.deleteOne();
        res.json({ message: "Task deleted successfully" });
       
    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Update task status
//@route PUT /api/tasks/:id/status  
//@access Private (protect middleware)
const updateTaskStatus = async (req, res) => {
    try {

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const  isAssigned = task.assignedTo.some( (userId) => userId.toString() === req.user._id.toString() );

        if (!isAssigned && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to update this task" });
        }   
        task.status = req.body.status || task.status;

        if (task.status === 'Completed') {
            task.todoChecklist.forEach( (item) => (item.completed = true) );
            task.progress = 100; // Set progress to 100% if task is completed
        }

        await task.save();
        res.json({ message: "Task status updated successfully", task });
       
    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Update task checklist (todo)
//@route PUT /api/tasks/:id/todo
//@access Private (protect middleware)  
const updateTaskChecklist = async (req, res) => {
    try {

        const { todoChecklist } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if(!task.assignedTo.includes(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to update checklist " });
        }
        task.todoChecklist = todoChecklist;

        //Auto-updated progress based on checklist completion
        const completedCount = task.todoChecklist.filter(
            (item) => item.completed ).length;
        
            const totalItems = task.todoChecklist.length;
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        // Auto-mark task as complted if all items  are checked
        if (task.progress === 100) {
            task.status = 'Completed';
        }
        else if (task.progress > 0) {
            task.status = 'In Progress';
        }
        else {
            task.status = 'Pending';
        }
        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate('assignedTo', 'name email profileImage');
       
        res.json({ message: "Task checklist updated successfully", updatedTask });
    } catch (error) {
        res.status(500).json({ message: "server error",error: error.message });
    }
};

//@desc Get dashboard data (admin only)
//@route GET /api/tasks/dashboard-data
//@access Private (protect middleware) and Admin (admin middleware)
const getDashboardData = async (req, res) => {
    try {
       // Fetch statistics for the dashboard
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const overdueTasks = await Task.countDocuments({
            status: { $ne: 'Completed' },
            dueDate: { $lt: new Date() }
        });

        //Ensure all possible statuses are included
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formatedKey = status.replace(/\s+/g, ''); // Remove spaces for response keys
            acc[formatedKey] = taskDistributionRaw.find
            ((item) => item._id === status)?.count || 0;
            return acc;
        }, {});

            taskDistribution["All"] = totalTasks;// add total count to taskDistribution

            // Ensure all priorities are included
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            },
        ]); 
       const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
    acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
    return acc;
}, {});


        // fetch recent 10 tasks
        const recentTasks = await Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate  createdAt");

        res.status(200).json({
            statistics: {
                totalTasks,     
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message });
    }
};

//@desc Get user dashboard data (specific user) 
//@route GET /api/tasks/user-dashboard-data 
//@access Private (protect middleware)
const getUserDashboardData = async (req, res) => {
    try {
       
        const userId = req.user._id; // onlu fetch data for the logged-in user
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'Pending'
        });
        const completedTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'Completed'
        });
        const overdueTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $ne: 'Completed' },
            dueDate: { $lt: new Date() }
        });

        // task distribution by status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formatedKey = status.replace(/\s+/g, ''); // Remove spaces for response keys
            acc[formatedKey] = taskDistributionRaw.find
            ((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
         taskDistribution["All"] = totalTasks; 

         // task distribution by priority
        const taskPriorities = ["Low", "Medium", "High"];   
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            },
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        // fetch recent 10 tasks for the logged-in user
        const recentTasks = await Task.find({ assignedTo: userId })
        .sort({ createdAt: -1 })    
        .limit(10)
        .select("title status priority dueDate createdAt");
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        });

        

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData
};
