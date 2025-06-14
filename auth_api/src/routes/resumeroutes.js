const express = require('express');
const router = express.Router();
const groqService = require("../services/groqService");
const geminiService = require("../services/geminiService");
const latexService = require("../services/latexService");
const { readFile } = require("../utils/fileUtils");


const validateInput = (req, res, next) => {
  const {
    name, phone, email, skills, education, languages, job_description, job_title
  } = req.body;

  const missingFields = [];

  if (!name) missingFields.push('name');
  if (!phone) missingFields.push('phone');
  if (!email) missingFields.push('email');
  if (!skills) missingFields.push('skills');
  if (!education?.length) missingFields.push('education');
  if (!languages?.length) missingFields.push('languages');
  if (!job_description) missingFields.push('job_description');
  if (!job_title) missingFields.push('job_title');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: "Missing required fields", 
      missingFields: missingFields 
    });
  }

  next();
};

router.post("/generate", validateInput, async (req, res) => {
  try {2
    const userData = req.body;
    console.log('This is the user data that we are getting from the api: ' + JSON.stringify(userData));


    // Step 1: Generate resume content using Groq
    const resumeContent = await groqService.generateResumeContent(userData);

    // Step 2: Read LaTeX template
    const templatePath = "./templates/4.tex";
    let latexTemplate;
    try {
      latexTemplate = await readFile(templatePath, "utf8");
      console.log("LaTeX Template Content:\n", latexTemplate);
    } catch (error) {
      console.error(`Failed to read LaTeX template at ${templatePath}:`, error.message);
      throw new Error(`Unable to read LaTeX template file: ${error.message}`);
    }

    // Step 3: Generate final LaTeX code using Gemini
    const latexCode = await geminiService.generateLatexCode(latexTemplate, resumeContent);

    // Step 4: Compile LaTeX to PDF and get base64 string
    const pdfBase64 = await latexService.compileLatexToPdf(latexCode, resumeContent.name);

    // Step 5: Return the PDF as base64
    res.json({ pdf: pdfBase64 });

  } catch (error) {
    console.error("Error generating resume:", error);
    res.status(500).json({ message: "Failed to generate resume" ,reason:error });
  }
});


// Route to insert templates (for testing purposes)
router.get('/insert-templates', (req, res) => {
  insertTemplates();
  res.send('Templates inserted!');
});



module.exports = router;
