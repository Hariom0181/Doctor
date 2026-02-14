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
const IOThealthmetrics = require('./routes/healthMetricsRoutes')
const cron = require('node-cron');




const db = require("./config/db");


dotenv.config();
// Test Gemini API Key on startup
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'EXISTS ✅' : 'MISSING ❌');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/patients_profile', express.static(path.join(__dirname, 'uploads/patients_profile')));
app.use('/uploads/doctors_profile', express.static(path.join(__dirname, 'uploads/doctors_profile')));
app.use("/api/appointments", appointmentRoutes);
app.use("/api/documents", documentRoutes);
app.use('/uploads/patient_documents', express.static(path.join(__dirname, 'uploads/patient_documents')));
app.use('/api/video-consultations', videoConsultationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/health-metrics',IOThealthmetrics);


// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/dashboard", dashboardRoutes); 
app.use('/api/wallet', walletRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use('/api/ai', aiRoutes);



// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


cron.schedule('*/1 * * * *', async () => {
  // console.log('🔍 Checking for expired appointments...');
  
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