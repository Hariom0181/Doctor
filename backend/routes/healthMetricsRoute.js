// backend/routes/healthMetricsRoute.js (IoT System)
const express = require('express');
const router = express.Router();
const healthMetricsController = require('../controllers/healthMetricsController');
const db = require('../config/db');

// Middleware to authenticate doctor
const authenticateDoctor = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'MISSING');
    
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token in header');
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    console.log('✓ Token found, verifying...');

    const decoded = require('jsonwebtoken').verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );

    console.log('✓ Token valid, doctor_id:', decoded.id);

    req.user = decoded;
    req.doctor = decoded;
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token',
      details: error.message
    });
  }
};

// ============ DOCTOR AUTHENTICATED ROUTES ============
router.post('/request-metric', authenticateDoctor, healthMetricsController.requestMetric);
router.get('/request/:requestId', authenticateDoctor, healthMetricsController.getRequestStatus);
router.post('/approve-metric/:requestId', authenticateDoctor, healthMetricsController.approveMetric);
router.get('/patient/:patientId', authenticateDoctor, healthMetricsController.getPatientMetrics);
router.post('/retake/:metricId', authenticateDoctor, healthMetricsController.requestRetake);

module.exports = router;