/**
 * OCR utility for extracting text from image-based PDFs
 * Server-side only
 */

import { createWorker, PSM } from "tesseract.js";

/**
 * Extract text from an image buffer using OCR
 */
export async function extractTextFromPDFImage(
  imageBuffer: Buffer,
  pageNumber: number
): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("OCR can only run on the server");
  }

  try {
    console.log(`Starting OCR for page ${pageNumber}...`);
    const worker = await createWorker("eng"); // English language
    
    // Set OCR parameters for better accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO_OSD, // Automatic page segmentation
    });

    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    console.log(`OCR completed for page ${pageNumber}: ${text.length} characters`);
    return text.trim();
  } catch (error: any) {
    console.error(`Error in OCR for page ${pageNumber}:`, error);
    throw new Error(`OCR failed for page ${pageNumber}: ${error.message}`);
  }
}

/**
 * Convert PDF page to image buffer using canvas
 */
export async function pdfPageToImage(
  page: any,
  scale: number = 2.0
): Promise<Buffer> {
  if (typeof window !== "undefined") {
    throw new Error("PDF to image conversion can only run on the server");
  }

  try {
    const viewport = page.getViewport({ scale });
    
    // Use node-canvas for server-side rendering
    const { createCanvas } = require("canvas");
    const pdfCanvas = createCanvas(viewport.width, viewport.height);
    const context = pdfCanvas.getContext("2d");

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    
    // Convert canvas to PNG buffer
    return pdfCanvas.toBuffer("image/png");
  } catch (error: any) {
    console.error("Error converting PDF page to image:", error);
    throw new Error(`Failed to convert PDF page to image: ${error.message}`);
  }
}

/**
 * Extract text from a PDF stored in Firebase Storage
 * Supports both text-based and image-based PDFs with OCR fallback
 * @param storagePath - Path to the PDF in Firebase Storage
 * @param storage - Optional Firebase Admin Storage instance (if not provided, will initialize)
 */
