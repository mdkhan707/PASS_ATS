require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./auth_api/src/config/db");
const resumeRoutes = require('./auth_api/src/routes/resumeroutes'); // Import resume routes
const bodyParser = require('body-parser');
const templateRoutes = require('./auth_api/src/routes/templates_routes'); // Import template routes
const path = require('path');


// Initialize Express App
const app = express();

// Middleware
app.use(express.json()); // Parse JSON
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Loggernpm install dotenv


// Connect to MongoDB
connectDB();

app.use('/resumes', express.static(path.join(__dirname, 'Resumes')));
// Routes
app.use('/api', templateRoutes);


// Routes
app.use("/api/auth", require("./auth_api/src/routes/authroutes"));
// Use routes
app.use('/api', resumeRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//new congig
require('dotenv').config();
app.use('/api', templateRoutes);
