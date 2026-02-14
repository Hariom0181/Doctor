const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all devices and their status
router.get('/devices', (req, res) => {
  try {
    const query = `
      SELECT 
        device_id,
        device_name,
        is_online,
        last_heartbeat,
        current_metric_type,
        battery_level,
        firmware_version
      FROM esp32_devices
      ORDER BY device_id
    `;

    db.query(query, (err, devices) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Database error' 
        });
      }

      res.json({
        success: true,
        data: devices || []
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single device status
router.get('/devices/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const query = `
      SELECT * FROM esp32_devices 
      WHERE device_id = ?
    `;

    db.query(query, [deviceId], (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Database error' 
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Device not found' 
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;