export async function extractTextFromStoragePDF(
  storagePath: string,
  storage?: any
): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("PDF extraction can only run on the server");
  }

  let storageInstance = storage;
  
  // If storage instance not provided, initialize Firebase Admin
  if (!storageInstance) {
    const { getStorage } = await import("firebase-admin/storage");
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    
    // Initialize Firebase Admin if needed
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        let formattedPrivateKey = privateKey;
        try {
          const parsed = JSON.parse(privateKey);
          if (typeof parsed === "string") {
            formattedPrivateKey = parsed;
          }
        } catch {
          // Not JSON, use as-is
        }
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
        formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    storageInstance = getStorage();
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^gs:\/\//, "") || "";
  if (!bucketName) {
    throw new Error("Firebase Storage bucket not configured");
  }
  const bucket = storageInstance.bucket(bucketName);
  const file = bucket.file(storagePath);

  // Check if file exists
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`PDF file not found at path: ${storagePath}. Please upload the Student Resource Book PDF to Firebase Storage at this path.`);
  }

  // Download PDF as buffer
  let buffer: Buffer;
  try {
    [buffer] = await file.download();
    console.log(`Downloaded PDF: ${storagePath}, size: ${buffer.length} bytes`);
  } catch (error: any) {
    if (error.code === 404) {
      throw new Error(`PDF file not found at path: ${storagePath}. Please upload the Student Resource Book PDF to Firebase Storage.`);
    }
    throw new Error(`Failed to download PDF from storage: ${error.message}`);
  }

  let fullExtractedText = "";
  let textExtractionSuccessful = false;

  // --- Attempt 1: pdf-parse (fastest for text-based PDFs) ---
  try {
    // Use eval to bypass webpack transformation, similar to pdf-parser-server.ts
    let pdfParseModule: any;
    try {
      pdfParseModule = eval('require')("pdf-parse");
    } catch (e) {
      pdfParseModule = require("pdf-parse");
    }
    
    // pdf-parse can be a function or a class
    let data: any;
    if (typeof pdfParseModule === "function") {
      data = await pdfParseModule(buffer);
    } else if (pdfParseModule.default && typeof pdfParseModule.default === "function") {
      data = await pdfParseModule.default(buffer);
    } else {
      throw new Error("pdf-parse module is not callable");
    }
    
    if (data && data.text && data.text.trim().length > 100) {
      fullExtractedText = data.text;
      textExtractionSuccessful = true;
      console.log(`pdf-parse extracted ${fullExtractedText.length} characters.`);
    } else {
      console.warn(`pdf-parse extracted insufficient text (${data?.text?.length || 0} chars), trying fallback.`);
    }
  } catch (error: any) {
    console.warn("pdf-parse failed:", error.message, "Trying alternative method.");
  }

  // --- Attempt 2: Use pdf-parser-server utility (more reliable) ---
  if (!textExtractionSuccessful) {
    try {
      const { parsePDF } = await import("@/lib/utils/pdf-parser-server");
      const extractedText = await parsePDF(buffer);
      if (extractedText && extractedText.trim().length > 100) {
        fullExtractedText = extractedText;
        textExtractionSuccessful = true;
        console.log(`pdf-parser-server extracted ${fullExtractedText.length} characters.`);
      } else {
        console.warn(`pdf-parser-server extracted insufficient text (${extractedText?.length || 0} chars).`);
      }
    } catch (error: any) {
      console.warn("pdf-parser-server failed:", error.message);
    }
  }

  // --- Attempt 3: Try pdfjs-dist for text extraction ---
  if (!textExtractionSuccessful) {
    try {
      console.log("[PDF-OCR] Trying pdfjs-dist for text extraction...");
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      
      let extractedText = "";
      const numPages = Math.min(pdf.numPages, 50); // Limit to first 50 pages for performance
      console.log(`[PDF-OCR] Processing ${numPages} pages with pdfjs-dist...`);
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          extractedText += pageText + "\n";
        } catch (pageError: any) {
          console.warn(`[PDF-OCR] Error extracting text from page ${pageNum}:`, pageError.message);
        }
      }
      
      if (extractedText && extractedText.trim().length > 100) {
        fullExtractedText = extractedText;
        textExtractionSuccessful = true;
        console.log(`[PDF-OCR] pdfjs-dist extracted ${fullExtractedText.length} characters.`);
      } else {
        console.warn(`[PDF-OCR] pdfjs-dist extracted insufficient text (${extractedText?.length || 0} chars).`);
      }
    } catch (error: any) {
      console.warn("[PDF-OCR] pdfjs-dist failed:", error.message);
    }
  }

  // --- Attempt 4: OCR fallback for image-based PDFs (only try first few pages to avoid timeout) ---
  if (!textExtractionSuccessful) {
    try {
      console.log("[PDF-OCR] Text extraction failed, trying OCR on first few pages...");
      console.log("[PDF-OCR] ⚠️  OCR is slow - only processing first 3 pages to avoid timeout");
      
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      
      let ocrText = "";
      const pagesToProcess = Math.min(pdf.numPages, 3); // Only first 3 pages for OCR to avoid timeout
      
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          console.log(`[PDF-OCR] Processing page ${pageNum}/${pagesToProcess} with OCR...`);
          const page = await pdf.getPage(pageNum);
          const imageBuffer = await pdfPageToImage(page, 2.0);
          const pageText = await extractTextFromPDFImage(imageBuffer, pageNum);
          ocrText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        } catch (pageError: any) {
          console.warn(`[PDF-OCR] OCR failed for page ${pageNum}:`, pageError.message);
        }
      }
      
      if (ocrText && ocrText.trim().length > 50) {
        fullExtractedText = ocrText;
        textExtractionSuccessful = true;
        console.log(`[PDF-OCR] OCR extracted ${fullExtractedText.length} characters from ${pagesToProcess} pages.`);
        console.log(`[PDF-OCR] ⚠️  Note: Only first ${pagesToProcess} pages were processed. For full extraction, use the pre-extraction script.`);
      } else {
        console.warn(`[PDF-OCR] OCR extracted insufficient text (${ocrText?.length || 0} chars).`);
      }
    } catch (error: any) {
      console.warn("[PDF-OCR] OCR fallback failed:", error.message);
    }
  }

  if (!fullExtractedText || fullExtractedText.trim().length === 0) {
    console.error("[PDF-OCR] All extraction methods failed. PDF might be corrupted, password-protected, or contain only images without text.");
    throw new Error("Failed to extract any meaningful text from PDF using all methods (text extraction and OCR). The PDF might be corrupted, password-protected, or contain only images without text. For large image-based PDFs, please use the pre-extraction script: npx ts-node scripts/extract-srb-text.ts");
  }

  console.log(`[PDF-OCR] Successfully extracted ${fullExtractedText.length} characters from PDF`);
  return fullExtractedText.trim();
}
