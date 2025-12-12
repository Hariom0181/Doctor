import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, X } from 'lucide-react';

import {
  Heart,
  Calendar,
  FileText,
  Pill,
  Activity,
  Phone,
  Download,
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  User,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Stethoscope,
  TestTube,
  Clipboard,
  Upload,
  Save,
  Loader2
} from "lucide-react";
import { patientApiService, HealthMetric, LinkedDoctor, AvailableDoctor, PatientMedicalRecord, PatientProfile } from "@/services/patientApi";

// ------------------------------
// Hardcoded initial data (unchanged)
// ------------------------------
const INITIAL_PATIENT_DATA = {
  name: "Rajesh Kumar",
  age: 45,
  id: "HMS2024001",
  email: "rajesh.kumar@email.com",
  phone: "+91 98765 43210",
  bloodGroup: "B+",
  address: "Village Rampur, District Meerut, UP - 250001",
  emergencyContact: "Sunita Kumar (+91 98765 43211)",
  profilePicture: "/placeholder.svg"
};

const INITIAL_HEALTH_METRICS = [
  { label: "Blood Pressure", value: "130/85", status: "warning", lastChecked: "2024-01-15" },
  { label: "Blood Sugar", value: "110 mg/dL", status: "normal", lastChecked: "2024-01-10" },
  { label: "Weight", value: "78 kg", status: "normal", lastChecked: "2024-01-12" },
  { label: "Heart Rate", value: "72 bpm", status: "normal", lastChecked: "2024-01-15" }
];

const INITIAL_RECENT_RECORDS = [
  {
    id: "1",
    date: "2024-01-15",
    type: "General Checkup",
    doctor: "Dr. Priya Sharma",
    hospital: "Primary Health Center",
    diagnosis: "Blood pressure slightly elevated, cholesterol normal",
    status: "Attention Needed",
    nextCheckup: "2024-04-15",
    documents: ["Blood Report", "ECG Report"]
  },
  {
    id: "2",
    date: "2024-01-10",
    type: "Blood Test",
    doctor: "Dr. Amit Verma",
    hospital: "District Hospital",
    diagnosis: "All parameters within normal range",
    status: "Normal",
    documents: ["Complete Blood Count", "Lipid Profile"]
  },
  {
    id: "3",
    date: "2024-01-05",
    type: "Heart Screening",
    doctor: "Dr. Sunita Patel",
    hospital: "Cardiology Center",
    diagnosis: "Mild irregularity detected, follow-up recommended",
    status: "Attention Needed",
    nextCheckup: "2024-03-05",
    documents: ["ECG Report", "Echo Report"]
  }
];

const INITIAL_UPCOMING_APPOINTMENTS = [
  {
    id: "1",
    date: "2024-04-15",
    time: "10:00 AM",
    doctor: "Dr. Priya Sharma",
    type: "Follow-up Checkup",
    hospital: "Primary Health Center",
    status: "confirmed"
  },
  {
    id: "2",
    date: "2024-03-05",
    time: "2:30 PM",
    doctor: "Dr. Sunita Patel",
    type: "Heart Screening",
    hospital: "Cardiology Center",
    status: "pending"
  }
];

const INITIAL_MEDICATIONS = [
  {
    name: "Amlodipine 5mg",
    frequency: "Once daily",
    duration: "30 days",
    prescribed: "Dr. Priya Sharma",
    startDate: "2024-01-15",
    status: "active"
  },
  {
    name: "Vitamin D3",
    frequency: "Weekly",
    duration: "90 days",
    prescribed: "Dr. Amit Verma",
    startDate: "2024-01-10",
    status: "active"
  }
];

const INITIAL_DOCTORS_LIST = [
  { id: "doc1", name: "Dr. Priya Sharma", specialization: "Cardiologist" },
  { id: "doc2", name: "Dr. Amit Verma", specialization: "Pathologist" },
  { id: "doc3", name: "Dr. Sunita Patel", specialization: "General" }
];

