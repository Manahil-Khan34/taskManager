const mongoose = require('mongoose');
 
const UserSchema = new mongoose.Schema({
    name: {
        type: String, required: true },

    email: {
        type: String, required: true, unique: true },

    password: {
        type: String, required: true },

        profileImage: {
        type: String, default: null }, // URL to the profile image

    role: { 
        type: String, enum: ['admin', 'member'], default: 'member' }, // Role Based access 
    },
    
    {timestamps: true} // Automatically manage createdAt and updatedAt fields
);

module.exports = mongoose.model('User', UserSchema);