const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all devices and their status
router.get('/', (req, res) => {  // Changed from '/devices' to '/'
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
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error' 
        });
      }
      
      console.log('📊 Raw devices from DB:', devices);
      
      const formattedDevices = devices.map(device => ({
        ...device,
        is_online: Boolean(device.is_online)
      }));
      
      console.log('✓ Formatted devices:', formattedDevices);
      
      res.json({
        success: true,
        data: formattedDevices || []
      });
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single device status
router.get('/:deviceId', (req, res) => {  // Changed from '/devices/:deviceId' to '/:deviceId'
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
      
      const device = {
        ...results[0],
        is_online: Boolean(results[0].is_online)
      };
      
      res.json({
        success: true,
        data: device
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