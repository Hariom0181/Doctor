// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const dotenv = require('dotenv');

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const walletRoutes = require('./routes/walletRoutes');
const videoConsultationRoutes = require('./routes/videoConsultationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const IOThealthmetrics = require('./routes/healthMetricsRoute');
const healthMetricsRoutes = require('./routes/healthMetricsRoutes');
const deviceStatusRoutes = require('./routes/deviceStatusRoutes');  // ONLY HERE
const cron = require('node-cron');




const db = require("./config/db");

dotenv.config();

console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'EXISTS ✅' : 'MISSING ❌');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/patients_profile', express.static(path.join(__dirname, 'uploads/patients_profile')));
app.use('/uploads/doctors_profile', express.static(path.join(__dirname, 'uploads/doctors_profile')));
app.use('/uploads/patient_documents', express.static(path.join(__dirname, 'uploads/patient_documents')));

// ============ DEVICE STATUS ROUTE (FIRST) ============
app.use('/api/devices', deviceStatusRoutes);

// ============ DIRECT IoT ENDPOINTS (No Auth Required) ============
app.post('/api/health-metrics-iot/device-heartbeat', (req, res) => {
  try {
    const { device_id, is_online, battery_level, firmware_version } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'device_id required' 
      });
    }

    const query = `
      INSERT INTO esp32_devices (device_id, is_online, last_heartbeat, battery_level, firmware_version)
      VALUES (?, ?, NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE
        is_online = VALUES(is_online),
        last_heartbeat = NOW(),
        battery_level = VALUES(battery_level),
        firmware_version = VALUES(firmware_version)
    `;

    db.query(
      query,
      [device_id, is_online ? 1 : 0, battery_level || null, firmware_version || null],
      (err) => {
        if (err) {
          console.error('❌ Heartbeat error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to update device status' 
          });
        }

        console.log('✓ Heartbeat received from', device_id);
        res.json({ 
          success: true, 
          message: 'Heartbeat received' 
        });
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/health-metrics-iot/confirm-metric', (req, res) => {
  try {
    const { request_id, metric_type, value, unit, device_id } = req.body;

    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'request_id required'
      });
    }

    console.log('✓ Metric received from device:', device_id);
    console.log('  Request ID:', request_id);
    console.log('  Value:', value, unit);

    // First, find the metric_request to get patient_id and doctor_id
    const findQuery = `
      SELECT * FROM metric_requests 
      WHERE request_data LIKE ?
    `;

    db.query(findQuery, [`%${request_id}%`], (err, results) => {
      if (err) {
        console.error('❌ Database error finding request:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to find request'
        });
      }

      if (results.length === 0) {
        console.error('❌ Request not found:', request_id);
        return res.status(404).json({
          success: false,
          error: 'Request not found'
        });
      }

      const request = results[0];
      console.log('✓ Found request - Patient:', request.patient_id, 'Doctor:', request.doctor_id);

      // Now insert into patient_health_metrics with correct patient_id and doctor_id
      const insertQuery = `
        INSERT INTO patient_health_metrics 
        (patient_id, doctor_id, metric_type, value, unit, status, device_id, request_id)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `;

      db.query(
        insertQuery,
        [request.patient_id, request.doctor_id, metric_type, value, unit, device_id, request_id],
        (err, result) => {
          if (err) {
            console.error('❌ Database error inserting metric:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to store metric'
            });
          }

          console.log('✓ Metric stored in database, ID:', result.insertId);
          res.json({
            success: true,
            metric_id: result.insertId,
            message: 'Metric received from device'
          });
        }
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============ OTHER ROUTES ============
app.use('/api/health-metrics-iot', IOThealthmetrics);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/documents", documentRoutes);
app.use('/api/video-consultations', videoConsultationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/agora', agoraRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health-metrics', healthMetricsRoutes);

// ============ START SERVER ============
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
app.get('/', (req, res) => {
  res.json({ message: 'Backend is reachable' });
});
// ============ CRON JOB ============
cron.schedule('*/1 * * * *', async () => {
  const sql = `
    UPDATE video_consultations 
    SET status = 'expired',
        updated_at = NOW()
    WHERE status IN ('confirmed', 'pending')
    AND CONCAT(scheduled_date, ' ', scheduled_time) < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error expiring appointments:', err);
    } else if (result.affectedRows > 0) {
      console.log(`✅ Expired ${result.affectedRows} appointments`);
    }
  });
});

cron.schedule('0 0 * * *', () => {
  const sql = `UPDATE prescriptions SET status = 'completed' WHERE end_date < CURDATE()`;
  db.query(sql, (err) => {
    if (err) console.error('Auto-expire error:', err);
    else console.log('✅ Expired old prescriptions');
  });
});


