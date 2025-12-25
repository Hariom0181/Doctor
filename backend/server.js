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

dotenv.config();
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


// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/dashboard", dashboardRoutes); 

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
