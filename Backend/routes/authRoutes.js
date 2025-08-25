const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.post("/upload-image", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});


module.exports = router; 

// const express = require('express');
// const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
// const { protect } = require('../middlewares/authMiddleware');
// const upload = require('../middlewares/uploadMiddleware');
// const User = require('..'); // <-- Import your User model

// const router = express.Router();

// // Auth Routes
// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/profile", protect, getUserProfile);
// router.put("/profile", protect, updateUserProfile);

// // Upload and Save Profile Image
// router.post("/upload-image", protect, upload.single("image"), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: "No file uploaded" });
//         }

//         const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

//         // Update the logged-in user's profileImage in MongoDB
//         const user = await User.findByIdAndUpdate(
//             req.user._id, // `req.user` comes from protect middleware
//             { profileImage: imageUrl },
//             { new: true }
//         );

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         res.status(200).json({
//             message: "Image uploaded and profile updated successfully",
//             imageUrl: user.profileImage
//         });

//     } catch (error) {
//         console.error("Upload error:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// module.exports = router;
