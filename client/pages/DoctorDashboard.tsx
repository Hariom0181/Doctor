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
import { doctorApiService, type MedicalRecord } from '@/services/doctorApi'
import { Camera, X } from 'lucide-react';
import { patientApiService } from '@/services/patientApi';
import type { PatientProfile } from '@/services/patientApi';
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
import { Check, CheckCircle } from "lucide-react";


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

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isPatientViewOpen, setIsPatientViewOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [isAddHealthMetricsOpen, setIsAddHealthMetricsOpen] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [recordsCount, setRecordsCount] = useState<number>(0);
  const [isLoadingRecordsCount, setIsLoadingRecordsCount] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [prescribingMedication, setPrescribingMedication] = useState(false);
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);

  // Appointment states
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);


  // Your existing useState declarations
  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        const storedDoctorData = localStorage.getItem('doctorData');
        if (storedDoctorData) {
          const parsedData = JSON.parse(storedDoctorData);
          const transformedData = {
            id: parsedData.id,
            name: `${parsedData.firstName} ${parsedData.lastName} `,
            firstName: parsedData.firstName,
            lastName: parsedData.lastName,
            email: parsedData.email,
            phone: parsedData.phone,
            specialization: parsedData.specialization,
            cuurentHospital: parsedData.current_hospital,
            licenseNumber: parsedData.licenseNumber,
            profilePicture: parsedData.profilePicture
          }

          setDoctorData(transformedData);

          if (parsedData.id) {
            await loadProfileImage(parsedData.id);
            await loadPrescriptionCount();
            await loadTodayAppointments(parsedData.id); // ✅ ADD THIS
            await loadPendingAppointments(parsedData.id);
            await loadRecentActivities(parsedData.id);


          }

        } else {
          console.warn('No Doctor data found in localStorage');
        }
      } catch (e) {
        console.error('Error parsing Doctor data from localStorage:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorData();
  }, []);
  // Auto-refresh appointments
  useEffect(() => {
    if (!doctorData?.id) return;

    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing doctor appointments...');
      await loadTodayAppointments();
      await loadPendingAppointments();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [doctorData?.id]);




  useEffect(() => {
    if (activeTab === "records") {
      fetchMedicalRecords();
    }
  }, [activeTab]);
  const fetchMedicalRecords = async () => {
    try {
      setIsLoadingRecords(true);
      setRecordsError(null);

      console.log("🏥 Fetching medical records...");
      const records = await doctorApiService.getMyMedicalRecords();

      // console.log("📄 Fetched records:", records);
      setMedicalRecords(records);
      setFilteredRecords(records); // Initially show all records

    } catch (error) {
      console.error("❌ Error fetching medical records:", error);
      setRecordsError(error.message);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    handleFilterRecords();
  }, [selectedPatientFilter, selectedTypeFilter, medicalRecords]);
  // Replace your existing handleFilterRecords function with this:
  const handleFilterRecords = () => {
    let filtered = [...medicalRecords];

    // Filter by patient - Fix the data type mismatch
    if (selectedPatientFilter !== "all") {
      filtered = filtered.filter(record =>
        String(record.patientId) === String(selectedPatientFilter)
      );
    }

    // Filter by type
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter(record =>
        record.examinationType.toLowerCase() === selectedTypeFilter.toLowerCase()
      );
    }

    setFilteredRecords(filtered);
  };

  // Function to load and view patient details
  const handleViewPatient = async (patientId: number) => {
    try {
      setLoadingPatientDetails(true);
      setIsViewDialogOpen(true);

      const details = await patientApiService.getPatientDetails(patientId);
      setViewingPatient(details);
    } catch (error) {
      console.error('Error loading patient details:', error);
      // toast({
      //   title: "Error",
      //   description: "Failed to load patient details",
      //   variant: "destructive"
      // });
      setIsViewDialogOpen(false);
    } finally {
      setLoadingPatientDetails(false);
    }
  };
  // Load recent activities
  const loadRecentActivities = async (doctorId?: number) => {
    const id = doctorId || doctorData?.id;
    if (!id) return;

    setIsLoadingActivities(true);
    try {
      const data = await doctorApiService.getRecentActivities(id, 10);
      setRecentActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Helper to get activity icon color
  const getActivityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-green-500';
    }
  };

  // Helper to format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };


  // Load today's appointments
  const loadTodayAppointments = async (doctorId?: number) => {
    const id = doctorId || doctorData?.id;
    if (!id) return;

    console.log('📅 Loading today\'s appointments for doctor:', id);
    setIsLoadingAppointments(true);

    try {
      const data = await doctorApiService.getTodayAppointments(id);
      console.log('✅ Today\'s appointments loaded:', data);
      setTodayAppointments(data);
    } catch (error) {
      console.error('❌ Error loading today\'s appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Load pending appointment requests
  const loadPendingAppointments = async (doctorId?: number) => {
    const id = doctorId || doctorData?.id;
    if (!id) return;

    console.log('⏳ Loading pending appointments for doctor:', id);

    try {
      const data = await doctorApiService.getPendingAppointments(id);
      console.log('✅ Pending appointments loaded:', data);
      setPendingAppointments(data);
    } catch (error) {
      console.error('❌ Error loading pending appointments:', error);
    }
  };

  // Confirm appointment
  const handleConfirmAppointment = async () => {
    if (!selectedAppointment) return;

    setProcessingAction(true);

    try {
      const success = await doctorApiService.confirmAppointment(
        selectedAppointment.id,
        actionNotes
      );

      if (success) {
        alert('✅ Appointment confirmed successfully!');
        setIsConfirmDialogOpen(false);
        setActionNotes('');
        setSelectedAppointment(null);

        // Reload appointments
        await loadTodayAppointments();
        await loadPendingAppointments();
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('❌ Failed to confirm appointment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject appointment
  const handleRejectAppointment = async () => {
    if (!selectedAppointment) return;

    if (!actionNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessingAction(true);

    try {
      const success = await doctorApiService.rejectAppointment(
        selectedAppointment.id,
        actionNotes
      );

      if (success) {
        alert('✅ Appointment rejected');
        setIsRejectDialogOpen(false);
        setActionNotes('');
        setSelectedAppointment(null);

        // Reload appointments
        await loadTodayAppointments();
        await loadPendingAppointments();
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('❌ Failed to reject appointment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Complete appointment
  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    setProcessingAction(true);

    try {
      const success = await doctorApiService.completeAppointment(
        selectedAppointment.id,
        actionNotes
      );

      if (success) {
        alert('✅ Appointment marked as completed!');
        setIsCompleteDialogOpen(false);
        setActionNotes('');
        setSelectedAppointment(null);

        // Reload appointments
        await loadTodayAppointments();
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('❌ Failed to complete appointment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Helper to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };






  const formatExaminationType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'general':
        return 'General Checkup';
      case 'blood':
        return 'Blood Test';
      case 'heart':
        return 'Heart Screening';
      default:
        return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown';
    }
  };

  const [newMedication, setNewMedication] = useState({
    patientId: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Load prescription count
  const loadPrescriptionCount = async () => {
    if (!doctorData?.id) return;

    try {
      const prescriptions = await doctorApiService.getDoctorPrescriptions(doctorData.id);
      setTotalPrescriptions(prescriptions.length);
    } catch (error) {
      console.error('Error loading prescription count:', error);
    }
  };

  // Handle prescription submission
  const handlePrescribeMedication = async () => {
    if (!doctorData?.id) {
      alert('Doctor data not found');
      return;
    }

    // Validation
    if (!newMedication.patientId) {
      alert('Please select a patient');
      return;
    }

    if (!newMedication.medicationName || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      alert('Please fill all required fields');
      return;
    }

    setPrescribingMedication(true);

    try {
      const result = await doctorApiService.prescribeMedication({
        patientId: parseInt(newMedication.patientId),
        doctorId: doctorData.id,
        medicationName: newMedication.medicationName,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        duration: newMedication.duration,
        instructions: newMedication.instructions,
        startDate: newMedication.startDate
      });

      if (result.success) {
        alert('✅ Prescription created successfully!');

        // Reset form
        setNewMedication({
          patientId: '',
          medicationName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          startDate: new Date().toISOString().split('T')[0]
        });

        // Close dialog
        setIsPrescriptionOpen(false);

        // Reload prescription count
        await loadPrescriptionCount();
      }
    } catch (error) {
      console.error('Error prescribing medication:', error);
      alert('❌ Failed to create prescription');
    } finally {
      setPrescribingMedication(false);
    }
  };



  useEffect(() => {
    // Load records count when component mounts
    fetchRecordsCount();
  }, []);
  const fetchRecordsCount = async () => {
    try {
      setIsLoadingRecordsCount(true);

      // Use the optimized count endpoint instead of fetching all records
      const count = await doctorApiService.getRecordsCount();
      setRecordsCount(count);

    } catch (error) {
      console.error('❌ Failed to fetch records count:', error);
      setRecordsCount(0);
    } finally {
      setIsLoadingRecordsCount(false);
    }
  };
  const getCurrentDoctorId = () => {
    const doctorsData = localStorage.getItem("doctorData");
    if (doctorsData) {
      const doctor = JSON.parse(doctorsData);
      return doctor.id?.toString();
    }
    return null;
  };

  // Add this function to get patient name by ID
  const getPatientNameById = (patientId: string) => {
    const patient = linkedPatients.find(p =>
      String(p.id) === String(patientId)
    );
    return patient ? patient.name : `Patient ${patientId}`;
  };

  const handleAddRecord = async () => {
    try {
      // Validation
      if (!newRecord.patientId || !newRecord.type || !newRecord.diagnosis) {
        alert("Please fill in all required fields (Patient, Examination Type, and Diagnosis)");
        return;
      }

      setIsAddingRecord(true);
      // console.log("Adding medical record:", newRecord);

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

      // console.log("✅ Medical record added successfully:", addedRecord);
      await fetchRecordsCount();
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
      await fetchMedicalRecords();

      // Optional: Refresh any medical records list if you have one displayed
      // await fetchMedicalRecords(); // Uncomment if you have this function

    } catch (error) {
      console.error("❌ Failed to add medical record:", error);
      alert(`Failed to add medical record: ${error.message}`);
    } finally {
      setIsAddingRecord(false);
    }
  };



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
  // Add this function inside your DoctorDashboard component
  const generateRecordReference = (record: MedicalRecord) => {
    const date = new Date(record.createdAt || '');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `HMS${year}${month}${String(record.id).padStart(3, '0')}`;
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
    switch (status) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Attention Needed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Normal':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  // doctor profile image 
  const loadProfileImage = async (doctorID: number) => {
    try {
      const imageUrl = await doctorApiService.getDoctorProfileImage(doctorID);
      if (imageUrl) {
        setProfileImageUrl(imageUrl);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const result = await doctorApiService.uploadDoctorProfileImage(doctorData.id, file);

      if (result.success) {
        // Update profile image URL
        const newImageUrl = `http://localhost:5000${result.profileImagePath}`;
        setProfileImageUrl(newImageUrl);

        // Update patient data
        setDoctorData({
          ...doctorData,
          profilePicture: newImageUrl
        });

        // console.log('✅ Profile image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };







  // Validate required fields based on metric type




  // const handlePrescribeMedication = () => {
  //   console.log("Prescribing medication:", newMedication);
  //   // Here you would typically send this to your backend
  //   alert(`Medication prescribed successfully for patient ${newMedication.patientId}!`);
  //   setNewMedication({
  //     patientId: "",
  //     medicationName: "",
  //     dosage: "",
  //     frequency: "",
  //     duration: "",
  //     instructions: ""
  //   });
  //   setIsPrescriptionOpen(false);
  // };

  const filteredPatients = linkedPatients.filter(patient => {
    if (!searchQuery.trim()) return true; // Show all if no search query

    const query = searchQuery.toLowerCase();
    return patient.name.toLowerCase().includes(query) ||
      patient.id.toString().includes(query) || // Convert ID to string first
      (patient.condition && patient.condition.toLowerCase().includes(query)) ||
      (patient.bloodGroup && patient.bloodGroup.toLowerCase().includes(query));
  });

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
                  // console.log("Clicking Dashboard button");
                  setActiveTab("overview");
                }}
                className={`font-medium transition-colors ${activeTab === "overview" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Dashboard
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // console.log("Clicking Patients button");
                  setActiveTab("patients");
                }}
                className={`font-medium transition-colors ${activeTab === "patients" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Patients
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // console.log("Clicking Appointments button");
                  setActiveTab("appointments");
                }}
                className={`font-medium transition-colors ${activeTab === "appointments" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Appointments
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // console.log("Clicking Records button");
                  setActiveTab("records");
                }}
                className={`font-medium transition-colors ${activeTab === "records" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Records
              </button>
              <div className="flex items-center space-x-3 ml-6 border-l pl-6">
                {/* <div className="relative">
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
                </div> */}
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert("Settings panel would open here")}
                >
                  <Settings className="w-4 h-4" />
                </Button> */}
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
        ) : !doctorData ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-600">Unable to load doctor data. Please log in again.</span>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between">



              <div className="flex items-center space-x-4">



                <div className="relative inline-block group">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="profile-upload"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />

                  {/* Avatar with upload label */}
                  <label
                    htmlFor="profile-upload"
                    className="cursor-pointer block"
                  >
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      {profileImageUrl ? (
                        <AvatarImage
                          src={profileImageUrl}
                          alt={`${doctorData.firstName} ${doctorData.lastName}`}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-semibold">
                          {doctorData.firstName.charAt(0)}{doctorData.lastName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Camera overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full flex items-center justify-center transition-all duration-200">
                      <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Upload progress indicator */}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </label>

                  {/* Add Photo text when no image */}
                  {!profileImageUrl && !uploadingImage && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      Add Photo
                    </div>
                  )}
                </div>




                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, Dr. {doctorData.firstName} {doctorData.lastName}
                  </h1>
                  {/* FIXED: Changed from <p> to <div> to avoid nesting issues */}
                  <div className="text-gray-600">
                    {doctorData.specialization} • {doctorData.currentHospital}
                  </div>
                  {doctorData.licenseNumber && (
                    <div className="text-gray-500 text-sm">
                      License: {doctorData.licenseNumber}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                // className=""
                disabled

              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Schedule
              </Button>
            </div>
          </div>
        )}





        <div className="mb-8">
          <div className="flex items-center justify-between">





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
                          min={new Date().toISOString().split("T")[0]} // today in YYYY-MM-DD format
                          onChange={(e) =>
                            setNewRecord({ ...newRecord, nextCheckup: e.target.value })
                          }
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
                  <Button variant="outline">
                    <Pill className="w-4 h-4 mr-2" />
                    Prescribe Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Prescribe Medication</DialogTitle>
                    <DialogDescription>
                      Add a new medication prescription for a patient
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handlePrescribeMedication(); }} className="space-y-4">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="patient-select">
                        Patient <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newMedication.patientId}
                        onValueChange={(value) => setNewMedication({ ...newMedication, patientId: value })}
                        required
                      >
                        <SelectTrigger id="patient-select">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {linkedPatients.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No linked patients
                            </SelectItem>
                          ) : (
                            linkedPatients.map(patient => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name} (ID: {patient.id})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Medication Name & Dosage */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="med-name">
                          Medication Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="med-name"
                          placeholder="e.g., Amlodipine"
                          value={newMedication.medicationName}
                          onChange={(e) => setNewMedication({ ...newMedication, medicationName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosage">
                          Dosage <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dosage"
                          placeholder="e.g., 5mg"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Frequency & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">
                          Frequency <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={newMedication.frequency}
                          onValueChange={(value) => setNewMedication({ ...newMedication, frequency: value })}
                          required
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once daily</SelectItem>
                            <SelectItem value="twice">Twice daily</SelectItem>
                            <SelectItem value="thrice">Three times daily</SelectItem>
                            <SelectItem value="four_times">Four times daily</SelectItem>
                            <SelectItem value="weekly">Once weekly</SelectItem>
                            <SelectItem value="as_needed">As needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">
                          Duration <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 30 days or 2 weeks"
                          value={newMedication.duration}
                          onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="start-date">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newMedication.startDate}
                        onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                        required
                      />
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="instructions">
                        Instructions for Patient
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="e.g., Take with food. Avoid alcohol. Do not drive after taking this medication..."
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={prescribingMedication}
                      >
                        {prescribingMedication ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Prescribing...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Prescribe Medication
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setNewMedication({
                            patientId: '',
                            medicationName: '',
                            dosage: '',
                            frequency: '',
                            duration: '',
                            instructions: '',
                            startDate: new Date().toISOString().split('T')[0]
                          });
                          setIsPrescriptionOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>





              <Dialog open={isAddHealthMetricsOpen} onOpenChange={setIsAddHealthMetricsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    // console.log("Add Health Metrics clicked");
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
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingRecordsCount ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-2" />
                        <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className="flex items-center">
                        {recordsCount}
                        {/* Optional: Add a refresh button */}
                        {/* <button
                          onClick={fetchRecordsCount}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          title="Refresh count"
                        >
                          ↻
                        </button> */}
                      </span>
                    )}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">{totalPrescriptions}</p>
                  <p className="text-sm text-gray-600">Total Prescriptions</p>
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
                  {isLoadingAppointments ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs text-gray-500 mt-2">Loading schedule...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-6">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No appointments today</p>
                    </div>
                  ) : (
                    todayAppointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{appointment.patient_name}</h4>
                            <p className="text-sm text-gray-600">
                              {appointment.appointment_type} • 30 min
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatTime(appointment.appointment_time)}</p>
                            <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                              {appointment.status === 'pending' ? '⏳ Pending' : '✅ Confirmed'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {todayAppointments.length > 5 && (
                    <p className="text-xs text-center text-gray-500 pt-2">
                      +{todayAppointments.length - 5} more appointments
                    </p>
                  )}
                </CardContent>

              </Card>

              {/* Pending Appointment Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Pending Requests
                    </div>
                    {pendingAppointments.length > 0 && (
                      <Badge variant="destructive">{pendingAppointments.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Appointments waiting for confirmation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingAppointments.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No pending requests</p>
                    </div>
                  ) : (
                    pendingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{appointment.patient_name}</h4>
                            <p className="text-sm text-gray-600">
                              {appointment.appointment_type}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at {formatTime(appointment.appointment_time)}
                            </p>
                            {appointment.reason && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Reason: {appointment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsConfirmDialogOpen(true);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {pendingAppointments.length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('appointments')}
                    >
                      View All {pendingAppointments.length} Requests
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Recent Patient Updates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Recent Patient Activities
                    </div>
                    {recentActivities.length > 0 && (
                      <Badge variant="secondary">{recentActivities.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest patient updates and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs text-gray-500 mt-2">Loading activities...</p>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No recent activities</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {recentActivities.slice(0, 10).map((activity, index) => (
                        <div key={`${activity.activity_type}-${activity.id}-${index}`} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getActivityColor(activity.priority)}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.activity_title} - {activity.patient_name}
                            </p>
                            {activity.activity_description && (
                              <p className="text-xs text-gray-600 truncate">
                                {activity.activity_description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getTimeAgo(activity.activity_time)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
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
                            variant="outline"
                            onClick={() => handleViewPatient(patient.id)}
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
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reject Appointment</DialogTitle>
                    <DialogDescription>
                      Provide a reason for rejecting this appointment
                    </DialogDescription>
                  </DialogHeader>

                  {selectedAppointment && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded space-y-2">
                        <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
                        <p><strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reject-reason">
                          Reason for Rejection <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="reject-reason"
                          placeholder="Please provide a reason (e.g., Not available at this time, Emergency case, etc.)"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="destructive"
                          onClick={handleRejectAppointment}
                          disabled={processingAction || !actionNotes.trim()}
                          className="flex-1"
                        >
                          {processingAction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Reject Appointment
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRejectDialogOpen(false);
                            setActionNotes('');
                            setSelectedAppointment(null);
                          }}
                          disabled={processingAction}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                          <div className="text-sm">
                            {searchQuery ? 'Try adjusting your search terms' : 'No patients are currently linked to your account'}
                          </div>
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchQuery('')}
                              className="mt-2"
                            >
                              Clear search
                            </Button>
                          )}
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
                                  {/* ENSURE THESE ARE <div> NOT <p> */}
                                  <div className="text-sm text-gray-600">ID: {patient.id} • Age: {patient.age}</div>
                                  <div className="text-sm text-gray-600">Blood Group: {patient.bloodGroup} • Last Visit: {formatDate(patient.lastVisit)}</div>
                                  <div className="text-sm text-gray-600">Condition: {patient.condition}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-3">
                                  <Badge className={getStatusColor(patient.status)}>
                                    {patient.status}
                                  </Badge>

                                  {/* Show risk factors */}
                                  {patient.riskFactors && patient.riskFactors.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      ({patient.riskFactors.length} risk factor{patient.riskFactors.length !== 1 ? 's' : ''})
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewPatient(patient.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  {/* <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      alert(`Edit form for ${patient.name} would open here`);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button> */}
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
            
             <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Patient Details</DialogTitle>
                  </DialogHeader>

                  {loadingPatientDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : viewingPatient ? (
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className="flex items-start space-x-4 pb-4 border-b">
                        <Avatar className="w-20 h-20">
                          {viewingPatient.profilePicture || viewingPatient.profile_img ? (
                            <img
                              src={viewingPatient.profilePicture || `http://localhost:5000${viewingPatient.profile_img}`}
                              alt={viewingPatient.name || `${viewingPatient.firstName} ${viewingPatient.lastName}`}
                            />
                          ) : (
                            <AvatarFallback className="text-2xl">
                              {viewingPatient.firstName?.[0]}{viewingPatient.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">
                            {viewingPatient.name || `${viewingPatient.firstName} ${viewingPatient.lastName}`}
                          </h3>
                          <p className="text-sm text-gray-600">Patient ID: {viewingPatient.id}</p>
                          <div className="flex gap-2 mt-2">
                            {viewingPatient.gender && <Badge>{viewingPatient.gender}</Badge>}
                            {viewingPatient.age && (
                              <Badge variant="outline">{viewingPatient.age} years</Badge>
                            )}
                            {viewingPatient.bloodGroup && (
                              <Badge variant="outline">Blood Group: {viewingPatient.bloodGroup}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{viewingPatient.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{viewingPatient.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date of Birth</p>
                            <p className="font-medium">
                              {viewingPatient.dateOfBirth
                                ? new Date(viewingPatient.dateOfBirth).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Gender</p>
                            <p className="font-medium">{viewingPatient.gender || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      {(viewingPatient.address || viewingPatient.city || viewingPatient.state) && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Address
                          </h4>
                          <p className="text-gray-700">
                            {viewingPatient.address && <>{viewingPatient.address}<br /></>}
                            {viewingPatient.city && viewingPatient.state &&
                              `${viewingPatient.city}, ${viewingPatient.state}`
                            }
                            {viewingPatient.pincode && ` - ${viewingPatient.pincode}`}
                          </p>
                        </div>
                      )}

                      {/* Emergency Contact */}
                      {(viewingPatient.emergencyContact || viewingPatient.emergencyPhone) && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            Emergency Contact
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Contact Name</p>
                              <p className="font-medium">{viewingPatient.emergencyContact || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Contact Phone</p>
                              <p className="font-medium">{viewingPatient.emergencyPhone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Medical Information */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Medical Information
                        </h4>
                        <div className="space-y-3">
                          {viewingPatient.bloodGroup && (
                            <div>
                              <p className="text-sm text-gray-600">Blood Group</p>
                              <p className="font-medium">{viewingPatient.bloodGroup}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-600">Allergies</p>
                            <p className="font-medium">{viewingPatient.allergies || 'None reported'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Medical History</p>
                            <p className="font-medium">{viewingPatient.medicalHistory || 'No history recorded'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Registration Date */}
                      <div className="pt-4 border-t text-sm text-gray-600">
                        <p>Registered on: {new Date(viewingPatient.createdAt || viewingPatient.created_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>
              
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>Manage your schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-gray-600">Loading appointments...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-800 mb-2">No Appointments Today</h3>
                      <p className="text-sm text-gray-600">
                        You have no scheduled appointments for today
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-lg">{appointment.patient_name}</h4>
                                <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                                  {appointment.status === 'pending' ? '⏳ Pending' : '✅ Confirmed'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                <div className="space-y-1">
                                  <p className="text-gray-600">
                                    <strong>Type:</strong> {appointment.appointment_type}
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Time:</strong> {formatTime(appointment.appointment_time)}
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Duration:</strong> 30 minutes
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-600">
                                    <strong>Phone:</strong> {appointment.patient_phone}
                                  </p>
                                  {appointment.patient_blood_group && (
                                    <p className="text-gray-600">
                                      <strong>Blood Group:</strong> {appointment.patient_blood_group}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {appointment.reason && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-3">
                                  <p className="text-sm text-blue-900">
                                    <strong>Reason:</strong> {appointment.reason}
                                  </p>
                                </div>
                              )}

                              {appointment.notes && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-700">
                                    <strong>Notes:</strong> {appointment.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            {appointment.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsCompleteDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Mark as Completed
                              </Button>
                            )}

                            {appointment.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsConfirmDialogOpen(true);
                                  }}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsRejectDialogOpen(true);
                                  }}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {/* <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Navigate to patient details or medical records
                                alert(`View patient details for ${appointment.patient_name}`);
                              }}
                            >
                              <User className="w-3 h-3 mr-1" />
                              View Patient
                            </Button> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Availability Information</span>
                    <Badge variant="secondary">Info</Badge>
                  </CardTitle>
                  <CardDescription>Your working hours and appointment policy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Status */}
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Accepting Appointments
                        </p>
                        <p className="text-sm text-green-800">
                          Patients can request appointments anytime. You'll receive requests for confirmation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Typical Working Hours
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monday - Friday:</span>
                        <span className="font-medium">9:00 AM - 5:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saturday:</span>
                        <span className="font-medium">9:00 AM - 1:00 PM</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Sunday:</span>
                        <span className="font-medium text-red-600">Closed</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic">
                      Note: These are reference hours. You can confirm appointments outside these times if needed.
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-blue-700">{pendingAppointments.length}</p>
                      <p className="text-xs text-blue-600">Pending Requests</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-700">{todayAppointments.length}</p>
                      <p className="text-xs text-green-600">Today's Schedule</p>
                    </div>
                  </div>

                  {/* Future Feature Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Slot Management (Coming Soon)
                  </Button>
                </CardContent>
              </Card>

              {/* Confirm Appointment Dialog */}
              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Appointment</DialogTitle>
                    <DialogDescription>
                      Confirm this appointment and notify the patient
                    </DialogDescription>
                  </DialogHeader>

                  {selectedAppointment && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
                        <p><strong>Type:</strong> {selectedAppointment.appointment_type}</p>
                        <p><strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-notes">Notes for Patient (Optional)</Label>
                        <Textarea
                          id="confirm-notes"
                          placeholder="Add any special instructions or notes..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleConfirmAppointment}
                          disabled={processingAction}
                          className="flex-1"
                        >
                          {processingAction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Confirm Appointment
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsConfirmDialogOpen(false);
                            setActionNotes('');
                            setSelectedAppointment(null);
                          }}
                          disabled={processingAction}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Reject Appointment Dialog */}
              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reject Appointment</DialogTitle>
                    <DialogDescription>
                      Provide a reason for rejecting this appointment
                    </DialogDescription>
                  </DialogHeader>

                  {selectedAppointment && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded space-y-2">
                        <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
                        <p><strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reject-reason">
                          Reason for Rejection <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="reject-reason"
                          placeholder="Please provide a reason (e.g., Not available at this time, Emergency case, etc.)"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="destructive"
                          onClick={handleRejectAppointment}
                          disabled={processingAction || !actionNotes.trim()}
                          className="flex-1"
                        >
                          {processingAction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Reject Appointment
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRejectDialogOpen(false);
                            setActionNotes('');
                            setSelectedAppointment(null);
                          }}
                          disabled={processingAction}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              {/* View Patient Details Dialog */}
              {/* View Patient Details Dialog */}
             
              {/* Complete Appointment Dialog */}
              <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Mark as Completed</DialogTitle>
                    <DialogDescription>
                      Mark this appointment as completed and add consultation notes
                    </DialogDescription>
                  </DialogHeader>

                  {selectedAppointment && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded space-y-2">
                        <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
                        <p><strong>Type:</strong> {selectedAppointment.appointment_type}</p>
                        <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complete-notes">Consultation Summary (Optional)</Label>
                        <Textarea
                          id="complete-notes"
                          placeholder="Add brief summary of consultation, diagnosis, or follow-up instructions..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleCompleteAppointment}
                          disabled={processingAction}
                          className="flex-1"
                        >
                          {processingAction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Completed
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCompleteDialogOpen(false);
                            setActionNotes('');
                            setSelectedAppointment(null);
                          }}
                          disabled={processingAction}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

          </TabsContent>
          {/* -------------------------------------------------------------------------------------------- */}
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
                      <Select value={selectedPatientFilter} onValueChange={setSelectedPatientFilter}>
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

                      <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
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
                    className="w-full"
                    disabled
                  >
                    
                    Upload Results (Coming Soon)
                  </Button>
                      <Button onClick={() => setIsAddRecordOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Record
                      </Button>
                    </div>
                  </div>

                  {/* Loading State */}
                  {isLoadingRecords && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading medical records...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {recordsError && (
                    <div className="text-center py-8">
                      <p className="text-red-600">Error: {recordsError}</p>
                      <Button
                        variant="outline"
                        onClick={fetchMedicalRecords}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {/* No Records State */}
                  {!isLoadingRecords && !recordsError && filteredRecords.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        {medicalRecords.length === 0
                          ? "No medical records found"
                          : "No records match the current filters"
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {medicalRecords.length === 0
                          ? "Add your first medical record to get started!"
                          : "Try adjusting your filter settings."
                        }
                      </p>
                    </div>
                  )}

                  {/* Records List - Scrollable Container */}
                  {!isLoadingRecords && !recordsError && filteredRecords.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                      {filteredRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">
                                  {formatExaminationType(record.examinationType)}
                                </h4>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm font-medium text-blue-600">
                                  {getPatientNameById(record.patientId)}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 mb-2">
                                {formatDate(record.createdAt)} • {generateRecordReference(record)}
                              </p>

                              <div className="space-y-1">
                                <p className="text-sm text-gray-800">
                                  <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                                </p>

                                {record.prescription && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Prescription:</span> {record.prescription}
                                  </p>
                                )}

                                {record.nextCheckupDate && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">Next Checkup:</span> {formatDate(record.nextCheckupDate)}
                                  </p>
                                )}

                                {record.additionalNotes && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">Notes:</span> {record.additionalNotes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col space-y-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => {
                                  alert(`Edit medical record ${generateRecordReference(record)}\nFor: ${getPatientNameById(record.patientId)}\nType: ${formatExaminationType(record.examinationType)}`);
                                  // TODO: Implement edit functionality
                                }}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => {
                                  alert(`Exporting medical record ${generateRecordReference(record)} as PDF...\nDownload will start shortly.`);
                                  // TODO: Implement export functionality
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
