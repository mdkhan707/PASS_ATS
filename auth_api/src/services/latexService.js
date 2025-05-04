const latex = require("node-latex");
const fs = require("fs-extra");
const path = require("path");
const stream = require("stream");
const { execSync } = require("child_process");

// Custom error class for LaTeX compilation errors
class LatexCompilationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "LatexCompilationError";
    this.details = details;
  }
}

const compileLatexToPdf = async (latexCode, userName) => {
  const outputDir = path.join(__dirname, "../../Resumes");
  const tempDir = path.join(outputDir, `temp_${Date.now()}`);

  try {
    // Validate inputs
    if (!latexCode || typeof latexCode !== "string") {
      throw new LatexCompilationError("Invalid or missing LaTeX code", { latexCode });
    }
    if (!userName || typeof userName !== "string") {
      throw new LatexCompilationError("Invalid or missing user name", { userName });
    }

    // Check if pdflatex is available
    try {
      execSync("pdflatex --version", { stdio: "ignore" });
    } catch (err) {
      throw new LatexCompilationError("pdflatex is not installed or not in PATH", {
        error: err.message,
        suggestion: "Install MiKTeX or TeX Live and ensure pdflatex is in the system PATH"
      });
    }

    // Create temporary directory for node-latex intermediate files
    await fs.ensureDir(tempDir);

    // Create a writable stream to capture PDF data in memory
    const pdfBuffers = [];
    const output = new stream.Writable({
      write(chunk, encoding, callback) {
        pdfBuffers.push(chunk);
        callback();
      }
    });

    // Compile LaTeX to PDF using node-latex with string input
    const latexOptions = {
      cmd: process.env.LATEX_COMMAND || "pdflatex",
      passes: 1, // Use 1 pass to avoid stream issues; set to 2 if needed
      workdir: tempDir,
      errorLogs: path.join(tempDir, "latex_errors.log") // Save pdflatex logs
    };
    const pdf = latex(latexCode, latexOptions);

    // Pipe the PDF output to our writable stream
    pdf.pipe(output);

    // Handle errors and completion
    const pdfPromise = new Promise((resolve, reject) => {
      pdf.on("error", (err) => {
        // Include a snippet of latexCode for debugging (first 200 characters)
        const codeSnippet = latexCode.substring(0, 200) + (latexCode.length > 200 ? "..." : "");
        // Read pdflatex log file if it exists
        let logContent = "No log file generated";
        try {
          logContent = fs.readFileSync(latexOptions.errorLogs, "utf8");
        } catch (logErr) {
          console.warn("Failed to read pdflatex log file:", logErr.message);
        }
        reject(new LatexCompilationError("Failed to compile LaTeX to PDF", {
          error: err.message,
          codeSnippet,
          pdflatexLog: logContent
        }));
      });

      pdf.on("finish", () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);
        if (pdfBuffer.length === 0) {
          reject(new LatexCompilationError("Generated PDF is empty", { pdfBufferLength: 0 }));
        }
        const pdfBase64 = pdfBuffer.toString("base64");
        resolve(pdfBase64);
      });
    });

    // Wait for compilation to complete and get base64 string
    const pdfBase64 = await pdfPromise;

    // Clean up temporary directory
    await fs.remove(tempDir).catch((err) => {
      console.warn(`Failed to clean up temporary directory ${tempDir}:`, err.message);
    });

    console.log("PDF generated successfully for user:", userName);
    return pdfBase64;

  } catch (error) {
    // Clean up temporary directory on error
    await fs.remove(tempDir).catch((err) => {
      console.warn(`Failed to clean up temporary directory ${tempDir}:`, err.message);
    });

    // Re-throw custom error or wrap generic error
    if (error instanceof LatexCompilationError) {
      throw error;
    }
    throw new LatexCompilationError("Unexpected error during LaTeX compilation", { error: error.message });
  }
};

module.exports = { compileLatexToPdf };