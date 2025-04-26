const express = require("express");
const { register, login, forgotPassword, resetPassword, verifyCode } = require("../controllers/authController"); // ✅ Import missing functions
const { protect } = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", register);
router.post("/signin", login);
router.post("/forgot-password", forgotPassword); // ✅ Now it will work
// router.post("/reset-password", resetPassword);   // ✅ Now it will 
router.post('/verify-code', verifyCode);
router.post("/reset-password",  authController.resetPassword);

// ✅ Example of a protected route
router.get("/profile", protect, (req, res) => {
    res.status(200).json({ message: "Profile data", user: req.user });
});



// Add an error handler route
router.get("/failure", (req, res) => {
    console.log("Google authentication failed");
    res.status(400).json({ message: "Google login failed" });
});


module.exports = router;

const multer = require('multer');
const upload = multer(); // to support `upload.none()` if needed

router.post('/google-signin', upload.none(), authController.googleSignIn);

module.exports = router;

