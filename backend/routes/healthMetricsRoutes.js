const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ FOR REAL ESP32: This endpoint stays the same!
// ESP32 will POST to: http://YOUR_LOCAL_IP:5000/api/health-metrics/device-update

router.post("/device-update", async (req, res) => {
  try {
    const { patientId, deviceToken, heartRate, bloodPressure, weight, spO2 } = req.body;

    // 🔒 FOR REAL ESP32: Add device authentication
    // if (deviceToken !== process.env.DEVICE_SECRET) {
    //   return res.status(401).json({ success: false, message: "Invalid device" });
    // }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required"
      });
    }

    // Save to database
    const sql = `
      INSERT INTO patient_health_metrics 
      (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, 
       weight, spo2, recorded_at, source)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    // Parse blood pressure "120/80"
    const [systolic, diastolic] = bloodPressure ? bloodPressure.split('/').map(Number) : [null, null];

    db.query(
      sql,
      [patientId, heartRate, systolic, diastolic, weight, spO2, 'device'],
      (err, result) => {
        if (err) {
          console.error("Error saving health metrics:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to save metrics"
          });
        }

        console.log(`✅ Health metrics saved for patient ${patientId}`);
        res.json({
          success: true,
          message: "Metrics saved successfully",
          metricId: result.insertId
        });
      }
    );

  } catch (error) {
    console.error("Device update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

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