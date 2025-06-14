const axios = require("axios");

// Custom error class for Gemini API errors
class GeminiApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
    this.details = details;
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to extract LaTeX from response
const extractLatexFromResponse = (rawContent) => {
  const latexRegex = /```latex\s*([\s\S]*?)\s*```/;
  const match = rawContent.match(latexRegex);
  const latexContent = match ? match[1].trim() : rawContent.trim();

  if (!latexContent.includes("\\documentclass")) {
    throw new Error("Extracted content is missing \\documentclass");
  }
  if (!latexContent.includes("\\begin{document}")) {
    throw new Error("Extracted content is missing \\begin{document}");
  }
  if (!latexContent.includes("\\end{document}")) {
    throw new Error("Extracted content is missing \\end{document}");
  }
  // if (!latexContent.includes("\\resumeSubheading") && latexContent.includes("Education")) {
  //   throw new Error("Extracted content is missing required \\resumeSubheading command for sections");
  // }

  return latexContent;
};

const generateLatexCode = async (latexTemplate, resumeContent) => {
  if (!latexTemplate || typeof latexTemplate !== "string") {
    throw new Error("Invalid or missing LaTeX template");
  }
  if (!resumeContent || typeof resumeContent !== "object") {
    throw new Error("Invalid or missing resume content");
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables");
  }

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
  const prompt = `
    You are an expert in LaTeX and professional resume creation. Given a reference LaTeX template and structured resume data, generate complete, valid LaTeX code that produces a polished, professional resume PDF. The output must strictly follow the template's document class, packages, custom commands, and styling (e.g., margins, fonts, spacing). Use only the provided data without adding placeholders for missing information. Wrap the output in \`\`\`latex ... \`\`\` with no additional text outside the code block.

    **Reference LaTeX Template**:
    ${latexTemplate}

    **Resume Data (JSON)**:
    ${JSON.stringify(resumeContent, null, 2)}

    **Instructions**:
    - Generate a complete LaTeX document starting with \\documentclass[letterpaper,11pt]{article} and ending with \\end{document}.
    - Include all packages from the template: latexsym, fullpage, titlesec, marvosym, color, verbatim, enumitem, hyperref, fancyhdr, babel, tabularx, glyphtounicode.
    - Use the template's custom commands (e.g., \\resumeSubheading, \\resumeItem, \\resumeProjectHeading, \\resumeSubSubheading, \\resumeItemListStart, \\resumeItemListEnd) exactly as defined.
    - Structure the resume with the following sections, in order:
      1. **Header**:
         - Center the name in large, bold font (\\textbf{\\Large ...}).
         - Include contact info (phone, email, LinkedIn, GitHub) using \\Mobilefone, \\Email, \\href, etc., formatted as in the template.
         - Use provided data (name, phone, email). If LinkedIn or GitHub are missing, do not include them.
      
      2. **Summary**:
         - Add a new section "Summary" immediately after the header.
         - Use the summary field from the JSON data.
         - Format using \\section*{Summary} and appropriate paragraph formatting.
      
      3. **Education**:
         - Use \\resumeSubheading for each entry with institution, location, degree, and duration.
         - Use only provided data (education array). If completely missing, omit this section.
      
      4. **Experience**:
         - Use \\resumeSubheading for each job with job title, duration, company, location, and \\resumeItem for responsibilities in a \\resumeItemListStart/End block.
         - Include the provided responsibilities exactly as they appear in the JSON, maintaining the ATS-optimized action verbs and metrics.
         - If experience data is completely missing, omit this section.
      
      5. **Projects**:
         - Use \\resumeProjectHeading for each project with project name, technologies, duration, and \\resumeItem for description points.
         - Include the expanded, detailed project descriptions exactly as provided in the JSON.
         - If projects data is completely missing, omit this section.
      
      6. **Technical Skills**:
         - Format as a single \\item with \\textbf{Languages}, \\textbf{Frameworks}, \\textbf{Developer Tools}, \\textbf{Libraries}.
         - You can in languages, framework, developer tools or libraries by yourself if that specific content is missing. But generate related to the skills given by user.
         - If no skills data is available, omit this categorization.
      
      7. **Soft Skills**:
         - Include only if soft_skills array is provided with data.
         - List using \\resumeItem in a \\resumeItemListStart/End block.
      
      8. **Certifications**:
         - Include only if certifications array is provided with data.
         - Use \\resumeSubSubheading with name and year.
      
      9. **Languages**:
         - Use only provided data (languages array).
         - List using \\resumeItem.
         - If language data is completely missing, omit this section.
      
      10. **Publications**:
         - Include only if publications array is provided with data.
         - Use \\resumeSubSubheading with name, year, and link.
    
    - **Data Handling**:
      - Use ONLY the provided data from the JSON, mapping fields to the appropriate sections.
      - Do NOT add placeholders or make assumptions about missing data.
      - If a section has no data, omit that section entirely rather than creating placeholder content.
    
    - **Professional Quality**:
      - Maintain the ATS-optimized content with strong action verbs and quantifiable metrics from the JSON.
      - Use proper LaTeX formatting: \\vspace, \\smallskip, \\item, etc., as per the template.
      - Escape special characters (e.g., &, %, #, _) as \\&, \\%, \\#, \\_.
    
    - **Output Format**:
      - Output only the LaTeX code wrapped in \`\`\`latex ... \`\`\`, with no additional text, comments, or explanations.
      - Ensure the document is complete and compilable without truncation.
`;

  // const prompt = `
  //   You are an expert in LaTeX and professional resume creation. Given a reference LaTeX resume template and structured resume data, generate complete, valid LaTeX code that produces a polished, professional resume PDF. The output must strictly follow the template's document class, packages, custom commands, and styling (e.g., margins, fonts, spacing). Fill in the provided data, infer missing data with realistic placeholders, and include extra sections only if data is provided. Wrap the output in \`\`\`latex ... \`\`\` with no additional text outside the code block.

  //   **Reference LaTeX Template**:
  //   ${latexTemplate}

  //   **Resume Data (JSON)**:
  //   ${JSON.stringify(resumeContent, null, 2)}

  //   **Instructions**:
  //   - Generate a complete LaTeX document starting with \\documentclass[letterpaper,11pt]{article} and ending with \\end{document}.
  //   - Include all packages from the template: latexsym, fullpage, titlesec, marvosym, color, verbatim, enumitem, hyperref, fancyhdr, babel, tabularx, glyphtounicode.
  //   - Use the template's custom commands (e.g., \\resumeSubheading, \\resumeItem, \\resumeProjectHeading, \\resumeSubSubheading, \\resumeItemListStart, \\resumeItemListEnd) exactly as defined.
  //   - Structure the resume with the following sections, in order:
  //     1. **Header**:
  //        - Center the name in large, bold font (\\textbf{\\Large ...}).
  //        - Include contact info (phone, email, LinkedIn, GitHub) using \\Mobilefone, \\Email, \\href, etc., formatted as in the template.
  //        - Use provided data (name, phone, email). If LinkedIn or GitHub are missing, omit them.
  //     2. **Education**:
  //        - Use \\resumeSubheading for each entry with institution, location, degree, and duration.
  //        - Use provided data (education array). If missing, add a placeholder: e.g., "University of Example, City, State -- B.S. in Computer Science, 2019-2023".
  //     3. **Experience**:
  //        - Use \\resumeSubheading for each job with job title, duration, company, location, and \\resumeItem for responsibilities in a \\resumeItemListStart/End block.
  //        - Use provided data (job_title, job_description). Map job_title to the job title and job_description to responsibilities.
  //        - If missing, infer one entry based on job_title (e.g., if job_title is "Software Engineer", add: "Software Engineer, 2023-Present, Tech Corp, New York, NY" with responsibilities like "Developed scalable web applications.").
  //        - Responsibilities should be concise, professional, and relevant (2-3 bullet points).
  //     4. **Projects**:
  //        - Use \\resumeProjectHeading for each project with project name, technologies, duration, and \\resumeItem for description points.
  //        - Use provided data (projects array). If missing, add a placeholder: e.g., "Personal Portfolio, HTML/CSS/JavaScript, 2023, Built a responsive portfolio website."
  //     5. **Technical Skills**:
  //        - Format as a single \\item with \\textbf{Languages}, \\textbf{Frameworks}, \\textbf{Developer Tools}, \\textbf{Libraries}.
  //        - Use provided data (skills array) under Languages. If frameworks, tools, or libraries are missing, add placeholders (e.g., Frameworks: "React", Developer Tools: "Git", Libraries: "NumPy").
  //     6. **Soft Skills** (optional):
  //        - Include only if soft_skills array is provided.
  //        - List using \\resumeItem in a \\resumeItemListStart/End block.
  //        - Example: "Communication", "Teamwork".
  //     7. **Certifications** (optional):
  //        - Include only if certifications array is provided.
  //        - Use \\resumeSubSubheading with name and year.
  //        - Example: "AWS Certified Developer -- 2021".
  //     8. **Languages**:
  //        - Use provided data (languages array).
  //        - List using \\resumeItem.
  //        - If missing, add a placeholder: "English".
  //     9. **Publications** (optional):
  //        - Include only if publications array is provided.
  //        - Use \\resumeSubSubheading with name, year, and link.
  //        - Example: "Healthcare Innovations, 2023, \\href{https://example.com}{Link}".
  //   - **Data Handling**:
  //     - Use all provided data from the JSON, mapping fields to the appropriate sections.
  //     - If a required section (e.g., Education, Experience, Technical Skills) is missing, infer realistic placeholder data to ensure a complete resume.
  //     - For optional sections (Soft Skills, Certifications, Publications), include them only if data is provided in the JSON.
  //   - **Professional Quality**:
  //     - Ensure content is concise, relevant, and professional (e.g., job responsibilities should reflect typical duties for the role).
  //     - Use proper LaTeX formatting: \\vspace, \\smallskip, \\item, etc., as per the template.
  //     - Escape special characters (e.g., &, %, #, _) as \\&, \\%, \\#, \\_.
  //   - **Output Format**:
  //     - Output only the LaTeX code wrapped in \`\`\`latex ... \`\`\`, with no additional text, comments, or explanations.
  //     - Ensure the document is complete and compilable without truncation.

  //   **Example Output**:
  //   \`\`\`latex
  //   \\documentclass[letterpaper,11pt]{article}
  //   \\usepackage{latexsym}
  //   \\usepackage[empty]{fullpage}
  //   ...
  //   \\begin{document}
  //   \\textbf{\\Large John Doe} \\\\
  //   \\vspace{1pt}
  //   \\smallskip
  //   \\Mobilefone \\hspace{1pt} +1-123-456-7890 \\hspace{10pt} \\Email \\hspace{1pt} john.doe@example.com
  //   \\section*{Education}
  //   \\resumeSubheading{MIT}{Cambridge, MA}{B.S. in Computer Science}{2018-2022}
  //   \\section*{Experience}
  //   \\resumeSubheading{Software Engineer}{2022-Present}{Tech Corp}{New York, NY}
  //   \\resumeItemListStart
  //   \\resumeItem{Developed scalable web applications.}
  //   \\resumeItem{Optimized database queries for performance.}
  //   \\resumeItemListEnd
  //   \\section*{Technical Skills}
  //   \\resumeItemListStart
  //   \\item \\textbf{Languages}: Python, JavaScript \\hspace{5pt} \\textbf{Frameworks}: React \\hspace{5pt} \\textbf{Developer Tools}: Git, Docker
  //   \\resumeItemListEnd
  //   \\section*{Languages}
  //   \\resumeItemListStart
  //   \\resumeItem{English}
  //   \\resumeItemListEnd
  //   \\end{document}
  //   \`\`\`
  // `;

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.post(
        geminiApiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7
          }
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new GeminiApiError(
          "Invalid response from Gemini API: Missing expected content",
          response.status,
          response.data
        );
      }

      const rawReply = response.data.candidates[0].content.parts[0].text.trim();
      console.log("Gemini Raw Reply:\n", rawReply);

      let latexCode;
      try {
        latexCode = extractLatexFromResponse(rawReply);
      } catch (error) {
        throw new GeminiApiError(
          "Failed to extract valid LaTeX code from Gemini response",
          response.status,
          { rawReply, error: error.message }
        );
      }

      console.log("Gemini API response processed successfully");
      return latexCode;

    } catch (error) {
      attempt++;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (errorData?.error?.message?.includes("maxOutputTokens")) {
          throw new GeminiApiError(
            "Gemini API rejected maxOutputTokens value; try a lower value",
            status,
            { errorData, maxOutputTokens: 8192 }
          );
        }

        if (status === 429 || (status >= 500 && status < 600)) {
          if (attempt >= MAX_RETRIES) {
            throw new GeminiApiError(
              `Gemini API failed after ${MAX_RETRIES} retries: ${error.message}`,
              status,
              errorData
            );
          }
          console.warn(`Retry ${attempt}/${MAX_RETRIES} due to ${status} error: ${error.message}`);
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }

        throw new GeminiApiError(
          `Gemini API request failed: ${error.message}`,
          status,
          errorData
        );
      }

      if (error instanceof GeminiApiError) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw new GeminiApiError(
          `Failed to generate LaTeX code after ${MAX_RETRIES} retries: ${error.message}`,
          null,
          error
        );
      }

      console.warn(`Retry ${attempt}/${MAX_RETRIES} due to error: ${error.message}`);
      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  throw new GeminiApiError("Unexpected error in retry loop", null, null);
};

module.exports = { generateLatexCode };