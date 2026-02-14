// backend/routes/healthMetricsRoute.js (IoT System)
const express = require('express');
const router = express.Router();
const healthMetricsController = require('../controllers/healthMetricsController');
const db = require('../config/db');

// Middleware to authenticate doctor
const authenticateDoctor = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = require('jsonwebtoken').verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );

    req.user = decoded;
    req.doctor = decoded;
    next();
  } catch (error) {
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