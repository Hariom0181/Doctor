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

// // ==================== DOCTOR ENDPOINTS ====================

// // Start new metric reading session
// router.post('/start-session', (req, res) => {
//   const { patientId, metricType } = req.body;
//   const doctorId = 6;

//   // Create session
//   const sessionSql = `
//     INSERT INTO metric_sessions (patient_id, doctor_id, metric_type, status)
//     VALUES (?, ?, ?, 'waiting')
//   `;

//   db.query(sessionSql, [patientId, doctorId, metricType], (err, result) => {
//     if (err) return res.status(500).json({ success: false, message: 'Error creating session' });

//     // Signal ESP32 to start reading
//     const sessionId = result.insertId;
    
//     // Update ESP32 device to "reading" mode
//     const updateDeviceSql = `
//       UPDATE esp32_devices 
//       SET status = 'reading', current_metric_type = ?
//       WHERE device_id = 'ESP32_001'
//     `;

//     db.query(updateDeviceSql, [metricType], (deviceErr) => {
//       if (deviceErr) console.error('Error updating device:', deviceErr);
      
//       res.json({
//         success: true,
//         sessionId: sessionId,
//         message: 'Reading session started'
//       });
//     });
//   });
// });

// // Get current session status
// router.get('/session-status/:sessionId', (req, res) => {
//   const { sessionId } = req.params;

//   const sql = `
//     SELECT ms.*, hm.value, hm.unit, hm.status as metric_status
//     FROM metric_sessions ms
//     LEFT JOIN health_metrics hm ON hm.patient_id = ms.patient_id 
//       AND hm.metric_type = ms.metric_type 
//       AND hm.reading_timestamp >= ms.created_at
//     WHERE ms.id = ?
//     ORDER BY hm.reading_timestamp DESC
//     LIMIT 1
//   `;

//   db.query(sql, [sessionId], (err, results) => {
//     if (err) return res.status(500).json({ success: false });
//     res.json({ success: true, data: results[0] || null });
//   });
// });

// // Confirm reading
// router.post('/confirm-reading/:metricId', (req, res) => {
//   const { metricId } = req.params;

//   const sql = `
//     UPDATE patient_health_metrics
//     SET status = 'confirmed', confirmed_at = NOW()
//     WHERE id = ?
//   `;

//   db.query(sql, [metricId], (err) => {
//     if (err) return res.status(500).json({ success: false });
//     res.json({ success: true });
//   });
// });


// // Request retake
// router.post('/retake/:sessionId', (req, res) => {
//   const { sessionId } = req.params;

//   // Get session details
//   const getSql = `SELECT metric_type FROM metric_sessions WHERE id = ?`;
  
//   db.query(getSql, [sessionId], (err, results) => {
//     if (err || !results.length) return res.status(500).json({ success: false });

//     const metricType = results[0].metric_type;

//     // Signal ESP32 to retake
//     const updateSql = `
//       UPDATE esp32_devices 
//       SET status = 'reading', current_metric_type = ?
//     `;

//     db.query(updateSql, [metricType], (updateErr) => {
//       if (updateErr) return res.status(500).json({ success: false });
//       res.json({ success: true, message: 'Retake initiated' });
//     });
//   });
// });

// // ==================== ESP32 ENDPOINTS ====================

// // ESP32 sends reading data
// router.post('/submit-reading', (req, res) => {
//   const { deviceId, patientId, value, unit } = req.body;

//   // Get active session
//   const sessionSql = `
//     SELECT * FROM metric_sessions
//     WHERE patient_id = ?
//     AND status = 'waiting'
//     ORDER BY created_at DESC
//     LIMIT 1
//   `;

//   db.query(sessionSql, [patientId], (err, sessions) => {
//     if (err || !sessions.length) {
//       return res.status(400).json({ success: false, message: 'No active session' });
//     }

//     const session = sessions[0];

//     const insertSql = `
//       INSERT INTO patient_health_metrics
//       (patient_id, doctor_id, metric_type, value, unit, device_id, status)
//       VALUES (?, ?, ?, ?, ?, ?, 'pending')
//     `;

//     db.query(
//       insertSql,
//       [
//         patientId,
//         session.doctor_id,
//         session.metric_type,
//         value,
//         unit,
//         deviceId
//       ],
//       (insertErr, result) => {
//         if (insertErr) return res.status(500).json({ success: false });

//         // Update session
//         db.query(
//           `UPDATE metric_sessions SET status = 'completed' WHERE id = ?`,
//           [session.id]
//         );

//         // Reset device
//         db.query(
//           `UPDATE esp32_devices SET status = 'idle', current_metric_type = NULL`
//         );

//         res.json({
//           success: true,
//           metricId: result.insertId
//         });
//       }
//     );
//   });
// });


// // ESP32 checks for commands
// router.get('/get-command/:deviceId', (req, res) => {
//   const { deviceId } = req.params;

//   const sql = `SELECT current_metric_type, status FROM esp32_devices WHERE device_id = ?`;

//   db.query(sql, [deviceId], (err, results) => {
//     if (err || !results.length) {
//       return res.json({ command: 'idle', metric: null });
//     }

//     const device = results[0];
    
//     if (device.status === 'reading') {
//       res.json({ 
//         command: 'start_reading', 
//         metric: device.current_metric_type 
//       });
//     } else {
//       res.json({ command: 'idle', metric: null });
//     }
//   });
// });

// router.get("/test", (req, res) => {
//   res.json({ success: true, message: "Health metrics API working" });
// });

// // Heartbeat
// router.post('/heartbeat', (req, res) => {
//   const { deviceId } = req.body;

//   const sql = `
//     INSERT INTO esp32_devices (device_id, last_heartbeat, status)
//     VALUES (?, NOW(), 'online')
//     ON DUPLICATE KEY UPDATE 
//       last_heartbeat = NOW(),
//       status = IF(status = 'offline', 'idle', status)
//   `;

//   db.query(sql, [deviceId], (err) => {
//     if (err) return res.status(500).json({ success: false });
//     res.json({ success: true });
//   });
// });

// module.exports = router;

module.exports = router;