const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const userService = require('../utils/userService');
// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        // Save code and expiration time
        user.resetPasswordToken = verificationCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

        await user.save();

        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email Content
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: "Password Reset Verification Code",
            text: `Your password reset verification code is: ${verificationCode}`
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Verification code sent to email" });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
const bcrypt = require('bcryptjs');
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Assign new password directly (pre-save hook will hash it)
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save(); // This triggers the pre-save hook

        // For debugging purposes
        console.log("Password reset successful for:", email);

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};




exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find the user by email and code
        const user = await User.findOne({
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        // ✅ Mark user as verified and clear the token
        user.isVerified = true;
        // user.resetPasswordToken = undefined;
        // user.resetPasswordExpires = undefined;

        await user.save(); // ✅ Save changes to the database

        res.status(200).json({ message: "Code verified successfully, email is now verified" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// ✅ SIGN UP
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword } = req.body;

        // Check if all fields are provided
        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ Phone Number Validation: Ensure it's a 10-digit number
        if (!/^\d{11}$/.test(phone)) {
            return res.status(400).json({ message: "Invalid phone number. Must be 11 digits" });
        }

        // ✅ Confirm Password Validation: Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Create new user
        const user = await User.create({ name, email, phone, password });

        res.status(201).json({
            message: "User registered successfully",
            token: generateToken(user),
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};



// ✅ SIGN IN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt for:", email);

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found:", email);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Compare password
        console.log("Attempting password comparison for:", email);
        const isMatch = await user.comparePassword(password);
        console.log("Password match result:", isMatch);
        
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        res.status(200).json({
            message: "Login successful",
            token: generateToken(user),
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//GOOGLE SIGN IN
 // adjust if your service is elsewhere

exports.googleSignIn = async (req, res) => {
  const { name, email, contact, fcmToken, language, profilePic } = req.body;

  if (!email) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: 'Email is required.',
    });
  }

  try {
    const userSignedIn = await userService.googleSignIn({
      name,
      email,
      contact,
      fcmToken,
      language,
      profilePic,
    });

    return res.status(userSignedIn.code).json(userSignedIn);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return res.status(500).json({
      status: false,
      code: 500,
      message: error.message,
    });
  }
};
