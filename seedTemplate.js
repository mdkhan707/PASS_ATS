const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Template = require("./auth_api/src/models/template_model"); // Adjust the path as necessary

// Load .env variables
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const resumesFolder = path.join(__dirname, "Resumes");

const runSeeder = async () => {
  try {
    const files = fs.readdirSync(resumesFolder);
    const templates = [];

    const pngFiles = files.filter((f) => f.endsWith(".png"));

    pngFiles.forEach((png) => {
      const baseName = path.parse(png).name;
      const pdf = baseName + ".pdf";

      if (files.includes(pdf)) {
        templates.push({
          name: baseName,
          pngUrl: `/resumes/${png}`,
          pdfUrl: `/resumes/${pdf}`,
        });
      }
    });

    await Template.deleteMany(); // Optional: clear previous
    await Template.insertMany(templates);
    console.log("✅ Templates inserted successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Seeder error:", err);
    mongoose.disconnect();
  }
};

runSeeder();
