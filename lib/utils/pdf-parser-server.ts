/**
 * Server-only PDF parsing utility
 * This file uses require directly and should not be imported on the client
 */

export async function parsePDF(buffer: Buffer): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("PDF parsing can only run on the server");
  }

  // Use require directly - this works in Node.js/Next.js server environment
  // pdf-parse should be callable directly, but webpack might transform it
  // Try to get the actual function from the module
  let pdfParseModule: any;
  
  try {
    // Use eval to bypass webpack's module transformation
    pdfParseModule = eval('require')("pdf-parse");
  } catch (e) {
    // Fallback to normal require
    pdfParseModule = require("pdf-parse");
  }
  
  // pdf-parse exports PDFParse as a class in newer versions
  // Try using it as a class first, then fallback to function call
  try {
    const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
    
    // Check if it's a class (has prototype.constructor)
    if (PDFParseClass && PDFParseClass.prototype && PDFParseClass.prototype.constructor === PDFParseClass) {
      // It's a class - instantiate it
      const parser = new PDFParseClass({ data: buffer });
      const result = await parser.getText();
      return result.text || "";
    }
    // Otherwise try calling it as a function (older versions)
    else if (typeof PDFParseClass === "function") {
      const data = await PDFParseClass(buffer);
      return data.text || "";
    }
    // If module itself is callable
    else if (typeof pdfParseModule === "function") {
      const data = await pdfParseModule(buffer);
      return data.text || "";
    }
    else {
      throw new Error(`PDFParse is not callable. Type: ${typeof PDFParseClass}`);
    }
  } catch (error: any) {
    // If class instantiation fails, try direct function call
    if (error.message?.includes("cannot be invoked without 'new'")) {
      // It's definitely a class, use new
      const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule.default;
      const parser = new PDFParseClass({ data: buffer });
      const result = await parser.getText();
      return result.text || "";
    }
    throw error;
  }
}
