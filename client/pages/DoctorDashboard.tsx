import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { doctorApiService } from '@/services/doctorApi'
import {
  Heart,
  Calendar,
  FileText,
  Pill,
  Activity,
  Phone,
  Download,
  Plus,
  Search,
  Edit,
  Users,
  Stethoscope,
  TestTube,
  Clipboard,
  Bell,
  Settings,
  LogOut,
  User,
  Clock,
  MapPin,
  Save,
  Eye,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Sample doctor data
const doctorData = {
  name: "Dr. Priya Sharma",
  specialization: "General Medicine",
  licenseNumber: "DL-12345-2023",
  hospital: "Primary Health Center",
  email: "dr.priya@healthtrack.gov.in",
  phone: "+91 98765 54321"
};

// Sample patients data that doctor manages
const patientsData = [
  {
    id: "HMS2024001",
    name: "Rajesh Kumar",
    age: 45,
    phone: "+91 98765 43210",
    bloodGroup: "B+",
    lastVisit: "2024-01-15",
    status: "Attention Needed",
    condition: "Hypertension",
    nextAppointment: "2024-04-15"
  },
  {
    id: "HMS2024002",
    name: "Sunita Devi",
    age: 38,
    phone: "+91 98765 43211",
    bloodGroup: "A+",
    lastVisit: "2024-01-12",
    status: "Normal",
    condition: "Regular Checkup",
    nextAppointment: "2024-06-12"
  },
  {
    id: "HMS2024003",
    name: "Mohan Singh",
    age: 52,
    phone: "+91 98765 43212",
    bloodGroup: "O+",
    lastVisit: "2024-01-10",
    status: "Critical",
    condition: "Diabetes Management",
    nextAppointment: "2024-02-10"
  }
];

const todayAppointments = [
  {
    time: "9:00 AM",
    patient: "Rajesh Kumar",
    type: "Follow-up",
    duration: "30 min",
    status: "confirmed"
  },
  {
    time: "10:30 AM",
    patient: "Lakshmi Patel",
    type: "General Checkup",
    duration: "45 min",
    status: "waiting"
  },
  {
    time: "2:00 PM",
    patient: "Suresh Yadav",
    type: "Blood Test Review",
    duration: "15 min",
    status: "pending"
  }
];

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isPatientViewOpen, setIsPatientViewOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [isAddHealthMetricsOpen, setIsAddHealthMetricsOpen] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // Your existing useState declarations


  // ADD THE NEW CODE HERE (all the functions from the artifact)
  const [newHealthMetrics, setNewHealthMetrics] = useState({
    patientId: '',
    metricType: '',
    valueSystolic: '',
    valueDiastolic: '',
    valueNumeric: '',
    unit: '',
    status: 'normal',
    notes: ''
  });

  const [isAddingMetrics, setIsAddingMetrics] = useState(false);

  // Available metric types (NO TEMPERATURE)
  const METRIC_TYPES = [
    { value: 'blood_pressure', label: 'Blood Pressure', requiresBoth: true, unit: 'mmHg' },
    { value: 'blood_sugar', label: 'Blood Sugar', requiresBoth: false, unit: 'mg/dL' },
    { value: 'weight', label: 'Weight', requiresBoth: false, unit: 'kg' },
    { value: 'heart_rate', label: 'Heart Rate', requiresBoth: false, unit: 'bpm' }
  ];
  const formatDate = (dateString) => {
    if (!dateString) return "Not recorded";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Function to add/update health metrics
  const handleAddHealthMetrics = async () => {
    if (!newHealthMetrics.patientId || !newHealthMetrics.metricType) {
      alert('Please select a patient and metric type');
      return;
    }

    const selectedMetricType = METRIC_TYPES.find(m => m.value === newHealthMetrics.metricType);

    // Validate required fields based on metric type
    if (selectedMetricType?.requiresBoth) {
      if (!newHealthMetrics.valueSystolic || !newHealthMetrics.valueDiastolic) {
        alert('Please enter both systolic and diastolic values for blood pressure');
        return;
      }
    } else {
      if (!newHealthMetrics.valueNumeric) {
        alert('Please enter a numeric value');
        return;
      }
    }

    setIsAddingMetrics(true);

    try {
      const token = localStorage.getItem('doctorToken');


      const response = await fetch(
        `http://localhost:5000/api/doctors/patient/${newHealthMetrics.patientId}/health-metrics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            metricType: newHealthMetrics.metricType,
            valueSystolic: Number(newHealthMetrics.valueSystolic) || null,
            valueDiastolic: Number(newHealthMetrics.valueDiastolic) || null,
            valueNumeric: Number(newHealthMetrics.valueNumeric) || null,
            unit: newHealthMetrics.unit || "",
            status: newHealthMetrics.status,
            notes: newHealthMetrics.notes
          })
        }
      );


      const data = await response.json();

      if (data.success) {
        alert(`Health metrics ${data.action} successfully!`);
        setIsAddHealthMetricsOpen(false);

        // Reset form
        setNewHealthMetrics({
          patientId: '',
          metricType: '',
          valueSystolic: '',
          valueDiastolic: '',
          valueNumeric: '',
          unit: '',
          status: 'normal',
          notes: ''
        });

        // Refresh patients list to show updated metrics
        fetchLinkedPatients();
      } else {
        alert(`Error: ${data.message}`);
        console.log("Data being sent to backend:", {
          metricType: newHealthMetrics.metricType,
          valueSystolic: newHealthMetrics.valueSystolic || null,
          valueDiastolic: newHealthMetrics.valueDiastolic || null,
          valueNumeric: newHealthMetrics.valueNumeric || null,
          unit: newHealthMetrics.unit || selectedMetricType?.unit || '',
          status: newHealthMetrics.status,
          notes: newHealthMetrics.notes
        });
        // console.log("Data being sent to backend:", submitData);

      }
    } catch (error) {
      console.error('Error adding health metrics:', error);
      alert('Failed to add health metrics. Please try again.');
    } finally {
      setIsAddingMetrics(false);
    }
  };

  // Function to get health metrics for a specific patient  
  const fetchPatientHealthMetrics = async (patientId) => {
    try {
      const token = localStorage.getItem('doctorToken');

      const response = await fetch(
        `http://localhost:5000/api/doctors/patient/${patientId}/health-metrics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        console.error('Error fetching health metrics:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      return [];
    }
  };

  // REPLACE your existing fetchLinkedPatients function with the new one



  // Fetch linked patients when component mounts
  useEffect(() => {
    fetchLinkedPatients();
  }, []);

  const fetchLinkedPatients = async () => {
    try {
      setIsLoadingPatients(true);
      setPatientsError(null);

      const token = localStorage.getItem('doctorToken');

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`http://localhost:5000/api/doctors/linked-patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Fetch health metrics for each patient
        const patientsWithMetrics = await Promise.all(
          data.data.map(async (patient) => {
            const healthMetrics = await fetchPatientHealthMetrics(patient.id);
            return {
              ...patient,
              healthMetrics: healthMetrics || []
            };
          })
        );

        setLinkedPatients(patientsWithMetrics);
      } else {
        throw new Error(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching linked patients:', error);
      setPatientsError(error.message);
    } finally {
      setIsLoadingPatients(false);
    }
  };


  const [newRecord, setNewRecord] = useState({
    patientId: "",
    type: "",
    diagnosis: "",
    prescription: "",
    nextCheckup: "",
    notes: ""
  });

  const [newMedication, setNewMedication] = useState({
    patientId: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });



  // Helper functions
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientStatus = (patient) => {
    // Customize this logic based on your business rules
    if (patient.medicalHistory && patient.medicalHistory.toLowerCase().includes('critical')) {
      return "Critical";
    } else if (patient.medicalHistory && patient.medicalHistory.toLowerCase().includes('attention')) {
      return "Attention Needed";
    } else {
      return "Normal";
    }
  };

  const getNextAppointmentDate = () => {
    // Generate a future date (you can customize this logic)
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 7); // 7-37 days from now
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "bg-success text-success-foreground";
      case "attention needed": return "bg-warning text-warning-foreground";
      case "critical": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };




  // Validate required fields based on metric type



  const handleAddRecord = async () => {
    try {
      // Validation
      if (!newRecord.patientId || !newRecord.type || !newRecord.diagnosis) {
        alert("Please fill in all required fields (Patient, Examination Type, and Diagnosis)");
        return;
      }

      setIsAddingRecord(true);
      console.log("Adding medical record:", newRecord);

      // Prepare the data for API
      const recordData = {
        patientId: newRecord.patientId,
        type: newRecord.type,
        diagnosis: newRecord.diagnosis,
        prescription: newRecord.prescription || undefined,
        nextCheckup: newRecord.nextCheckup || undefined,
        notes: newRecord.notes || undefined
      };

      // Call the API service
      const addedRecord = await doctorApiService.addMedicalRecord(recordData);

      console.log("✅ Medical record added successfully:", addedRecord);
      alert(`Medical record added successfully for patient ${newRecord.patientId}!`);

      // Reset the form
      setNewRecord({
        patientId: "",
        type: "",
        diagnosis: "",
        prescription: "",
        nextCheckup: "",
        notes: ""
      });

      // Close the dialog
      setIsAddRecordOpen(false);

      // Optional: Refresh any medical records list if you have one displayed
      // await fetchMedicalRecords(); // Uncomment if you have this function

    } catch (error) {
      console.error("❌ Failed to add medical record:", error);
      alert(`Failed to add medical record: ${error.message}`);
    } finally {
      setIsAddingRecord(false);
    }
  };
  const handlePrescribeMedication = () => {
    console.log("Prescribing medication:", newMedication);
    // Here you would typically send this to your backend
    alert(`Medication prescribed successfully for patient ${newMedication.patientId}!`);
    setNewMedication({
      patientId: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    });
    setIsPrescriptionOpen(false);
  };

  const filteredPatients = linkedPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HealthTrack</h1>
                <p className="text-sm text-gray-600">Doctor Portal</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Clicking Dashboard button");
                  setActiveTab("overview");
                }}
                className={`font-medium transition-colors ${activeTab === "overview" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Dashboard
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Clicking Patients button");
                  setActiveTab("patients");
                }}
                className={`font-medium transition-colors ${activeTab === "patients" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Patients
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Clicking Appointments button");
                  setActiveTab("appointments");
                }}
                className={`font-medium transition-colors ${activeTab === "appointments" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Appointments
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Clicking Records button");
                  setActiveTab("records");
                }}
                className={`font-medium transition-colors ${activeTab === "records" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Records
              </button>
              <div className="flex items-center space-x-3 ml-6 border-l pl-6">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Notification bell clicked");
                      alert("Notifications:\n• New patient registered\n• Lab results ready for review\n• Appointment reminder");
                      setNotifications(0);
                    }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert("Settings panel would open here")}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to logout?")) {
                      window.location.href = "/doctor/login";
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {doctorData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {doctorData.name}</h1>
                <p className="text-gray-600">{doctorData.specialization} • {doctorData.hospital}</p>
                <p className="text-gray-500 text-sm">License: {doctorData.licenseNumber}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>


                <DialogTrigger asChild>
                  <Button onClick={(e) => {
                    e.preventDefault();
                    // console.log("Add Medical Record clicked");
                    // alert("Add Medical Record clicked!");
                    setIsAddRecordOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medical Record
                  </Button>
                </DialogTrigger>


                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Medical Record</DialogTitle>
                    <DialogDescription>
                      Create a new medical record for a patient
                    </DialogDescription>
                  </DialogHeader>


                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Patient</Label>
                        <Select value={newRecord.patientId} onValueChange={(value) => setNewRecord({ ...newRecord, patientId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {linkedPatients.map(patient => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name} ({patient.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Examination Type</Label>
                        <Select value={newRecord.type} onValueChange={(value) => setNewRecord({ ...newRecord, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Checkup</SelectItem>
                            <SelectItem value="blood">Blood Test</SelectItem>
                            <SelectItem value="heart">Heart Screening</SelectItem>
                            <SelectItem value="diabetes">Diabetes Checkup</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Diagnosis</Label>
                      <Textarea
                        placeholder="Enter your diagnosis and findings..."
                        value={newRecord.diagnosis}
                        onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prescription</Label>
                      <Textarea
                        placeholder="List medications, dosages, and instructions..."
                        value={newRecord.prescription}
                        onChange={(e) => setNewRecord({ ...newRecord, prescription: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Next Checkup Date</Label>
                        <Input
                          type="date"
                          value={newRecord.nextCheckup}
                          onChange={(e) => setNewRecord({ ...newRecord, nextCheckup: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Input
                          placeholder="Any additional notes..."
                          value={newRecord.notes}
                          onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddRecord}
                      className="w-full"
                      disabled={isAddingRecord}
                    >
                      {isAddingRecord ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Medical Record
                        </>
                      )}
                    </Button>

                  </div>



                </DialogContent>
              </Dialog>
              <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    console.log("Prescribe Medication clicked");
                    alert("Prescribe Medication clicked!");
                    setIsPrescriptionOpen(true);
                  }}>
                    <Pill className="w-4 h-4 mr-2" />
                    Prescribe Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Prescribe Medication</DialogTitle>
                    <DialogDescription>
                      Add a new medication prescription for a patient
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Patient</Label>
                      <Select value={newMedication.patientId} onValueChange={(value) => setNewMedication({ ...newMedication, patientId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {linkedPatients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} ({patient.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Medication Name</Label>
                        <Input
                          placeholder="e.g., Amlodipine 5mg"
                          value={newMedication.medicationName}
                          onChange={(e) => setNewMedication({ ...newMedication, medicationName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input
                          placeholder="e.g., 5mg"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={newMedication.frequency} onValueChange={(value) => setNewMedication({ ...newMedication, frequency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once daily</SelectItem>
                            <SelectItem value="twice">Twice daily</SelectItem>
                            <SelectItem value="thrice">Three times daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="asneeded">As needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g., 30 days"
                          value={newMedication.duration}
                          onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Instructions</Label>
                      <Textarea
                        placeholder="Special instructions for the patient..."
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                      />
                    </div>
                    <Button onClick={handlePrescribeMedication} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Prescribe Medication
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>


              <Dialog open={isAddHealthMetricsOpen} onOpenChange={setIsAddHealthMetricsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    console.log("Add Health Metrics clicked");
                    setIsAddHealthMetricsOpen(true);
                  }}>
                    <Activity className="w-4 h-4 mr-2" />
                    Add Health Metrics
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Health Metrics</DialogTitle>
                    <DialogDescription>
                      Record health measurements for a patient (will update existing data if already present)
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Patient Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Patient *</Label>
                        <Select
                          value={newHealthMetrics.patientId}
                          onValueChange={(value) => setNewHealthMetrics({ ...newHealthMetrics, patientId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {linkedPatients.map(patient => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name} (ID: {patient.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Metric Type Selection */}
                      <div className="space-y-2">
                        <Label>Metric Type *</Label>
                        <Select
                          value={newHealthMetrics.metricType}
                          onValueChange={(value) => {
                            const selectedType = METRIC_TYPES.find(m => m.value === value);
                            setNewHealthMetrics({
                              ...newHealthMetrics,
                              metricType: value,
                              unit: selectedType?.unit || '',
                              // Reset values when changing metric type
                              valueSystolic: '',
                              valueDiastolic: '',
                              valueNumeric: ''
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric type" />
                          </SelectTrigger>
                          <SelectContent>
                            {METRIC_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Values Input */}
                    {newHealthMetrics.metricType && (
                      <div className="space-y-4">
                        {METRIC_TYPES.find(m => m.value === newHealthMetrics.metricType)?.requiresBoth ? (
                          // Blood Pressure (Systolic/Diastolic)
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Systolic *</Label>
                              <Input
                                type="number"
                                placeholder="120"
                                value={newHealthMetrics.valueSystolic}
                                onChange={(e) => setNewHealthMetrics({ ...newHealthMetrics, valueSystolic: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Diastolic *</Label>
                              <Input
                                type="number"
                                placeholder="80"
                                value={newHealthMetrics.valueDiastolic}
                                onChange={(e) => setNewHealthMetrics({ ...newHealthMetrics, valueDiastolic: e.target.value })}
                              />
                            </div>
                          </div>
                        ) : (
                          // Single Numeric Value
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Value *</Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Enter value"
                                value={newHealthMetrics.valueNumeric}
                                onChange={(e) => setNewHealthMetrics({ ...newHealthMetrics, valueNumeric: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Unit</Label>
                              <Input
                                type="text"
                                placeholder="Unit"
                                value={newHealthMetrics.unit}
                                onChange={(e) => setNewHealthMetrics({ ...newHealthMetrics, unit: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newHealthMetrics.status}
                        onValueChange={(value) => setNewHealthMetrics({ ...newHealthMetrics, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes or observations..."
                        value={newHealthMetrics.notes}
                        onChange={(e) => setNewHealthMetrics({ ...newHealthMetrics, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddHealthMetricsOpen(false)}
                      disabled={isAddingMetrics}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddHealthMetrics}
                      disabled={isAddingMetrics || !newHealthMetrics.patientId || !newHealthMetrics.metricType}
                    >
                      {isAddingMetrics ? "Saving..." : "Save Metrics"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>


            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{isLoadingPatients ? '...' : linkedPatients.length}</p>
                  <p className="text-sm text-gray-600">Active Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-secondary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
                  <p className="text-sm text-gray-600">Today's Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-info mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                  <p className="text-sm text-gray-600">Records Added</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Pill className="w-8 h-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <p className="text-sm text-gray-600">Prescriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patient Management</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>Your appointments for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{appointment.patient}</h4>
                          <p className="text-sm text-gray-600">{appointment.type} • {appointment.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{appointment.time}</p>
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Patient Updates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Patient Updates
                  </CardTitle>
                  <CardDescription>Latest patient activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Blood test results uploaded for Rajesh Kumar</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Appointment rescheduled by Sunita Devi</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New patient registered: Mohan Singh</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical Patients Alert */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Critical Patients Alert</CardTitle>
                <CardDescription className="text-red-700">
                  Patients requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {linkedPatients.filter(p => p.status === "Critical").length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>No critical patients at this time</p>
                    </div>
                  ) : (
                    linkedPatients.filter(p => p.status === "Critical").map(patient => (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{patient.name}</p>
                          <p className="text-sm text-red-600">{patient.condition}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              alert(`Calling ${patient.name}...\n\nPhone: ${patient.phone}\nCondition: ${patient.condition}\n\nNote: This is a critical patient requiring immediate attention.`);
                            }}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              alert(`CRITICAL PATIENT DETAILS\n\nName: ${patient.name}\nID: ${patient.id}\nAge: ${patient.age}\nCondition: ${patient.condition}\nLast Visit: ${formatDate(patient.lastVisit)}\nNext Appointment: ${patient.nextAppointment}\n\nIMPORTANT: This patient requires immediate medical attention!`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>View and manage all your patients</CardDescription>
              </CardHeader>




              <CardContent>
                {isLoadingPatients ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading patients...</span>
                  </div>
                ) : patientsError ? (
                  <div className="flex items-center justify-center py-8 text-red-600">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    <span>Error: {patientsError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={fetchLinkedPatients}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search patients..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button onClick={() => {
                        setIsAddPatientOpen(true);
                        alert("Add New Patient form would open here");
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Patient
                      </Button>
                    </div>







                    <div className="space-y-4">
                      {filteredPatients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No patients found</p>
                          <p className="text-sm">
                            {searchQuery ? 'Try adjusting your search terms' : 'No patients are currently linked to your account'}
                          </p>
                        </div>
                      ) : (
                        filteredPatients.map((patient) => (
                          <div key={patient.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Avatar>
                                  <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{patient.name}</h4>
                                  <p className="text-sm text-gray-600">ID: {patient.id} • Age: {patient.age}</p>
                                  <p className="text-sm text-gray-600">Blood Group: {patient.bloodGroup} • Last Visit: {formatDate(patient.lastVisit)}</p>
                                  <p className="text-sm text-gray-600">Condition: {patient.condition}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge className={getStatusColor(patient.status)}>
                                  {patient.status}
                                </Badge>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPatient(patient);
                                      setIsPatientViewOpen(true);
                                      alert(`Viewing detailed profile for ${patient.name}\nID: ${patient.id}\nCondition: ${patient.condition}\nStatus: ${patient.status}`);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      alert(`Edit form for ${patient.name} would open here`);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setNewRecord({ ...newRecord, patientId: patient.id });
                                      setIsAddRecordOpen(true);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Record
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>



                  </>
                )}
              </CardContent>

            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>Manage your schedule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{appointment.patient}</h4>
                          <p className="text-sm text-gray-600">{appointment.type}</p>
                          <p className="text-sm text-gray-600">{appointment.time} • {appointment.duration}</p>
                        </div>
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            alert(`Starting consultation with ${appointment.patient}\nType: ${appointment.type}\nTime: ${appointment.time}`);
                          }}
                        >
                          Start Consultation
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            alert(`Reschedule appointment for ${appointment.patient}?`);
                          }}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule Management</CardTitle>
                  <CardDescription>Manage appointment slots</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      alert("Add Available Slot:\n\nSelect date and time slots when you're available for appointments.");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Available Slot
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      alert("Weekly Schedule:\n\nMon: 9AM-5PM\nTue: 9AM-5PM\nWed: 9AM-1PM\nThu: 9AM-5PM\nFri: 9AM-5PM\nSat: 9AM-12PM\nSun: Closed");
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Weekly Schedule
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      alert("Set Break Times:\n\nLunch: 1PM-2PM daily\nTea Break: 11AM-11:15AM, 4PM-4:15PM");
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Set Break Times
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records Management</CardTitle>
                <CardDescription>View and manage all patient medical records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      <Select>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Patients</SelectItem>
                          {linkedPatients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="general">General Checkup</SelectItem>
                          <SelectItem value="blood">Blood Test</SelectItem>
                          <SelectItem value="heart">Heart Screening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          alert("Upload Lab Results:\n\nSelect patient and upload their test results from external labs.");
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Lab Results
                      </Button>
                      <Button
                        onClick={() => setIsAddRecordOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Record
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">General Checkup - Rajesh Kumar</h4>
                          <p className="text-sm text-gray-600">January 15, 2024 • HMS2024001</p>
                          <p className="text-sm text-gray-800 mt-2">
                            <strong>Diagnosis:</strong> Blood pressure slightly elevated, cholesterol normal
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Prescription:</strong> Amlodipine 5mg once daily
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              alert("Edit medical record for Rajesh Kumar's General Checkup\nDate: January 15, 2024");
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              alert("Exporting Rajesh Kumar's medical record as PDF...\nDownload will start shortly.");
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Blood Test - Sunita Devi</h4>
                          <p className="text-sm text-gray-600">January 12, 2024 • HMS2024002</p>
                          <p className="text-sm text-gray-800 mt-2">
                            <strong>Diagnosis:</strong> All parameters within normal range
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Prescription:</strong> Continue current vitamins
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
