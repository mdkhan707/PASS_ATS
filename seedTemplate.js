// const fs = require("fs");
// const path = require("path");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const Template = require("./auth_api/src/models/template_model"); // Adjust the path as necessary

// // Load .env variables
// dotenv.config();

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const resumesFolder = path.join(__dirname, "Resumes");

// const runSeeder = async () => {
//   try {
//     const files = fs.readdirSync(resumesFolder);
//     const templates = [];

//     const pngFiles = files.filter((f) => f.endsWith(".png"));

//     pngFiles.forEach((png) => {
//       const baseName = path.parse(png).name;
//       const pdf = baseName + ".pdf";

//       if (files.includes(pdf)) {
//         templates.push({
//           name: baseName,
//           pngUrl: `/resumes/${png}`,
//           pdfUrl: `/resumes/${pdf}`,
//         });
//       }
//     });

//     await Template.deleteMany(); // Optional: clear previous
//     await Template.insertMany(templates);
//     console.log("✅ Templates inserted successfully!");
//     mongoose.disconnect();
//   } catch (err) {
//     console.error("❌ Seeder error:", err);
//     mongoose.disconnect();
//   }
// };

// runSeeder();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Template = require("./auth_api/src/models/template_model");

// Load .env variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

const resumesFolder = path.join(__dirname, "Resumes");

const runSeeder = async () => {
  await connectDB();

  try {
    // Verify folder exists
    if (!fs.existsSync(resumesFolder)) {
      throw new Error(`Resumes folder not found at ${resumesFolder}`);
    }

    const files = fs.readdirSync(resumesFolder);
    console.log("📂 Files in Resumes folder:", files);

    const templates = [];
    // Look for both .jpg and .png files
    const imageFiles = files.filter((f) =>
      f.toLowerCase().match(/\.(jpg|png)$/i)
    );

    for (const img of imageFiles) {
      const baseName = path.parse(img).name;
      const pdf = files.find((f) =>
        f.toLowerCase().startsWith(baseName.toLowerCase()) && f.toLowerCase().endsWith(".pdf")
      );

      templates.push({
        name: baseName,
        pngUrl: `/resumes/${img}`, // Use the actual image extension (jpg or png)
        pdfUrl: pdf ? `/resumes/${pdf}` : null, // Allow null if no matching PDF
      });
    }

    console.log("📝 Templates to insert:", templates);

    if (templates.length === 0) {
      console.warn("⚠️ No templates found to insert");
    }

    // Clear previous templates
    await Template.deleteMany({});
    console.log("🗑️ Cleared existing templates");

    // Insert new templates
    if (templates.length > 0) {
      await Template.insertMany(templates);
      console.log(`✅ Inserted ${templates.length} templates successfully!`);
    }

    // Verify insertion
    const count = await Template.countDocuments();
    console.log(`📊 Total templates in DB: ${count}`);

  } catch (err) {
    console.error("❌ Seeder error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

runSeeder();