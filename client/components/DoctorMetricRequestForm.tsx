// client/components/DoctorMetricRequestForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface LinkedPatient {
  id: number;
  name: string;
  age: number;
}

interface MetricValue {
  value: string;
  unit: string;
  metricId: number;
}

const getToken = () => localStorage.getItem('DoctorToken');

export default function DoctorMetricRequestForm() {
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [metricType, setMetricType] = useState('temperature');
  const [deviceId, setDeviceId] = useState('ESP32_TEMP_001');
  const [fetchingPatients, setFetchingPatients] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'requested' | 'received' | 'confirmed'>('idle');
  const [metricValue, setMetricValue] = useState<MetricValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);

  const metricOptions = [
    { value: 'temperature', label: 'Temperature Sensor' },
    { value: 'heart_rate', label: 'Heart Rate' },
    { value: 'blood_pressure', label: 'Blood Pressure' },
    { value: 'oxygen_level', label: 'Oxygen Level' }
  ];

  const deviceOptions = [
    { value: 'ESP32_TEMP_001', label: 'Temperature Device 1' },
    { value: 'ESP32_PULSE_001', label: 'Pulse Sensor 1' }
  ];

  useEffect(() => {
    fetchPatients();
    loadDeviceStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDeviceStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPatients = async () => {
    try {
      setFetchingPatients(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please login first.');
        setFetchingPatients(false);
        return;
      }

      console.log('🔐 Fetching patients with token...');

      const response = await fetch(`${API_BASE_URL}/doctors/linked-patients`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError('Unauthorized. Please login again.');
        setFetchingPatients(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const patients = result.data || [];
      setLinkedPatients(patients);
      if (patients.length > 0) {
        setSelectedPatientId(patients[0].id.toString());
      }

      console.log('✓ Loaded', patients.length, 'patients');
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(`Failed to load patients: ${err.message}`);
    } finally {
      setFetchingPatients(false);
    }
  };

  const loadDeviceStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDevices(result.data || []);
        console.log('✓ Devices loaded:', result.data);
      }
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const handleRequestMetric = async () => {
    if (!selectedPatientId) {
      setError('Please select a patient');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }

      console.log('📤 Requesting metric for patient', selectedPatientId);

      const response = await fetch(`${API_BASE_URL}/health-metrics-iot/request-metric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: parseInt(selectedPatientId),
          metric_type: metricType,
          device_id: deviceId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request metric');
      }

      const data = await response.json();
      setRequestId(data.request_id);
      setStatus('requested');
      console.log('✓ Request created:', data.request_id);
      pollForResponse(data.request_id);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const pollForResponse = (reqId: string) => {
    let pollCount = 0;
    const maxPolls = 15;

    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`⏳ Polling ${pollCount}/${maxPolls}...`);

      try {
        const token = getToken();
        if (!token) {
          clearInterval(pollInterval);
          setError('Token expired');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/health-metrics-iot/request/${reqId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log(`⏳ Still waiting... (${pollCount}s)`);
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setError('Device response timeout. Please try again.');
            setStatus('idle');
          }
          return;
        }

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (data.value) {
          console.log('✓ Device response received!');
          setStatus('received');
          setMetricValue({
            value: data.value,
            unit: data.unit || '',
            metricId: data.id
          });
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('❌ Polling error:', err);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setStatus('idle');
        }
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      if (status === 'requested') {
        setError('Device response timeout. Please try again.');
        setStatus('idle');
      }
    }, 30000);
  };

  const handleApproveMetric = async () => {
    if (!metricValue) return;

    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/health-metrics-iot/approve-metric/${metricValue.metricId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve');
      }

      console.log('✓ Metric approved');
      setStatus('confirmed');
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = async () => {
    if (!metricValue) return;

    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/health-metrics-iot/retake/${metricValue.metricId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to request retake');
      }

      console.log('✓ Retake requested');
      setStatus('idle');
      setMetricValue(null);
      setRequestId(null);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setMetricValue(null);
    setRequestId(null);
    setError(null);
  };

  if (fetchingPatients) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading patients...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (linkedPatients.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 ml-2">
              {error || 'No linked patients found'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request Health Metric Reading</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {status === 'idle' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Patient</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linkedPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name} (Age: {patient.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Metric Type</label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Device</label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceOptions.map(opt => {
                    const device = devices.find(d => d.device_id === opt.value);
                    const statusIcon = device?.is_online ? '🟢' : '🔴';
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        {statusIcon} {opt.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRequestMetric}
              disabled={loading || !selectedPatientId}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Request Metric Reading'
              )}
            </Button>
          </div>
        )}

        {status === 'requested' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 font-medium">Waiting for device response...</p>
            <p className="text-sm text-gray-500 mt-2">Request ID: {requestId}</p>
            <p className="text-xs text-gray-400 mt-1">Up to 30 seconds</p>
          </div>
        )}

        {status === 'received' && metricValue && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 ml-2">
                Reading received from device
              </AlertDescription>
            </Alert>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {metricOptions.find(m => m.value === metricType)?.label}
                </p>
                <p className="text-4xl font-bold text-blue-700">
                  {metricValue.value}
                  <span className="text-xl ml-2">{metricValue.unit}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleApproveMetric}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  '✓ Confirm & Save'
                )}
              </Button>
              <Button
                onClick={handleRetake}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                ↻ Retake
              </Button>
            </div>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 ml-2">
                ✓ Metric saved
              </AlertDescription>
            </Alert>

            {metricValue && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Recorded:</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metricValue.value} {metricValue.unit}
                </p>
              </div>
            )}

            <Button
              onClick={handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Request Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}