export default function PatientDashboard() {
  // ------------------------------
  // State initialized from hardcoded data (backend-ready)
  // Replace these via backend responses when ready
  // ------------------------------
  const [activeTab, setActiveTab] = useState("overview"); // <-- Replace with backend: default tab if needed
  // const [patientData, setPatientData] = useState(INITIAL_PATIENT_DATA); // <-- Replace with backend: patient data
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  // <-- Replace with backend: health metrics
  const [recentRecords, setRecentRecords] = useState([]);
  const [isLoadingRecentRecords, setIsLoadingRecentRecords] = useState(false);

  const [upcomingAppointments, setUpcomingAppointments] = useState(INITIAL_UPCOMING_APPOINTMENTS); // <-- Replace with backend: appointments
  const [medications, setMedications] = useState(INITIAL_MEDICATIONS); // <-- Replace with backend: medications
  const [doctorsList, setDoctorsList] = useState(INITIAL_DOCTORS_LIST);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  // New state for API integration
  const [linkedDoctors, setLinkedDoctors] = useState<LinkedDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [isLoadingAvailableDoctors, setIsLoadingAvailableDoctors] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecord[]>([]);
  const [isLoadingMedicalRecords, setIsLoadingMedicalRecords] = useState(false);
  const [medicalRecordsError, setMedicalRecordsError] = useState<string | null>(null);
  // Add this state for image handling
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  useEffect(() => {
    const loadPatientData = () => {
      try {
        const storedPatientData = localStorage.getItem('patientData');
        if (storedPatientData) {
          const parsedData = JSON.parse(storedPatientData);



          // Transform the data to match your UI needs
          setPatientData({
            id: parsedData.id,
            name: `${parsedData.firstName} ${parsedData.lastName}`,
            firstName: parsedData.firstName,
            lastName: parsedData.lastName,
            email: parsedData.email,
            phone: parsedData.phone,
            address: parsedData.address,
            profilePicture: parsedData.profileImage
          });
        } else {
          console.warn('No patient data found in localStorage');
          // Optionally redirect to login
          // window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error parsing patient data from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, []);


  useEffect(() => {
    fetchMetrics();
  }, []);
  // In your PatientDashboard.tsx
  // Add this to your fetchMetrics function for better debugging
  const fetchMetrics = async () => {
    try {
      const patientToken = localStorage.getItem("PatientToken");

      if (!patientToken) {
        console.error("No patient token found. User may not be logged in.");
        return;
      }

      const tokenPayload = JSON.parse(atob(patientToken.split('.')[1]));
      console.log("JWT Token payload:", tokenPayload);
      console.log("Patient ID from token:", tokenPayload.id);

      const response = await fetch(`http://localhost:5000/api/patients/health-metrics`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${patientToken}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Response status:", response.status);
      console.log("Response OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Full API response:", result); // This will show us what we're getting

      if (result.success) {
        setHealthMetrics(result.data);
        console.log("Health metrics loaded:", result.data);
        console.log("Number of metrics:", result.data.length);
      } else {
        console.error("Failed to fetch health metrics:", result.message);
      }
    } catch (error) {
      console.error("Failed to fetch health metrics:", error);
    }
  };

  const generatePatientId = (id) => {
    return `HMS${new Date().getFullYear()}${String(id).padStart(4, '0')}`;
  };





  // Backend integration for linked doctors
  // ------------------------------
  const formatExaminationType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'general':
        return 'General Checkup';
      case 'blood':
        return 'Blood Test';
      case 'heart':
        return 'Heart Screening';
      default:
        return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Medical Examination';
    }
  };
  const getRecordStatus = (record: PatientMedicalRecord) => {
    // Logic to determine status based on diagnosis or other factors
    const diagnosis = record.diagnosis?.toLowerCase() || '';

    if (diagnosis.includes('critical') || diagnosis.includes('urgent')) {
      return 'Critical';
    } else if (diagnosis.includes('attention') || diagnosis.includes('elevated')) {
      return 'Attention Needed';
    } else {
      return 'Normal';
    }
  };
  useEffect(() => {
    // Always fetch on mount, and also when records tab is accessed
    if (activeTab === "records" || !recentRecords.length) {
      fetchMedicalRecords();
    }
  }, [activeTab]);

  // Also fetch immediately on component mount
  useEffect(() => {
    fetchMedicalRecords();
  }, []);


  const fetchMedicalRecords = async () => {
    try {
      setIsLoadingMedicalRecords(true);
      setIsLoadingRecentRecords(true);
      setMedicalRecordsError(null);

      const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
      const patientId = patientData.id;

      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      console.log('🏥 Fetching medical records for patient:', patientId);
      const records = await patientApiService.getMedicalRecords(patientId);

      console.log('📄 Fetched medical records:', records);
      setMedicalRecords(records);

      // Update recentRecords state - Fixed mapping
      setRecentRecords(records.map(record => ({
        id: String(record.id),
        type: formatExaminationType(record.examinationType),
        doctor: record.doctorName || `Doctor ${record.doctorId}`,
        currentHospital: record.currentHospital || 'Hospital Name', // Changed from 'hospital' to 'currentHospital'
        date: record.createdAt,
        status: getRecordStatus(record),
        diagnosis: record.diagnosis,
        nextCheckup: record.nextCheckupDate || null,
        documents: ['Medical Report']
      })));
    } catch (error) {
      console.error('❌ Error fetching medical records:', error);
      setMedicalRecordsError(error.message);
      setRecentRecords([]); // Add fallback empty array
    } finally {
      setIsLoadingMedicalRecords(false);
      setIsLoadingRecentRecords(false); // Don't forget this
    }
  };
  useEffect(() => {
    const fetchLinkedDoctors = async () => {
      setIsLoadingDoctors(true);
      setDoctorsError(null);

      try {
        // Get the current logged-in patient's ID
        const patientId = getCurrentPatientId();

        if (!patientId) {
          throw new Error('No patient logged in');
        }

        console.log('Using current patient ID:', patientId);

        const doctors = await patientApiService.getLinkedDoctors(patientId);
        setLinkedDoctors(doctors);

        // Update the doctors list for the profile section
        if (doctors.length > 0) {
          const transformedDoctors = doctors.map(doctor => ({
            id: doctor.id.toString(),
            name: doctor.name,
            specialization: doctor.specialization
          }));
          setDoctorsList(transformedDoctors);
        }
      } catch (error) {
        console.error('Failed to fetch linked doctors:', error);
        setDoctorsError('Failed to fetch linked doctors. Please try logging in again.');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchLinkedDoctors();
  }, []);

  // Fetch available doctors for selection
  useEffect(() => {
    const fetchAvailableDoctors = async () => {
      // console.log('🔄 Fetching available doctors...');
      setIsLoadingAvailableDoctors(true);

      try {
        const doctors = await patientApiService.getAvailableDoctors();
        console.log('✅ Available doctors fetched:', doctors);
        setAvailableDoctors(doctors);

        // Update the doctors list for the profile section dropdown
        if (doctors.length > 0) {
          const transformedDoctors = doctors.map(doctor => ({
            id: doctor.id.toString(),
            name: doctor.name,
            specialization: doctor.specialization
          }));
          console.log('🔄 Transforming doctors for dropdown:', transformedDoctors);
          setDoctorsList(transformedDoctors);
          console.log('🔄 Updated doctorsList state with:', transformedDoctors.length, 'doctors');

          // Force a re-render by updating a timestamp
          // console.log('🔄 Doctors list updated, should re-render dropdown');
        } else {
          console.log('⚠️ No doctors found in API response');
        }
      } catch (error) {
        console.error('❌ Failed to fetch available doctors:', error);
        // Keep the hardcoded doctors list as fallback
        console.log('🔄 Using fallback doctors list');
      } finally {
        setIsLoadingAvailableDoctors(false);
      }
    };

    // Add a small delay to ensure this runs after the first useEffect
    setTimeout(() => {
      fetchAvailableDoctors();
    }, 100);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "bg-success text-success-foreground";
      case "attention needed": case "warning": return "bg-warning text-warning-foreground";
      case "critical": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getMetricColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "normal": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "critical": return "text-red-600";
      default: return "text-gray-500";
    }
  };
  const getCurrentPatientId = () => {
    const patientData = localStorage.getItem("patientData");
    if (patientData) {
      const patient = JSON.parse(patientData);
      return patient.id?.toString();
    }
    return null;
  };
  // --------------------------------------------------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "Not recorded";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const handleDoctorSelection = async (doctorId: string) => {
    if (!doctorId) return;

    try {
      // Get the current logged-in patient's ID
      const patientId = getCurrentPatientId();

      if (!patientId) {
        alert('Please log in again to update your doctor.');
        return;
      }

      console.log('Updating doctor for patient:', patientId, 'to doctor:', doctorId);

      // Update the doctor relationship for the current patient
      await patientApiService.updateDoctorRelationship(patientId, doctorId);

      // Refresh the linked doctors
      const doctors = await patientApiService.getLinkedDoctors(patientId);
      setLinkedDoctors(doctors);

      // Show success message
      alert('Doctor relationship updated successfully!');
    } catch (error) {
      console.error('Failed to update doctor relationship:', error);
      alert('Failed to update doctor relationship. Please try again.');
    }
  };

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
                <p className="text-sm text-gray-600">Patient Portal</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("overview");
                }}
                className={`font-medium transition-colors ${activeTab === "overview" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Dashboard
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
                  setActiveTab("medications")
                }}
                className={`font-medium transition-colors ${activeTab === "records" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Medications
              </button>
              <div className="flex items-center space-x-3 ml-6 border-l pl-6">
                {/* <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to logout?")) {
                      window.location.href = "/patient/login";
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
        {loading ? (
          <div className="mb-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-300 rounded w-32"></div>
            </div>
          </div>


        ) : !patientData ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Unable to load patient data. Please log in again.</p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">


                <Avatar className="w-16 h-16">
                  {patientData.profilePicture && patientData.profilePicture !== "/api/placeholder/64/64" ? (
                    <>
                      <AvatarImage
                        src={patientData.profilePicture}
                        alt={patientData.name}
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                      <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-1" />
                      <span className="text-xs text-gray-500 group-hover:text-blue-600 font-medium">Add Photo</span>
                    </div>
                  )}

                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {patientData.firstName.charAt(0)}{patientData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>



                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {patientData.name}
                  </h1>
                  <p className="text-gray-600">
                    Patient ID: {generatePatientId(patientData.id)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  alert("Book Appointment\n\nSelect your preferred:\n• Date & Time\n• Doctor specialization\n• Appointment type\n\nYour appointment request will be sent to the healthcare center for confirmation.");
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>
        )}

        {/* Quick Health Status */}
        {/* Fixed Health Metrics Display */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {healthMetrics.length > 0 ? (
            healthMetrics.map((metric, index) => (
              <Card key={metric.id || index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className={`text-2xl font-bold ${getMetricColor(metric.status)}`}>
                        {metric.value}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last checked: {formatDate(metric.lastChecked)}
                      </p>
                      {metric.notes && (
                        <p className="text-xs text-gray-400 mt-1">
                          Notes: {metric.notes}
                        </p>
                      )}
                    </div>
                    <Activity className={`w-8 h-8 ${getMetricColor(metric.status)}`} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Show placeholder cards when no data
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        {['Blood Pressure', 'Blood Sugar', 'Weight', 'Heart Rate'][index]}
                      </p>
                      <p className="text-2xl font-bold text-gray-300">
                        No data
                      </p>
                      <p className="text-xs text-gray-400">
                        Not recorded yet
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>


        {/* Linked Doctors Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                My Healthcare Team
              </CardTitle>
              <CardDescription>Doctors currently managing your care</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDoctors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctorsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <h3 className="font-medium text-red-800 mb-2">Error Loading Doctors</h3>
                  <p className="text-sm text-red-600 mb-4">{doctorsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : linkedDoctors.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-800 mb-2">No Doctors Linked</h3>
                  <p className="text-sm text-gray-600">Your healthcare team will appear here once doctors are assigned to your care.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {linkedDoctors.map((doctor) => (
                    <div key={doctor.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{doctor.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">{doctor.specialization}</p>
                          <p className="text-sm text-gray-500 mb-1">{doctor.hospital}</p>
                          <p className="text-xs text-gray-400">Linked since: {new Date(doctor.linkedDate).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {doctor.relationshipStatus}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Medical Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Medical Records
                  </CardTitle>
                  <CardDescription>Your latest health checkups and diagnoses</CardDescription>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  {isLoadingRecentRecords ? (
                    <div className="text-center py-4">Loading recent records...</div>
                  ) : recentRecords && recentRecords.length > 0 ? (
                    recentRecords.slice(0, 3).map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{record.type}</h4>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {record.doctor} • {record.currentHospital} {/* Fixed: removed "Dr." prefix since it's already in record.doctor */}
                            </p>
                            <p className="text-sm text-gray-800 mt-1">{record.diagnosis}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </div>
                        {record.nextCheckup && (
                          <p className="text-sm text-primary font-medium">
                            Next checkup: {new Date(record.nextCheckup).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">No recent records available</div>
                  )}
                  <Button variant="outline" className="w-full">
                    View All Records
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Your scheduled medical appointments</CardDescription>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">{appointment.doctor}</p>
                          <p className="text-sm text-gray-600">{appointment.hospital}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{appointment.time}</p>
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Active Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Active Medications
                </CardTitle>
                <CardDescription>Current medications and reminders</CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medications.map((med, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{med.name}</h4>
                          <p className="text-sm text-gray-600">{med.frequency} • {med.duration}</p>
                          <p className="text-sm text-gray-500">Prescribed by {med.prescribed}</p>
                          <p className="text-sm text-gray-500">Started: {new Date(med.startDate).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">
                          {med.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Complete Medical Records</CardTitle>
                    <CardDescription>All your medical history and test results</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Upload Documents Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Documents
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="space-y-3 pb-6">
                          <DialogTitle className="text-xl font-semibold text-gray-900">
                            Upload Medical Documents
                          </DialogTitle>
                          <DialogDescription className="text-gray-600">
                            Upload lab reports, prescriptions, or other medical documents you've received from healthcare providers
                          </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-8">
                          {/* Document Information Section */}
                          <div className="space-y-6">
                            <div className="border-b border-gray-200 pb-4">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                📋 Document Information
                              </h3>
                              <p className="text-sm text-gray-600">
                                Provide details about the medical document you're uploading
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <Label htmlFor="doc-type" className="text-sm font-medium text-gray-700">
                                  Document Type <span className="text-red-500">*</span>
                                </Label>
                                <Select>
                                  <SelectTrigger id="doc-type" className="w-full h-11">
                                    <SelectValue placeholder="Choose document type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="lab-report">���� Lab Report</SelectItem>
                                    <SelectItem value="prescription">💊 Prescription</SelectItem>
                                    <SelectItem value="xray">📷 X-Ray/Scan</SelectItem>
                                    <SelectItem value="discharge">📋 Discharge Summary</SelectItem>
                                    <SelectItem value="vaccination">💉 Vaccination Record</SelectItem>
                                    <SelectItem value="other">📄 Other Medical Document</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-3">
                                <Label htmlFor="doc-date" className="text-sm font-medium text-gray-700">
                                  Date of Test/Visit <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="doc-date"
                                  type="date"
                                  className="w-full h-11"
                                  max={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="hospital-name" className="text-sm font-medium text-gray-700">
                                Hospital/Lab/Clinic Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="hospital-name"
                                placeholder="Enter the name of the healthcare facility"
                                className="w-full h-11"
                              />
                            </div>
                          </div>

                          {/* File Upload Section */}
                          <div className="space-y-6">
                            <div className="border-b border-gray-200 pb-4">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                📎 Upload Files
                              </h3>
                              <p className="text-sm text-gray-600">
                                Select the documents you want to upload
                              </p>
                            </div>

                            <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/50 transition-all duration-200 bg-primary/5">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-lg font-medium text-gray-900">
                                    Drop files here or click to browse
                                  </p>
                                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    Supported formats: PDF, JPG, JPEG, PNG • Maximum size: 10MB per file
                                  </p>
                                </div>
                                <Button type="button" variant="outline" className="mt-4">
                                  Choose Files
                                </Button>
                                <Input
                                  type="file"
                                  className="hidden"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  aria-label="Upload medical documents"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Additional Notes Section */}
                          <div className="space-y-6">
                            <div className="border-b border-gray-200 pb-4">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                📝 Additional Information
                              </h3>
                              <p className="text-sm text-gray-600">
                                Add any relevant notes or context (optional)
                              </p>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="doc-notes" className="text-sm font-medium text-gray-700">
                                Notes
                              </Label>
                              <Textarea
                                id="doc-notes"
                                placeholder="Add any relevant notes about this document, symptoms experienced, or additional context that might help your doctor..."
                                className="min-h-[120px] resize-none"
                              />
                            </div>
                          </div>

                          {/* Submit Section */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                            <Button type="submit" className="flex-1 h-11">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents
                            </Button>
                            <Button type="button" variant="outline" className="flex-1 h-11">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Add Health Data Dialog - Simplified for space */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Health Data
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="space-y-3 pb-6">
                          <DialogTitle className="text-xl font-semibold">Add Health Measurements</DialogTitle>
                          <DialogDescription>Record your vital signs and health measurements</DialogDescription>
                        </DialogHeader>
                        <form className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label>Date</Label>
                              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-3">
                              <Label>Time</Label>
                              <Input type="time" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label>Blood Pressure</Label>
                              <div className="flex items-center space-x-2">
                                <Input placeholder="120" type="number" />
                                <span>/</span>
                                <Input placeholder="80" type="number" />
                                <span className="text-sm text-gray-500">mmHg</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label>Blood Sugar (mg/dL)</Label>
                              <Input placeholder="95" type="number" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label>Weight (kg)</Label>
                              <Input placeholder="70" type="number" />
                            </div>
                            <div className="space-y-3">
                              <Label>Heart Rate (bpm)</Label>
                              <Input placeholder="72" type="number" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label>Notes/Symptoms</Label>
                            <Textarea placeholder="How are you feeling? Any symptoms or notes..." />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1">
                              <Save className="w-4 h-4 mr-2" />
                              Save Health Data
                            </Button>
                            <Button type="button" variant="outline" className="flex-1">Cancel</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Doctor Records */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    👨‍⚕️ Doctor Records
                  </h3>

                  {/* Loading State */}
                  {isLoadingMedicalRecords && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading your medical records...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {medicalRecordsError && (
                    <div className="text-center py-8">
                      <p className="text-red-600">Error loading records: {medicalRecordsError}</p>
                      <Button
                        variant="outline"
                        onClick={fetchMedicalRecords}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* No Records State */}
                  {!isLoadingMedicalRecords && !medicalRecordsError && medicalRecords.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">No medical records found</p>
                      <p className="text-sm text-gray-500 mt-1">Your medical records will appear here when doctors add them.</p>
                    </div>
                  )}

                  {/* Medical Records List */}
                  {!isLoadingMedicalRecords && !medicalRecordsError && medicalRecords.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-4">
                      {medicalRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h4 className="font-semibold text-lg">{formatExaminationType(record.examinationType)}</h4>
                                <Badge className={getStatusColor(getRecordStatus(record))}>
                                  {getRecordStatus(record)}
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Doctor Added</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                <div className="space-y-1">
                                  <p><span className="font-medium">Doctor:</span> {record.doctorName || `Dr. ${record.doctorId}`}</p>
                                  <p><span className="font-medium">Specialization:</span> {record.doctorSpecialization || 'General Medicine'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p><span className="font-medium">Date:</span> {new Date(record.createdAt).toLocaleDateString()}</p>
                                  {record.nextCheckupDate && (
                                    <p><span className="font-medium">Next Checkup:</span> {new Date(record.nextCheckupDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                                {record.prescription && (
                                  <p className="text-sm mt-2"><span className="font-medium">Prescription:</span> {record.prescription}</p>
                                )}
                                {record.additionalNotes && (
                                  <p className="text-sm mt-2"><span className="font-medium">Notes:</span> {record.additionalNotes}</p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm">
                                  <Download className="w-3 h-3 mr-1" />
                                  Medical Report
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Records */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    📤 My Health Data & Documents
                  </h3>

                  <div className="border border-green-200 rounded-lg p-6 bg-green-50/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-semibold">Blood Sugar Self-Monitoring</h4>
                      <Badge className="bg-green-100 text-green-800">Self-Reported</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <p><span className="font-medium">Date:</span> Jan 18, 2024 8:00 AM</p>
                      <p><span className="font-medium">Blood Sugar:</span> 105 mg/dL</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm">Fasting measurement at home. Feeling normal.</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Add Your Health Information</h3>
                    <p className="text-gray-600 mb-4">Upload documents or track your health measurements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled visits</CardDescription>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{appointment.type}</h4>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Stethoscope className="w-4 h-4 mr-1" />
                            {appointment.doctor}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {appointment.hospital}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                        </div>
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="outline" size="sm">Cancel</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Book New Appointment</CardTitle>
                  <CardDescription>Schedule your next visit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      General Checkup
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <TestTube className="w-4 h-4 mr-2" />
                      Lab Tests
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Specialist Consultation
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Clipboard className="w-4 h-4 mr-2" />
                      Follow-up Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
                <CardDescription>Manage your active prescriptions</CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                {medications.map((med, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{med.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                          <p><strong>Frequency:</strong> {med.frequency}</p>
                          <p><strong>Duration:</strong> {med.duration}</p>
                          <p><strong>Prescribed by:</strong> {med.prescribed}</p>
                          <p><strong>Started:</strong> {new Date(med.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        {med.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Set Reminder</Button>
                      <Button variant="outline" size="sm">Mark as Taken</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={patientData.profilePicture} alt={patientData.name} />
                      <AvatarFallback>{patientData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Photo</Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-sm">{patientData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Age</p>
                      <p className="text-sm">{patientData.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Patient ID</p>
                      <p className="text-sm">{patientData.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-sm">{patientData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-sm">{patientData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Blood Group</p>
                      <p className="text-sm">{patientData.bloodGroup}</p>
                    </div>
                  </div> */}
                  <Button className="w-full">Edit Profile</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address & Emergency Contact</CardTitle>
                  <CardDescription>Your location and emergency information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-sm">{/*patientData.address*/}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Emergency Contact</p>
                      <p className="text-sm">{/*patientData.emergencyContact*/}</p>
                    </div>
                  </div>

                  {/* 👨‍⚕️ Select Doctors */}
                  <div className="space-y-3">
                    <Label htmlFor="select-doctor" className="text-sm font-medium text-gray-700">
                      Select Doctor
                    </Label>

                    {/* Show current doctor if linked */}
                    {linkedDoctors.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-blue-800">Current Doctor:</p>
                        <p className="text-sm text-blue-700">
                          {linkedDoctors[0].name} - {linkedDoctors[0].specialization}
                        </p>
                        <p className="text-xs text-blue-600">
                          Linked since: {new Date(linkedDoctors[0].linkedDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger id="select-doctor" className="flex-1 h-11">
                          <SelectValue placeholder="Choose a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingAvailableDoctors ? (
                            <SelectItem value="" disabled>Loading doctors...</SelectItem>
                          ) : doctorsList.length > 0 ? (
                            <>
                              {/* {console.log('🎯 Rendering doctors in dropdown:', doctorsList)} */}
                              {doctorsList.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name} - {doctor.specialization}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <>
                              {console.log('⚠️ No doctors in doctorsList state, length:', doctorsList.length)}
                              <SelectItem value="" disabled>No doctors available</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedDoctor && (
                        <Button
                          onClick={() => handleDoctorSelection(selectedDoctor)}
                          className="h-11 px-4"
                        >
                          Update
                        </Button>
                      )}
                    </div>
                    {selectedDoctor && (
                      <p className="text-xs text-gray-500">
                        Click Update to change your doctor
                      </p>
                    )}
                  </div>


                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Download Health Summary
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="w-4 h-4 mr-2" />
                        Emergency Contacts
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Privacy Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Emergency Banner */}
        <Card className="mt-8 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Emergency Helpline</h3>
                <p className="text-sm text-red-700">
                  For medical emergencies, call: <strong>+91 1800-123-4567</strong> (24/7 available)
                </p>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}