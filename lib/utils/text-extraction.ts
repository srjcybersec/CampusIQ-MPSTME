/**
 * Extract text from various file types
 */

export async function extractTextFromFile(
  file: File,
  buffer: Buffer
): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  console.log(`Extracting text - Extension: ${fileExtension}, MIME: ${mimeType}, Size: ${buffer.length} bytes`);

  try {
    // PDF files
    if (fileExtension === "pdf" || mimeType === "application/pdf") {
      console.log("Detected PDF file, extracting text...");
      const text = await extractTextFromPDF(buffer);
      console.log(`PDF extraction complete: ${text.length} characters`);
      return text;
    }

    // DOCX files
    if (
      fileExtension === "docx" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log("Detected DOCX file, extracting text...");
      const text = await extractTextFromDOCX(buffer);
      console.log(`DOCX extraction complete: ${text.length} characters`);
      return text;
    }

    // Plain text files
    if (
      fileExtension === "txt" ||
      mimeType === "text/plain" ||
      mimeType.startsWith("text/")
    ) {
      console.log("Detected text file, reading content...");
      const text = buffer.toString("utf-8");
      console.log(`Text file read: ${text.length} characters`);
      return text;
    }

    // For other file types, return empty string
    console.warn(`Unsupported file type: ${fileExtension} (${mimeType})`);
    return "";
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return "";
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use the server-only PDF parser
    const { parsePDF } = await import("./pdf-parser-server");
    return await parsePDF(buffer);
  } catch (error: any) {
    console.error("Error parsing PDF with pdf-parse:", error);
    // If pdf-parse fails, try pdfjs-dist as fallback
    try {
      console.log("Trying pdfjs-dist as fallback...");
      // Use dynamic import for pdfjs-dist
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      const numPages = Math.min(pdf.numPages, 10); // Limit to 10 pages
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
      
      return fullText.trim();
    } catch (fallbackError) {
      console.error("Both PDF parsing methods failed:", fallbackError);
      return "";
    }
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Use mammoth library for DOCX with require (works better in server-side Next.js)
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    // Fallback: return empty string
    return "";
  }
}
