const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "7d", // adjust expiration as needed
  });
};

module.exports = { generateToken };