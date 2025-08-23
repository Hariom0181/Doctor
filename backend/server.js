const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);


// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
