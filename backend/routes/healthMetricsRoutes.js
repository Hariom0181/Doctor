const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get latest metrics for patient
router.get("/latest/:patientId", (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT * FROM patient_health_metrics
    WHERE patient_id = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching metrics"
      });
    }

    res.json({
      success: true,
      data: results[0] || null
    });
  });
});

// Get metrics history
router.get("/history/:patientId", (req, res) => {
  const { patientId } = req.params;
  const limit = req.query.limit || 50;

  const sql = `
    SELECT * FROM patient_health_metrics
    WHERE patient_id = ?
    ORDER BY recorded_at DESC
    LIMIT ?
  `;

  db.query(sql, [patientId, parseInt(limit)], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching history"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

module.exports = router;