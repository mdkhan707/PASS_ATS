const axios = require("axios");

// Custom error class for Groq API errors
class GroqApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "GroqApiError";
    this.status = status;
    this.details = details;
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to extract JSON from Markdown response
const extractJsonFromResponse = (rawContent) => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = rawContent.match(jsonRegex);
  if (!match || !match[1]) {
    throw new Error("Failed to extract JSON from response: No JSON block found");
  }
  return match[1].trim();
};

// Function to sanitize JSON content by fixing invalid escape sequences
const sanitizeJsonContent = (jsonContent) => {
  // Replace invalid LaTeX escape sequences (e.g., \\%) with the correct character (%)
  return jsonContent
    .replace(/\\%/g, "%") // Fix \\% to %
    .replace(/\\&/g, "&") // Fix \\& to &
    .replace(/\\#/g, "#"); // Fix \\# to #
};

const generateResumeContent = async (userData) => {
  // console.log("This is the user data getting from the api:" + userData);
  if (!userData || typeof userData !== "object") {
    throw new Error("Invalid or missing user data");
  }
  const requiredFields = ["name", "phone", "email", "skills", "education", "languages", "job_description", "job_title"];
  const missingFields = requiredFields.filter(field => !userData[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured in environment variables");
  }

  const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
  const prompt = `
    You are an expert in resume creation focusing on ATS optimization. Given the user data and job description, generate a detailed, professional JSON object for a resume tailored to the job title: "${userData.job_title || "N/A"}". Ensure the output is comprehensive, utilizing only provided data without creating placeholders or assumptions.

    **User Data**:
    - Name: ${userData.name || "N/A"}
    - Phone: ${userData.phone || "N/A"}
    - Email: ${userData.email || "N/A"}
    - LinkedIn: ${userData.linkedin || "N/A"}
    - GitHub: ${userData.github || "N/A"}
    - Skills: ${(userData.skills || []).join(", ") || "N/A"}
    - Education: ${JSON.stringify(userData.education || [])}
    - Experience: ${JSON.stringify(userData.experience || [])}
    - Projects: ${JSON.stringify(userData.projects || [])}
    - Soft Skills: ${(userData.soft_skills || []).join(", ") || "N/A"}
    - Certifications: ${JSON.stringify(userData.certifications || [])}
    - Languages: ${(userData.languages || []).join(", ") || "N/A"}
    - Publications: ${JSON.stringify(userData.publications || [])}
    - Job Description: ${userData.job_description || "N/A"}

    **Instructions**:
    - Output a JSON object wrapped in \`\`\`json ... \`\`\` with the following structure:
      {
        "name": "",
        "phone": "",
        "email": "",
        "linkedin": "",
        "github": "",
        "summary": "",
        "skills": [],
        "education": [{ "institution_name": "", "major": "", "duration": "", "location": "" }],
        "experience": [{ "company_name": "", "job_title": "", "duration": "", "location": "", "responsibilities": [] }],
        "projects": [{ "project_name": "", "description": "", "project_link": "", "technologies": "", "duration": "" }],
        "soft_skills": [],
        "certifications": [{ "certification_name": "", "year": "" }],
        "languages": [],
        "publications": [{ "publication_name": "", "year_published": "", "publication_link": "" }]
      }
    
    - **Data Handling**:
      - Use ONLY provided data where available (e.g., name, phone, email, skills, education, languages).
      - Do NOT add placeholders or make assumptions about missing data - if a field is "N/A" or empty, leave it as an empty string or array in the output.
      - If a section has no data (e.g., publications), include it as an empty array in the output.
    
    - **Summary Section**:
      - Create a professional summary paragraph (3-5 sentences) that highlights the candidate's expertise, years of experience, key skills, and career objectives.
      - Tailor this summary to the job description, emphasizing skills and experiences that match the job requirements.
      - Use language that positions the candidate as an ideal fit for the target role.
      - Do not include specific personal details beyond professional characteristics relevant to the job.
    
    - **ATS Optimization**:
      - Format all experience and project responsibilities using strong action verbs (e.g., Developed, Implemented, Orchestrated, Reduced, Increased).
      - Include quantifiable results with metrics where possible (e.g., "increased efficiency by 30%", "reduced costs by $50K", "improved response time by 25%").
      - For each project, provide detailed descriptions that showcase technical skills mentioned in the job description.
      - Expand project descriptions to include: problem addressed, approach taken, technologies used, challenges overcome, and measurable outcomes.
    
    - **Professional Quality**:
      - Ensure all data is realistic, professional, and tailored to the job title.
      - For experience, include 3-5 detailed responsibilities per job that demonstrate impact and relevance to the target role.
      - Use industry-specific terminology from the job description to improve ATS matching.
      - Do NOT apply LaTeX escaping. Output valid JSON with unescaped characters.
    
    - Output only the JSON object wrapped in \`\`\`json ... \`\`\`, with no additional text.
`;




  // const prompt = `
  //   You are an expert in resume creation. Given the user data and job description, generate a detailed, professional JSON object for a resume tailored to the job title: "${userData.job_title || "N/A"}". Ensure the output is comprehensive, filling in all required sections with meaningful data, even if some user data is missing, by inferring realistic placeholders.

  //   **User Data**:
  //   - Name: ${userData.name || "N/A"}
  //   - Phone: ${userData.phone || "N/A"}
  //   - Email: ${userData.email || "N/A"}
  //   - LinkedIn: ${userData.linkedin || "N/A"}
  //   - GitHub: ${userData.github || "N/A"}
  //   - Skills: ${(userData.skills || []).join(", ") || "N/A"}
  //   - Education: ${JSON.stringify(userData.education || [])}
  //   - Experience: ${JSON.stringify(userData.experience || [])}
  //   - Projects: ${JSON.stringify(userData.projects || [])}
  //   - Soft Skills: ${(userData.soft_skills || []).join(", ") || "N/A"}
  //   - Certifications: ${JSON.stringify(userData.certifications || [])}
  //   - Languages: ${(userData.languages || []).join(", ") || "N/A"}
  //   - Publications: ${JSON.stringify(userData.publications || [])}
  //   - Job Description: ${userData.job_description || "N/A"}

  //   **Instructions**:
  //   - Output a JSON object wrapped in \`\`\`json ... \`\`\` with the following structure:
  //     {
  //       "name": "",
  //       "phone": "",
  //       "email": "",
  //       "linkedin": "",
  //       "github": "",
  //       "skills": [],
  //       "education": [{ "institution_name": "", "major": "", "duration": "", "location": "" }],
  //       "experience": [{ "company_name": "", "job_title": "", "duration": "", "location": "", "responsibilities": [] }],
  //       "projects": [{ "project_name": "", "description": "", "project_link": "", "technologies": "", "duration": "" }],
  //       "soft_skills": [],
  //       "certifications": [{ "certification_name": "", "year": "" }],
  //       "languages": [],
  //       "publications": [{ "publication_name": "", "year_published": "", "publication_link": "" }]
  //     }
  //   - **Data Handling**:
  //     - Use provided data where available (e.g., name, phone, email, skills, education, languages).
  //     - If fields are missing or "N/A", infer realistic placeholders:
  //       - linkedin: "linkedin.com/in/[lowercase-name-no-spaces]" (e.g., "linkedin.com/in/johndoe").
  //       - github: "github.com/[lowercase-name-no-spaces]" (e.g., "github.com/johndoe").
  //       - education: If empty, add a placeholder: [{"institution_name": "University of Example", "major": "Computer Science", "duration": "2018-2022", "location": "City, State"}].
  //       - experience: If empty, infer from job_title and job_description. Example: For job_title "Software Engineer" and job_description "Seeking a Software Engineer", add [{"company_name": "Tech Innovate Inc.", "job_title": "Software Engineer", "duration": "2022-Present", "location": "New York, NY", "responsibilities": ["Developed scalable web applications using React and Node.js.", "Optimized database queries in PostgreSQL, reducing query time by 30%.", "Collaborated with cross-functional teams to deliver projects on time."]}].
  //       - projects: If empty, add a placeholder: [{"project_name": "Personal Portfolio", "description": "A responsive portfolio website showcasing projects and skills.", "project_link": "https://example.com/portfolio", "technologies": "HTML, CSS, JavaScript", "duration": "2023"}].
  //       - soft_skills: If empty, add placeholders: ["Communication", "Teamwork", "Problem-Solving"].
  //       - certifications: Include only if provided; otherwise, leave empty: [].
  //       - publications: Include only if provided; otherwise, leave empty: [].
  //   - **Professional Quality**:
  //     - Ensure all inferred data is realistic, professional, and tailored to the job title.
  //     - For experience, include 3-5 detailed responsibilities per job, reflecting typical duties for the role.
  //     - For projects, include a meaningful description, relevant technologies, and a realistic duration.
  //     - Do NOT apply LaTeX escaping (e.g., do not replace %, &, # with \\%, \\&, \\#). Output valid JSON with unescaped characters as they should appear in a resume.
  //   - Output only the JSON object wrapped in \`\`\`json ... \`\`\`, with no additional text.

  //   **Example Output**:
  //   \`\`\`json
  //   {
  //     "name": "John Doe",
  //     "phone": "+1-123-456-7890",
  //     "email": "john.doe@example.com",
  //     "linkedin": "linkedin.com/in/johndoe",
  //     "github": "github.com/johndoe",
  //     "skills": ["Python", "JavaScript", "SQL"],
  //     "education": [
  //       {
  //         "institution_name": "MIT",
  //         "major": "Computer Science",
  //         "duration": "2018-2022",
  //         "location": "Cambridge, MA"
  //       }
  //     ],
  //     "experience": [
  //       {
  //         "company_name": "Tech Innovate Inc.",
  //         "job_title": "Software Engineer",
  //         "duration": "2022-Present",
  //         "location": "New York, NY",
  //         "responsibilities": [
  //           "Developed scalable web applications using React and Node.js.",
  //           "Optimized database queries in PostgreSQL, reducing query time by 30%.",
  //           "Collaborated with cross-functional teams to deliver projects on time."
  //         ]
  //       }
  //     ],
  //     "projects": [
  //       {
  //         "project_name": "Personal Portfolio",
  //         "description": "A responsive portfolio website showcasing projects and skills.",
  //         "project_link": "https://example.com/portfolio",
  //         "technologies": "HTML, CSS, JavaScript",
  //         "duration": "2023"
  //       }
  //     ],
  //     "soft_skills": ["Communication", "Teamwork"],
  //     "certifications": [],
  //     "languages": ["English"],
  //     "publications": []
  //   }
  //   \`\`\`
  // `;

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.post(
        groqApiUrl,
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          // max_tokens: 8192,
          // temperature: "0.7"
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new GroqApiError(
          "Invalid response from Groq API: Missing expected content",
          response.status,
          response.data
        );
      }

      const rawContent = response.data.choices[0].message.content.trim();
      console.log('This is the response of the Groq API:\n' + rawContent);

      let jsonContent;
      try {
        jsonContent = extractJsonFromResponse(rawContent);
      } catch (error) {
        throw new GroqApiError(
          error.message,
          response.status,
          { rawContent }
        );
      }

      // Sanitize JSON content to fix any invalid escape sequences
      jsonContent = sanitizeJsonContent(jsonContent);

      let resumeContent;
      try {
        resumeContent = JSON.parse(jsonContent);
      } catch (parseError) {
        throw new GroqApiError(
          "Failed to parse extracted JSON from Groq API response",
          response.status,
          { rawContent, jsonContent, parseError }
        );
      }

      const expectedKeys = [
        "name", "phone", "email", "linkedin", "github", "skills",
        "education", "experience", "projects", "soft_skills",
        "certifications", "languages", "publications"
      ];
      const missingKeys = expectedKeys.filter(key => !(key in resumeContent));
      if (missingKeys.length > 0) {
        throw new GroqApiError(
          `Generated resume content missing required keys: ${missingKeys.join(", ")}`,
          response.status,
          { resumeContent }
        );
      }

      console.log("Groq API response processed successfully");
      return resumeContent;

    } catch (error) {
      attempt++;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 429 || (status >= 500 && status < 600)) {
          if (attempt >= MAX_RETRIES) {
            throw new GroqApiError(
              `Groq API failed after ${MAX_RETRIES} retries: ${error.message}`,
              status,
              errorData
            );
          }
          console.warn(`Retry ${attempt}/${MAX_RETRIES} due to ${status} error: ${error.message}`);
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }

        throw new GroqApiError(
          `Groq API request failed: ${error.message}`,
          status,
          errorData
        );
      }

      if (error instanceof GroqApiError) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw new GroqApiError(
          `Failed to generate resume content after ${MAX_RETRIES} retries: ${error.message}`,
          null,
          error
        );
      }

      console.warn(`Retry ${attempt}/${MAX_RETRIES} due to error: ${error.message}`);
      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  throw new GroqApiError("Unexpected error in retry loop", null, null);
};

module.exports = { generateResumeContent };