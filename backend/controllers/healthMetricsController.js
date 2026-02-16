// backend/controllers/healthMetricsController.js
const db = require('../config/db');
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');

let mqttClient = null;

const initializeMQTT = () => {
  if (mqttClient) return mqttClient;

  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

  mqttClient = mqtt.connect(brokerUrl, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  });

  mqttClient.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
    mqttClient.subscribe('esp32/+/response', (err) => {
      if (err) console.error('❌ MQTT subscription error:', err);
      else console.log('✓ Subscribed to device responses');
    });
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT error:', err);
  });

  mqttClient.on('message', (topic, message) => {
    handleDeviceResponse(topic, message);
  });

  return mqttClient;
};

const handleDeviceResponse = (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('📥 Device response received:', data);

    const { request_id, metric_type, value, unit, device_id } = data;

    if (!request_id) {
      console.error('❌ No request_id in device response');
      return;
    }

    // Parse request_data TEXT field (it's stored as JSON string)
    const findQuery = `
      SELECT * FROM metric_requests 
      WHERE request_data LIKE ?
    `;

    db.query(findQuery, [`%${request_id}%`], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return;
      }

      if (results.length === 0) {
        console.error('❌ Request not found:', request_id);
        return;
      }

      const request = results[0];

      const updateRequestQuery = `
        UPDATE metric_requests 
        SET request_status = 'in_progress', device_response_time = NOW()
        WHERE id = ?
      `;

      db.query(updateRequestQuery, [request.id], (err) => {
        if (err) {
          console.error('❌ Error updating request:', err);
          return;
        }

        // Insert into patient_health_metrics with pending status
        const insertMetricQuery = `
        INSERT INTO patient_health_metrics 
        (request_id, patient_id, doctor_id, metric_type, value, unit, status, device_id)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      `;

        db.query(
          insertMetricQuery,
          [request_id, request.patient_id, request.doctor_id, metric_type, value, unit, device_id],
          (err, result) => {
            if (err) {
              console.error('❌ Error inserting metric:', err);
              return;
            }

            console.log('✓ Metric stored in database, ID:', result.insertId);
          }
        );
      });
    });
  } catch (error) {
    console.error('❌ Error parsing device response:', error);
  }
};

// ============ CONTROLLER METHODS ============

