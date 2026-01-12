const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const aiService = require("../services/aiService");

// Middleware to authenticate patient
const authenticatePatient = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    req.patient = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// Middleware to authenticate doctor
const authenticateDoctor = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    req.doctor = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// Test AI Connection
router.get('/test', async (req, res) => {
  try {
    const isConnected = await aiService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'AI service is connected' : 'AI service connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing AI connection'
    });
  }
});

// Feature 1: Medical Chatbot
router.post('/chat', authenticatePatient, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('🤖 AI Chat request:', message);

    const aiResponse = await aiService.chatResponse(message);

    res.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response'
    });
  }
});

// Feature 2: Analyze Medical Report
router.post('/analyze-report', authenticatePatient, async (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Report data is required'
      });
    }

    console.log('📊 Analyzing medical report...');

    const analysis = await aiService.analyzeMedicalReport(reportData);

    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Report analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze report'
    });
  }
});

// Feature 3: Calculate Patient Risk Score
router.post('/risk-score/:patientId', authenticateDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log('🎯 Calculating risk score for patient:', patientId);

    // Get patient data
    const getPatientSql = `
      SELECT 
        p.*,
        TIMESTAMPDIFF(YEAR, p.dateOfBirth, CURDATE()) as age
      FROM patients p
      WHERE p.id = ?
    `;

    db.query(getPatientSql, [patientId], async (err, patientResults) => {
      if (err || patientResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const patient = patientResults[0];

      // Get recent diagnoses
      const getRecordsSql = `
        SELECT 
          examination_type,
          diagnosis,
          created_at
        FROM medical_records
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `;

      db.query(getRecordsSql, [patientId], async (recordsErr, records) => {
        if (recordsErr) {
          return res.status(500).json({
            success: false,
            message: 'Error fetching medical records'
          });
        }

        // Get visit count (last 3 months)
        const getVisitCountSql = `
          SELECT COUNT(*) as count
          FROM medical_records
          WHERE patient_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        `;

        db.query(getVisitCountSql, [patientId], async (visitErr, visitResults) => {
          if (visitErr) {
            return res.status(500).json({
              success: false,
              message: 'Error fetching visit count'
            });
          }

          // Prepare data for AI
          const patientData = {
            age: patient.age,
            medicalHistory: patient.medicalHistory,
            allergies: patient.allergies,
            recentDiagnoses: records.map(r => ({
              type: r.examination_type,
              diagnosis: r.diagnosis,
              date: r.created_at
            })),
            visitCount: visitResults[0].count
          };

          try {
            const riskAnalysis = await aiService.calculateRiskScore(patientData);

            res.json({
              success: true,
              data: riskAnalysis
            });
          } catch (aiError) {
            console.error('AI Risk Score Error:', aiError);
            res.status(500).json({
              success: false,
              message: 'Failed to calculate risk score'
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Risk score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Feature 4: Generate Medical Insights
router.post('/medical-insights/:patientId', authenticateDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log('💡 Generating medical insights for patient:', patientId);

    // Get patient's medical records
    const getRecordsSql = `
      SELECT 
        mr.examination_type,
        mr.diagnosis,
        mr.prescription,
        mr.created_at,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = ?
      ORDER BY mr.created_at DESC
      LIMIT 20
    `;

    db.query(getRecordsSql, [patientId], async (err, records) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching medical records'
        });
      }

      if (records.length === 0) {
        return res.json({
          success: true,
          insights: 'No medical records available for analysis.'
        });
      }

      const formattedRecords = records.map(r => ({
        date: new Date(r.created_at).toLocaleDateString(),
        examinationType: r.examination_type,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        doctorName: r.doctor_name
      }));

      try {
        const insights = await aiService.generateMedicalInsights(formattedRecords);

        res.json({
          success: true,
          insights: insights
        });
      } catch (aiError) {
        console.error('AI Insights Error:', aiError);
        res.status(500).json({
          success: false,
          message: 'Failed to generate insights'
        });
      }
    });
  } catch (error) {
    console.error('Medical insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;