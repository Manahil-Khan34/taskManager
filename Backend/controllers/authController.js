const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Generatre JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc Register a new user
// @route POST /api/auth/register   
// @access Public
const registerUser = async (req, res) => {

    try {
        const { name, email, password, profileImageUrl, adminInviteToken } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
    
        }
        // Datermine user role: admin if correct token is provided, otherwise member
        let role = 'member';
        if (adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
            role = 'admin';
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({    
            name,
            email,
            password: hashedPassword,
            profileImage: profileImageUrl,
            role,
        });

        // Return user data and JWT
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc Login user
// @route POST /api/auth/login  
// @access Public
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // compare Password 
        const isMatch = await bcrypt.compare (password, user.password);
        if(!isMatch) {
             return res.status(401).json({ message: "Invalid email or password" });
        }

        // Return user data with JWT
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        });

    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
const getUserProfile = async (req, res) => {

    try {
        const user  = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
const updateUserProfile = async (req, res) => {

    try {
        const  user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });

    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
};
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // Generate JWT Token
// const generateToken = (userId) => {
//     return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//         expiresIn: '30d',
//     });
// };

// // @desc Register a new user
// // @route POST /api/auth/register
// // @access Public
// const registerUser = async (req, res) => {
//     try {
//         const { name, email, password, profileImageUrl, adminInviteToken } = req.body;

//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ message: "User already exists" });
//         }

//         let role = 'member';
//         if (adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
//             role = 'admin';
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const user = await User.create({
//             name,
//             email,
//             password: hashedPassword,
//             profileImage: profileImageUrl || null,
//             role,
//         });

//         res.status(201).json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             profileImage: user.profileImage,
//             token: generateToken(user._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// // @desc Login user
// // @route POST /api/auth/login
// // @access Public
// const loginUser = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(401).json({ message: "Invalid email or password" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid email or password" });
//         }

//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             profileImage: user.profileImage,
//             token: generateToken(user._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// // @desc Get user profile
// // @route GET /api/auth/profile
// // @access Private
// const getUserProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id).select("-password");
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// // @desc Update user profile
// // @route PUT /api/auth/profile
// // @access Private
// const updateUserProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         user.name = req.body.name || user.name;
//         user.email = req.body.email || user.email;
//         if (req.body.profileImage) {
//             user.profileImage = req.body.profileImage; // Update profile image
//         }

//         if (req.body.password) {
//             const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(req.body.password, salt);
//         }

//         const updatedUser = await user.save();

//         res.json({
//             _id: updatedUser._id,
//             name: updatedUser.name,
//             email: updatedUser.email,
//             role: updatedUser.role,
//             profileImage: updatedUser.profileImage,
//             token: generateToken(updatedUser._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// module.exports = {
//     registerUser,
//     loginUser,
//     getUserProfile,
//     updateUserProfile,
// };
