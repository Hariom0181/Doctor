import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, Power, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VirtualHealthDeviceProps {
  patientId: number;
  onMetricsUpdate?: () => void;
}

export function VirtualHealthDevice({ patientId, onMetricsUpdate }: VirtualHealthDeviceProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState({
    heartRate: 0,
    bloodPressure: "0/0",
    weight: "0",  // Change to string
    spO2: 0
  });
  // 🔄 FOR REAL ESP32: Remove this simulation, ESP32 will send real sensor data
  const generateRealisticMetrics = () => {
    return {
      heartRate: Math.floor(Math.random() * (85 - 60 + 1)) + 60, // 60-85 bpm
      bloodPressure: `${Math.floor(Math.random() * (130 - 110 + 1)) + 110}/${Math.floor(Math.random() * (85 - 70 + 1)) + 70}`,
      weight: (Math.random() * (80 - 60) + 60).toFixed(1), // 60-80 kg
      spO2: Math.floor(Math.random() * (99 - 95 + 1)) + 95 // 95-99%
    };
  };

  const sendMetricsToBackend = async (metrics: any) => {
    try {
      // 🔌 FOR REAL ESP32: This is the EXACT endpoint ESP32 will call
      // ESP32 code will do: http.POST("http://192.168.1.X:5000/api/health-metrics/device-update")
      
      const response = await fetch('http://localhost:5000/api/health-metrics/device-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 🔒 FOR REAL ESP32: Add device token header
          // 'X-Device-Token': 'YOUR_DEVICE_SECRET'
        },
        body: JSON.stringify({
          patientId: patientId,
          heartRate: parseInt(metrics.heartRate),
          bloodPressure: metrics.bloodPressure,
          weight: parseFloat(metrics.weight),
          spO2: parseInt(metrics.spO2)
          // 🔑 FOR REAL ESP32: Add deviceToken in body
          // deviceToken: 'YOUR_DEVICE_SECRET'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send metrics');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending metrics:', error);
      return false;
    }
  };

  // Auto-send metrics every 30 seconds when connected
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConnected) {
      // 📡 FOR REAL ESP32: ESP32 will send data on its own interval
      // This useEffect won't be needed - ESP32 loop() handles timing
      
      interval = setInterval(async () => {
        setIsSending(true);
        const metrics = generateRealisticMetrics(); // 🔄 FOR REAL ESP32: This will be replaced by actual sensor readings
        setCurrentMetrics(metrics);

        const success = await sendMetricsToBackend(metrics);
        
        if (success) {
          console.log('✅ Metrics sent:', metrics);
          onMetricsUpdate?.();
        } else {
          toast({
            title: "Connection Lost",
            description: "Failed to send metrics to server",
            variant: "destructive"
          });
          setIsConnected(false);
        }

        setIsSending(false);
      }, 5000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, patientId]);

  const handleConnect = () => {
    // 🔌 FOR REAL ESP32: This button won't exist
    // ESP32 auto-connects when powered on and WiFi is configured
    
    setIsConnected(true);
    toast({
      title: "Device Connected",
      description: "Virtual health monitor is now active"
    });

    // Send first reading immediately
    const metrics = generateRealisticMetrics();
    setCurrentMetrics(metrics);
    sendMetricsToBackend(metrics);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Device Disconnected",
      description: "Virtual health monitor stopped"
    });
  };

  return (
    <Card className={isConnected ? "border-green-500" : "border-gray-300"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Virtual Health Monitor
              {/* 🔌 FOR REAL ESP32: Change title to "ESP32 Health Monitor" */}
            </CardTitle>
            <CardDescription>
              Simulated IoT device for real-time metrics
              {/* 🔌 FOR REAL ESP32: Change to "Connected ESP32 device with sensors" */}
            </CardDescription>
          </div>
          <Badge className={isConnected ? "bg-green-600" : "bg-gray-400"}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Device ID:</span>
            <span className="font-mono">SIM-{patientId.toString().padStart(4, '0')}</span>
            {/* 🔌 FOR REAL ESP32: Show real MAC address or device serial */}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Update Interval:</span>
            <span>30 seconds</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={isConnected ? "text-green-600 font-medium" : "text-gray-500"}>
              {isSending ? "Sending..." : isConnected ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Current Readings */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Heart Rate</p>
              <p className="text-2xl font-bold text-blue-600">{currentMetrics.heartRate}</p>
              <p className="text-xs text-gray-500">bpm</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Blood Pressure</p>
              <p className="text-2xl font-bold text-red-600">{currentMetrics.bloodPressure}</p>
              <p className="text-xs text-gray-500">mmHg</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Weight</p>
              <p className="text-2xl font-bold text-green-600">{currentMetrics.weight}</p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">SpO2</p>
              <p className="text-2xl font-bold text-purple-600">{currentMetrics.spO2}</p>
              <p className="text-xs text-gray-500">%</p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={handleConnect} className="flex-1">
              <Power className="w-4 h-4 mr-2" />
              Connect Device
            </Button>
            /* 🔌 FOR REAL ESP32: Remove this button - device auto-connects */
          ) : (
            <>
              <Button onClick={handleDisconnect} variant="outline" className="flex-1">
                <Power className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
              <Button 
                onClick={() => {
                  const metrics = generateRealisticMetrics();
                  setCurrentMetrics(metrics);
                  sendMetricsToBackend(metrics);
                }}
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Simulation Mode:</strong> This virtual device generates realistic health readings 
            every 30 seconds to demonstrate IoT integration.
            {/* 🔌 FOR REAL ESP32: Change to "Real ESP32 device with MAX30102 + HX711 sensors" */}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}