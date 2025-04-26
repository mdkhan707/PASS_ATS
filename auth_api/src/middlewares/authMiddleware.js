const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <token>"

        if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

        // Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) return res.status(404).json({ message: "User not found" });

        next(); // Proceed to the next middleware
    } catch (error) {
        res.status(401).json({ message: "Unauthorized - Invalid token", error: error.message });
    }
};
