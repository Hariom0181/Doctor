const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { uploadDocument, cloudinary } = require("../config/cloudinary");
const path = require('path');
const multer = require('multer'); 


const storageMemory = multer.memoryStorage();
const uploadMemory = multer({ 
    storage: storageMemory,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});



// Upload patient document
// Upload patient document to Cloudinary
router.post("/upload", uploadDocument.single("document"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = req.file.secure_url; // ✅ ALWAYS exists

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed (no file URL)"
      });
    }

    const {
      patientId,
      documentType,
      documentDate,
      hospitalName,
      notes
    } = req.body;

    const sql = `
      INSERT INTO patient_documents
      (patient_id, document_type, document_name, file_path, document_date, hospital_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        patientId,
        documentType,
        req.file.originalname,
        fileUrl,            // ✅ FIXED
        documentDate,
        hospitalName,
        notes
      ],
      (err, result) => {
        if (err) {
          console.error("Error saving document:", err);
          return res.status(500).json({ success: false, message: "Error saving document" });
        }

        res.status(201).json({
          success: true,
          documentId: result.insertId,
          filePath: fileUrl
        });
      }
    );

  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ success: false, message: "Document upload failed" });
  }
});




// tract text from document using Google Vision API
// Extract text from Cloudinary document
router.post("/extract-text/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    const sql = "SELECT file_path, document_name FROM patient_documents WHERE id = ?";
    
    db.query(sql, [documentId], async (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching document"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Document not found"
        });
      }

      const cloudinaryUrl = results[0].file_path; // This is Cloudinary URL
      const fileExt = path.extname(results[0].document_name).toLowerCase();

      // Fetch file from Cloudinary
      const axios = require('axios');
      const response = await axios.get(cloudinaryUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data);
      const base64Data = fileData.toString('base64');

      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      let mimeType;
      if (fileExt === '.pdf') mimeType = 'application/pdf';
      else if (fileExt === '.png') mimeType = 'image/png';
      else if (['.jpg', '.jpeg'].includes(fileExt)) mimeType = 'image/jpeg';
      else mimeType = 'image/gif';

      const result = await model.generateContent([
        "Extract all text and values from this medical report. Return the complete data in a structured format.",
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const aiResponse = await result.response;
      const extractedText = aiResponse.text();

      res.json({
        success: true,
        extractedText: extractedText,
        documentName: results[0].document_name
      });
    });

  } catch (error) {
    console.error("Text extraction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error extracting text"
    });
  }
});
// Get patient's documents
router.get("/patient/:patientId", (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      id,
      document_type,
      document_name,
      file_path,
      document_date,
      hospital_name,
      notes,
      uploaded_at
    FROM patient_documents
    WHERE patient_id = ?
    ORDER BY document_date DESC, uploaded_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("Error fetching documents:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching documents"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});
// Extract text WITHOUT saving to database (for analysis only)
// Extract text WITHOUT saving (for AI analysis)
router.post("/extract-only", uploadMemory.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Access buffer directly from memory
    const fileBuffer = req.file.buffer;
    const base64Data = fileBuffer.toString('base64');
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Determine Mime Type
    let mimeType;
    if (fileExt === '.pdf') mimeType = 'application/pdf';
    else if (fileExt === '.png') mimeType = 'image/png';
    else if (['.jpg', '.jpeg'].includes(fileExt)) mimeType = 'image/jpeg';
    else return res.status(400).json({ success: false, message: "Unsupported file format" });

    // Initialize Gemini
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Recommend 1.5-flash for speed/pdf

    const result = await model.generateContent([
      "Extract all text and key medical values from this medical report. Return the data in a clean, structured text format.",
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const aiResponse = await result.response;
    const extractedText = aiResponse.text();

    res.json({
      success: true,
      extractedText: extractedText
    });

  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process document. Ensure the file is a readable PDF or Image."
    });
  }
});
// Delete document
// Delete document from Cloudinary
router.delete("/:documentId", async (req, res) => {
  const { documentId } = req.params;

  const getFileSql = "SELECT file_path FROM patient_documents WHERE id = ?";
  
  db.query(getFileSql, [documentId], async (err, results) => {
    if (err) {
      console.error("Error fetching document:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching document"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const cloudinaryUrl = results[0].file_path;
    
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/patient_documents/file_name.jpg
    const publicIdMatch = cloudinaryUrl.match(/\/patient_documents\/([^\.]+)/);
    const publicId = publicIdMatch ? `patient_documents/${publicIdMatch[1]}` : null;

    // Delete from database first
    const deleteSql = "DELETE FROM patient_documents WHERE id = ?";
    
    db.query(deleteSql, [documentId], async (deleteErr) => {
      if (deleteErr) {
        console.error("Error deleting document:", deleteErr);
        return res.status(500).json({
          success: false,
          message: "Error deleting document"
        });
      }

      // Delete from Cloudinary
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (cloudinaryErr) {
          console.error("Error deleting from Cloudinary:", cloudinaryErr);
          // Continue even if Cloudinary delete fails
        }
      }

      res.json({
        success: true,
        message: "Document deleted successfully"
      });
    });
  });
});

module.exports = router;