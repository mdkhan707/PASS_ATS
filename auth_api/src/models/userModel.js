const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    // 🔹 Basic User Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    phone: {
        type: String,
        default: "",
        trim: true
    },

    // 🔹 Authentication Details
    password: {
        type: String,
        default: "" // <-- Allow empty for Google users
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    signUpMethod: {
        type: String,
        enum: ["mail", "google"],
        default: "mail"
    },
    activeStatus: {
        type: Boolean,
        default: true
    },

    // 🔹 Optional Fields
    profilePic: {
        type: String,
        default: ""
    },
    fcmToken: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        default: "en"
    },

    // 🔹 Password Reset
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// 🔹 Hash password before saving, only if present
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔹 Compare Password
UserSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
