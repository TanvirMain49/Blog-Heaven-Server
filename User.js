const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    photoURL: {
        type: String,
        default: ''
    },
    bannerURL: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    address: String,
    birthDay: Date,
    portfolio: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