exports.requestMetric = async (req, res) => {
  try {
    const { patient_id, metric_type, device_id } = req.body;
    const doctor_id = req.user?.id || req.doctor?.id;

    if (!patient_id || !metric_type || !device_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patient_id, metric_type, device_id'
      });
    }

    if (!doctor_id) {
      return res.status(401).json({
        success: false,
        error: 'Doctor authentication required'
      });
    }

    const request_id = uuidv4();

    // Verify patient is linked to doctor
    const verifyQuery = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
    `;

    db.query(verifyQuery, [patient_id, doctor_id], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Database error during verification'
        });
      }

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Patient is not linked to this doctor'
        });
      }

      // Store request_data as JSON string (since column is TEXT)
      const requestData = JSON.stringify({ request_id });

      const insertQuery = `
        INSERT INTO metric_requests 
        (patient_id, doctor_id, metric_type, device_id, request_status, request_data)
        VALUES (?, ?, ?, ?, 'requested', ?)
      `;

      db.query(
        insertQuery,
        [patient_id, doctor_id, metric_type, device_id, requestData],
        (err, result) => {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to create metric request'
            });
          }

          // Initialize MQTT if needed
          const client = initializeMQTT();

          // Send command to ESP32
          const deviceCommand = {
            action: 'read_metric',
            metric_type: metric_type,
            request_id: request_id,
            timestamp: new Date().toISOString()
          };

          const topic = `esp32/${device_id}/command`;
          const payload = JSON.stringify(deviceCommand);

          client.publish(topic, payload, (err) => {
            if (err) {
              console.error('❌ MQTT publish error:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to send command to device',
                details: err.message
              });
            }

            console.log('✓ Command sent to device:', device_id);
            res.json({
              success: true,
              request_id: request_id,
              message: 'Metric reading requested from device'
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

exports.getRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    console.log('🔍 Looking for request:', requestId);

    const query = `
      SELECT * FROM patient_health_metrics 
      WHERE request_id = ?
      ORDER BY reading_timestamp DESC
      LIMIT 1
    `;

    db.query(query, [requestId], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (results.length === 0) {
        console.log('⏳ No reading found yet');
        return res.status(404).json({ success: false, error: 'No reading found' });
      }

      const metric = results[0];
      console.log('✓ Found metric:', metric);

      res.json({
        success: true,
        id: metric.id,
        request_status: metric.status,
        value: metric.value,
        unit: metric.unit,
        metric_type: metric.metric_type,
        reading_timestamp: metric.reading_timestamp
      });
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.confirmMetric = async (req, res) => {
  try {
    const { request_id, value, unit } = req.body;

    if (!request_id || !value || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const findQuery = `
      SELECT * FROM metric_requests 
      WHERE request_data LIKE ?
    `;

    db.query(findQuery, [`%${request_id}%`], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Request not found'
        });
      }

      const request = results[0];

      const updateRequestQuery = `
        UPDATE metric_requests 
        SET request_status = 'in_progress', device_response_time = NOW()
        WHERE id = ?
      `;

      db.query(updateRequestQuery, [request.id], (err) => {
        if (err) {
          console.error('❌ Error updating request:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to update request'
          });
        }

        const insertMetricQuery = `
          INSERT INTO patient_health_metrics 
          (patient_id, doctor_id, metric_type, value, unit, status, device_id)
          VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `;

        db.query(
          insertMetricQuery,
          [request.patient_id, request.doctor_id, request.metric_type, value, unit, request.device_id],
          (err, result) => {
            if (err) {
              console.error('❌ Error inserting metric:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to store metric'
              });
            }

            res.json({
              success: true,
              metric_id: result.insertId,
              message: 'Metric reading received'
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.approveMetric = async (req, res) => {
  try {
    const { requestId } = req.params;
    const doctor_id = req.user?.id || req.doctor?.id;

    if (!doctor_id) {
      return res.status(401).json({
        success: false,
        error: 'Doctor authentication required'
      });
    }

    const query = `
      UPDATE patient_health_metrics 
      SET status = 'confirmed', confirmed_at = NOW()
      WHERE id = ? AND doctor_id = ?
    `;

    db.query(query, [requestId, doctor_id], (err, result) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Metric not found or unauthorized'
        });
      }

      console.log('✓ Metric confirmed:', requestId);
      res.json({
        success: true,
        message: 'Metric confirmed and saved'
      });
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.getPatientMetrics = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctor_id = req.user?.id || req.doctor?.id;

    const verifyQuery = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ?
    `;

    db.query(verifyQuery, [patientId, doctor_id], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to patient data'
        });
      }

      const query = `
        SELECT * FROM patient_health_metrics 
        WHERE patient_id = ? 
        ORDER BY reading_timestamp DESC
      `;

      db.query(query, [patientId], (err, results) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({
            success: false,
            error: 'Database error'
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.requestRetake = async (req, res) => {
  try {
    const { metricId } = req.params;
    const doctor_id = req.user?.id || req.doctor?.id;

    if (!doctor_id) {
      return res.status(401).json({
        success: false,
        error: 'Doctor authentication required'
      });
    }

    const query = `
      UPDATE patient_health_metrics 
      SET status = 'retake'
      WHERE id = ? AND doctor_id = ?
    `;

    db.query(query, [metricId, doctor_id], (err, result) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Metric not found or unauthorized'
        });
      }

      console.log('✓ Retake requested for metric:', metricId);
      res.json({
        success: true,
        message: 'Retake requested'
      });
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};