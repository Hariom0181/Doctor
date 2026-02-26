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
import { Camera, Wallet, X } from 'lucide-react';
import { WalletCard } from '@/components/WalletCard';
import { VideoConsultationBooking } from '@/components/VideoConsultationBooking';
import { useAuth } from '@/contexts/AuthContext';



import { FloatingHealthAssistant } from '@/components/FloatingHealthAssistant';

import { Brain } from 'lucide-react';
import { NearbyHospitalsMap } from '@/components/NearbyHospitalsMap';
import { FloatingMapButton } from "@/components/FloatingMapButton";
import { useRef } from "react";

import {

  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  RefreshCw,
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


export default function PatientDashboard() {

  // ------------------------------
  const [activeTab, setActiveTab] = useState("overview"); // <-- Replace with backend: default tab if needed
  // const [patientData, setPatientData] = useState(INITIAL_PATIENT_DATA); // <-- Replace with backend: patient data
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  // <-- Replace with backend: health metrics
  const [recentRecords, setRecentRecords] = useState([]);
  const [isLoadingRecentRecords, setIsLoadingRecentRecords] = useState(false);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);// <-- Replace with backend: appointments
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);
  // <-- Replace with backend: medications
  const [doctorsList, setDoctorsList] = useState([]);
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
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Patient documents state
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAllDoctorRecords, setShowAllDoctorRecords] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<PatientProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Prescriptions/Medications state
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const { logout } = useAuth();


  // Document upload form
  const [documentForm, setDocumentForm] = useState({
    documentType: '',
    documentDate: '',
    hospitalName: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: '',
    reason: '',
    notes: ''
  });




  const tabsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const storedPatientData = localStorage.getItem('userData'); //------------------------------------------------------------------------------------------
        if (storedPatientData) {
          const parsedData = JSON.parse(storedPatientData);

          const transformedData = {
            id: parsedData.id,
            name: `${parsedData.firstName} ${parsedData.lastName}`,
            firstName: parsedData.firstName,
            lastName: parsedData.lastName,
            email: parsedData.email,
            phone: parsedData.phone,
            address: parsedData.address,
            profilePicture: parsedData.profileImage
          };

          // ✅ FIX: Set patient data FIRST
          setPatientData(transformedData);

          // ✅ FIX: Pass ID directly to functions instead of relying on state
          if (parsedData.id) {
            await loadProfileImage(parsedData.id);
            await loadAppointmentsById(parsedData.id);  // ✅ Pass ID
            await loadPatientDocumentsById(parsedData.id);  // ✅ Pass ID
            await loadPrescriptionsById(parsedData.id);  // ✅ Pass ID
            // Add other functions if needed
          }
        } else {
          console.warn('No patient data found in localStorage'); //------------------------------------------------------------------------------------------
        }
      } catch (error) {
        console.error('Error parsing patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, []);


  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && patientData?.id) {
        // console.log('👁️ Tab visible - refreshing data...');
        try {
          await loadAppointments();
          await loadPrescriptions();
          console.log('✅ Visibility refresh complete');
        } catch (error) {
          console.error('❌ Visibility refresh failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // ✅ EMPTY DEPENDENCY

  useEffect(() => {
    fetchMetrics();
  }, []);
  // In your PatientDashboard.tsx
  // Add this to your fetchMetrics function for better debugging
  const fetchMetrics = async () => {
    try {
      const patientToken = localStorage.getItem("token");
      if (!patientToken) {
        console.error("No patient token found.");
        return;
      }
      const response = await fetch(`http://localhost:5000/api/patients/health-metrics`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${patientToken}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setHealthMetrics(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch health metrics:", error);
    }
  };

  const generatePatientId = (id) => {
    return `HMS${new Date().getFullYear()}${String(id).padStart(4, '0')}`;
  };


  const loadPrescriptions = async (patientId?: number) => {
    // console.log('=== LOAD PRESCRIPTIONS START ===');

    // Use passed ID or state ID
    const id = patientId || patientData?.id;

    if (!id) {
      console.log('⚠️ No patient ID, skipping prescription load');
      return;
    }

    console.log('📥 Loading prescriptions for patient:', id);
    setIsLoadingPrescriptions(true);

    try {
      const data = await patientApiService.getPatientPrescriptions(id, 'active');
      // console.log('✅ Prescriptions loaded:', data);
      setPrescriptions(data);
    } catch (error) {
      console.error('❌ Error loading prescriptions:', error);
    } finally {
      setIsLoadingPrescriptions(false);
    }
    // console.log('=== LOAD PRESCRIPTIONS END ===');
  };

  // Create helper function for initial load
  const loadPrescriptionsById = (patientId: number) => loadPrescriptions(patientId);

  // Format frequency for display
  const formatFrequency = (freq: string) => {
    const frequencies: { [key: string]: string } = {
      'once': 'Once daily',
      'twice': 'Twice daily',
      'thrice': 'Three times daily',
      'four_times': 'Four times daily',
      'weekly': 'Once weekly',
      'as_needed': 'As needed'
    };
    return frequencies[freq] || freq;
  };


  // Load patient documents
  const loadPatientDocuments = async (patientId?: number) => {
    // Use passed ID or state ID
    const id = patientId || patientData?.id;

    if (!id) return;

    // console.log('📄 Loading patient documents for:', id);
    setIsLoadingDocuments(true);

    try {
      const docs = await patientApiService.getPatientDocuments(id);
      // console.log('📄 Documents loaded:', docs);
      setPatientDocuments(docs);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Create helper function for initial load
  const loadPatientDocumentsById = (patientId: number) => loadPatientDocuments(patientId);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload PDF or image files only (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  // Handle document upload
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientData?.id) {
      alert('Patient data not found');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!documentForm.documentType || !documentForm.documentDate) {
      alert('Please fill in document type and date');
      return;
    }

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('patientId', patientData.id.toString());
      formData.append('documentType', documentForm.documentType);
      formData.append('documentDate', documentForm.documentDate);
      formData.append('hospitalName', documentForm.hospitalName);
      formData.append('notes', documentForm.notes);

      const result = await patientApiService.uploadPatientDocument(formData);

      if (result.success) {
        alert('✅ Document uploaded successfully!');

        // Reset form
        setDocumentForm({
          documentType: '',
          documentDate: '',
          hospitalName: '',
          notes: ''
        });
        setSelectedFile(null);

        // Reset file input
        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Reload documents
        await loadPatientDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('❌ Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Handle document delete
  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${documentName}"?`);

    if (!confirmDelete) return;

    try {
      const success = await patientApiService.deletePatientDocument(documentId);

      if (success) {
        alert('✅ Document deleted successfully');
        await loadPatientDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('❌ Failed to delete document');
    }
  };
  // Function to load and view patient details
  const handleViewPatient = async (patientId: number) => {
    try {
      setLoadingPatientDetails(true);
      setIsViewDialogOpen(true);

      const details = await patientApiService.getPatientDetails(patientId, 'patient');
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
  // Format document type for display
  const formatDocumentType = (type: string) => {
    const types: { [key: string]: string } = {
      'lab_report': '🧪 Lab Report',
      'xray': '📷 X-Ray/Scan',
      'prescription': '💊 Prescription',
      'discharge_summary': '📋 Discharge Summary',
      'vaccination': '💉 Vaccination Record',
      'other': '📄 Other Document'
    };
    return types[type] || type;
  };



  // Load profile image function
  const loadProfileImage = async (patientId: number) => {
    try {
      const imageUrl = await patientApiService.getProfileImage(patientId);
      if (imageUrl) {
        setProfileImageUrl(imageUrl);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };


  const openAppointmentDialog = (appointmentType: string) => {
    setAppointmentForm({
      ...appointmentForm,
      appointmentType: appointmentType
    });
    setIsAppointmentDialogOpen(true);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientData?.id) {
      alert('Patient data not found. Please log in again.');
      return;
    }

    if (!appointmentForm.doctorId) {
      alert('Please select a doctor');
      return;
    }

    setBookingAppointment(true);

    try {
      const result = await patientApiService.bookAppointment({
        patientId: patientData.id,
        doctorId: parseInt(appointmentForm.doctorId),
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        appointmentType: appointmentForm.appointmentType,
        reason: appointmentForm.reason,
        notes: appointmentForm.notes
      });

      if (result.success) {
        alert('✅ Appointment booked successfully! You will receive confirmation soon.');

        // Reset form
        setAppointmentForm({
          doctorId: '',
          appointmentDate: '',
          appointmentTime: '',
          appointmentType: '',
          reason: '',
          notes: ''
        });
        // Close dialog
        setIsAppointmentDialogOpen(false);

        // Reload appointments
        loadAppointments();
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('❌ Failed to book appointment. Please try again.');
    } finally {
      setBookingAppointment(false);
    }
  };

  const loadAppointments = async (patientId?: number) => {
    // console.log('=== LOAD APPOINTMENTS START ===');

    // Use passed ID or state ID
    const id = patientId || patientData?.id;

    if (!id) {
      console.log('❌ No patient ID');
      return;
    }

    // console.log('📅 Loading appointments for patient:', id);
    setIsLoadingAppointments(true);

    try {
      const appointmentsData = await patientApiService.getPatientAppointments(id);
      // console.log('📊 All appointments from API:', appointmentsData);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const upcoming = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      });

      // console.log('✅ Upcoming appointments:', upcoming);
      setUpcomingAppointments(upcoming);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
    // console.log('=== LOAD APPOINTMENTS END ===');
  };

  // Create helper function for initial load
  const loadAppointmentsById = (patientId: number) => loadAppointments(patientId);

  const handleCancelAppointment = async (appointmentId: number) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this appointment?');

    if (!confirmCancel) return;

    try {
      const success = await patientApiService.cancelAppointment(appointmentId);

      if (success) {
        alert('✅ Appointment cancelled successfully');
        await loadAppointments(); // Reload appointments
      } else {
        alert('❌ Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('❌ Error cancelling appointment');
    }
  };
  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'; // Blue
      case 'pending':
        return 'secondary'; // Gray
      case 'completed':
        return 'outline'; // Outline
      case 'cancelled':
        return 'destructive'; // Red
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending';
      case 'confirmed':
        return '✅ Confirmed';
      case 'completed':
        return '✔️ Completed';
      case 'cancelled':
        return '❌ Cancelled';
      default:
        return status;
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const result = await patientApiService.uploadProfileImage(patientData.id, file);

      if (result.success) {
        // ✅ Use Cloudinary URL directly (no localhost prefix)
        setProfileImageUrl(result.profileImagePath);
        setPatientData({
          ...patientData,
          profilePicture: result.profileImagePath
        });

        console.log('✅ Profile image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
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

      const patientData = JSON.parse(localStorage.getItem('userData') || '{}'); //------------------------------------------------------------------------------------------
      const patientId = patientData.id;

      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      // console.log('🏥 Fetching medical records for patient:', patientId);
      const records = await patientApiService.getMedicalRecords(patientId);

      // console.log('📄 Fetched medical records:', records);
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

        // console.log('Using current patient ID:', patientId);

        const doctors = await patientApiService.getLinkedDoctors();
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


  useEffect(() => {
    const fetchAvailableDoctors = async () => {

      setIsLoadingAvailableDoctors(true);

      try {
        const doctors = await patientApiService.getAvailableDoctors();

        setAvailableDoctors(doctors);


        if (doctors.length > 0) {
          const transformedDoctors = doctors.map(doctor => ({
            id: doctor.id.toString(),
            name: doctor.name,
            specialization: doctor.specialization
          }));

          setDoctorsList(transformedDoctors);

        } else {
          console.log('⚠️ No doctors found in API response');
        }
      } catch (error) {
        console.error('❌ Failed to fetch available doctors:', error);

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
    const patientData = localStorage.getItem("userData"); //------------------------------------------------------------------------------------------
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
    console.log('Updating to doctor ID:', doctorId);

    // ✅ Remove patientId - service uses token now
    await patientApiService.updateDoctorRelationship(doctorId);

    // ✅ Remove patientId here too
    const doctors = await patientApiService.getLinkedDoctors();
    setLinkedDoctors(doctors);

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
                  tabsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`font-medium transition-colors ${activeTab === "overview" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Overview
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("records");
                  tabsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`font-medium transition-colors ${activeTab === "records" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Records
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // console.log("Clicking Appointments button");
                  setActiveTab("appointments");
                  tabsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`font-medium transition-colors ${activeTab === "appointments" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Appointments
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("medications")
                  tabsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`font-medium transition-colors ${activeTab === "medications" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                Medications
              </button>
              <div className="flex items-center space-x-3 ml-6 border-l pl-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to logout?")) {
                      window.location.href = "/patient/login";
                      logout();
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
                {/* Profile Image Section with Upload */}
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
                          alt={`${patientData.firstName} ${patientData.lastName}`}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-semibold">
                          {patientData.firstName.charAt(0)}{patientData.lastName.charAt(0)}
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

                {/* Patient Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {patientData.name}
                  </h1>
                  <p className="text-gray-600">
                    Patient ID: {generatePatientId(patientData.id)}
                  </p>

                  {/* Error message below patient ID */}
                  {imageUploadError && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {imageUploadError}
                    </p>
                  )}
                </div>
              </div>



              {/* <Button
                onClick={() => {
                  alert("Book Appointment\n\nSelect your preferred:\n• Date & Time\n• Doctor specialization\n• Appointment type\n\nYour appointment request will be sent to the healthcare center for confirmation.");
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button> */}
              <div className="flex space-x-3">

                <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsAppointmentDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Book New Appointment</DialogTitle>
                      <DialogDescription>
                        Schedule an appointment with your doctor
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                      {/* Doctor Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="appointment-doctor">
                          Select Doctor <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={appointmentForm.doctorId}
                          onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctorId: value })}
                          required
                        >
                          <SelectTrigger id="appointment-doctor">
                            <SelectValue placeholder="Choose a doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {linkedDoctors.length > 0 ? (
                              linkedDoctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                  {doctor.name} - {doctor.specialization}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No linked doctors. Please link a doctor first.
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Appointment Type */}
                      <div className="space-y-2">
                        <Label htmlFor="appointment-type">
                          Appointment Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={appointmentForm.appointmentType}
                          onValueChange={(value) => setAppointmentForm({ ...appointmentForm, appointmentType: value })}
                          required
                        >
                          <SelectTrigger id="appointment-type">
                            <SelectValue placeholder="Select appointment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General Checkup">🩺 General Checkup</SelectItem>
                            <SelectItem value="Follow-up Visit">📋 Follow-up Visit</SelectItem>
                            <SelectItem value="Specialist Consultation">👨‍⚕️ Specialist Consultation</SelectItem>
                            <SelectItem value="Lab Tests">🧪 Lab Tests</SelectItem>
                            <SelectItem value="Vaccination">💉 Vaccination</SelectItem>
                            <SelectItem value="Emergency">🚨 Emergency</SelectItem>
                            <SelectItem value="Other">📄 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointment-date">
                            Appointment Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="appointment-date"
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={appointmentForm.appointmentDate}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="appointment-time">
                            Preferred Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="appointment-time"
                            type="time"
                            value={appointmentForm.appointmentTime}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <Label htmlFor="appointment-reason">
                          Reason for Visit <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="appointment-reason"
                          placeholder="Describe your symptoms or reason for the appointment..."
                          value={appointmentForm.reason}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                          className="min-h-[100px]"
                          required
                        />
                      </div>

                      {/* Additional Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="appointment-notes">
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          id="appointment-notes"
                          placeholder="Any other information the doctor should know..."
                          value={appointmentForm.notes}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={bookingAppointment}
                        >
                          {bookingAppointment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Appointment
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setAppointmentForm({
                              doctorId: '',
                              appointmentDate: '',
                              appointmentTime: '',
                              appointmentType: '',
                              reason: '',
                              notes: ''
                            });
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>



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
                        {['Blood Pressure', 'Temperature', 'Weight', 'Heart Rate'][index]}
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
          {/* {patientData?.id && (
            <WalletCard patientId={patientData.id} />
          )} */}
          {/* {patientData?.id && (
            <VideoConsultationBooking patientId={patientData?.id} />
          )} */}
          {/* {patientData?.id && (
            <MedicalReportAnalyzer patientId={patientData?.id} />
          )}
 */}

        </div>
        <div ref={tabsRef}>
          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="records">Medical Records</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="wallet">Video Consultation</TabsTrigger>
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
                        <div
                          key={record.id}
                          className="
    relative
    border rounded-lg
    px-4 py-3
    bg-white
    hover:bg-muted/30
    transition
  "
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-3">
                            {/* LEFT — text container (CRITICAL FIX) */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-base truncate">
                                  {record.type}
                                </h4>
                                <Badge className={getStatusColor(record.status)}>
                                  {record.status}
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-600 truncate">
                                {record.doctor} • {record.currentHospital}
                              </p>

                              <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                                {record.diagnosis}
                              </p>
                            </div>

                            {/* RIGHT — date (FIXED WIDTH) */}
                            <div className="text-sm text-gray-500 shrink-0 whitespace-nowrap">
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Bottom row */}
                          {record.nextCheckup && (
                            <p className="mt-2 text-sm text-primary font-medium">
                              Next checkup:{" "}
                              {new Date(record.nextCheckup).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                      )

                      )
                    ) : (
                      <div className="text-center py-4 text-gray-500">No recent records available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <CardContent className="max-h-60 overflow-y-auto">
                  {isLoadingAppointments ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs text-gray-500 mt-2">Loading appointments...</p>
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="text-center py-6">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">No upcoming appointments</p>
                      <Button
                        size="sm"
                        onClick={() => setIsAppointmentDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{appointment.appointment_type}</h4>
                              <p className="text-sm text-gray-600">{appointment.doctor_name}</p>
                              <p className="text-sm text-gray-600">{appointment.current_hospital}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.appointment_time}</p>
                              <Badge
                                variant={getAppointmentStatusBadge(appointment.status)}
                                className="mt-1"
                              >
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                      {upcomingAppointments.length > 3 && (
                        <p className="text-xs text-center text-gray-500 pt-2">
                          +{upcomingAppointments.length - 3} more appointments
                        </p>
                      )}

                      <Button
                        className="w-full mt-3"
                        variant="outline"
                        onClick={() => setActiveTab('appointments')}
                      >
                        View All Appointments
                      </Button>
                    </div>
                  )}
                </CardContent>
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
                  {isLoadingPrescriptions ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs text-gray-500 mt-2">Loading medications...</p>
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-6">
                      <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No active medications</p>
                      <p className="text-xs text-gray-500">Your prescribed medications will appear here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescriptions.slice(0, 4).map((med) => (
                        <div
                          key={med.id}
                          className="
                                    border rounded-md px-3 py-2
                                    bg-white
                                    flex items-center justify-between
                                    hover:bg-muted/40 transition
                                   "
                        >
                          {/* Left: Medication info */}
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 leading-tight">
                              {med.medication_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {med.dosage} • {formatFrequency(med.frequency)}
                            </p>
                          </div>

                          {/* Right: Status */}
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                            Active
                          </Badge>
                        </div>
                      ))}

                    </div>
                  )}

                  {prescriptions.length > 4 && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setActiveTab('medications')}
                    >
                      View All Medications ({prescriptions.length})
                    </Button>
                  )}
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
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                      <SelectItem value="lab-report">🧪 Lab Report</SelectItem>
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

                              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-200 bg-primary/5">
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
                    {/* Medical Records List */}
                    {!isLoadingMedicalRecords && !medicalRecordsError && medicalRecords.length > 0 && (
                      <div className="space-y-4">
                        <div className="max-h-96 overflow-y-auto space-y-4">
                          {(showAllDoctorRecords ? medicalRecords : medicalRecords.slice(0, 3)).map((record) => (
                            <div key={record.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">

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

                        {/* View All / Show Less Button */}
                        {medicalRecords.length > 3 && (
                          <div className="text-center pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowAllDoctorRecords(!showAllDoctorRecords)}
                            >
                              {showAllDoctorRecords ? (
                                <>
                                  Show Less
                                  <ChevronUp className="w-4 h-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  View All {medicalRecords.length} Records
                                  <ChevronDown className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}


                  </div>

                  {/* Patient Records */}
                  {/* Patient Records */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      📤 My Health Documents
                    </h3>

                    {/* Upload Form */}
                    <Card className="bg-blue-50/50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Upload Your Medical Document</CardTitle>
                        <CardDescription>
                          Upload lab reports, X-rays, prescriptions, or other medical documents
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleDocumentUpload} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Document Type */}
                            <div className="space-y-2">
                              <Label htmlFor="doc-type">
                                Document Type <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={documentForm.documentType}
                                onValueChange={(value) => setDocumentForm({ ...documentForm, documentType: value })}
                                required
                              >
                                <SelectTrigger id="doc-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lab_report">🧪 Lab Report</SelectItem>
                                  <SelectItem value="xray">📷 X-Ray/Scan</SelectItem>
                                  <SelectItem value="prescription">💊 Prescription</SelectItem>
                                  <SelectItem value="discharge_summary">📋 Discharge Summary</SelectItem>
                                  <SelectItem value="vaccination">💉 Vaccination Record</SelectItem>
                                  <SelectItem value="other">📄 Other Document</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Document Date */}
                            <div className="space-y-2">
                              <Label htmlFor="doc-date">
                                Document Date <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="doc-date"
                                type="date"
                                value={documentForm.documentDate}
                                onChange={(e) => setDocumentForm({ ...documentForm, documentDate: e.target.value })}
                                max={new Date().toISOString().split('T')[0]}
                                required
                              />
                            </div>
                          </div>

                          {/* Hospital Name */}
                          <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital/Clinic Name (Optional)</Label>
                            <Input
                              id="hospital"
                              placeholder="Enter hospital or clinic name"
                              value={documentForm.hospitalName}
                              onChange={(e) => setDocumentForm({ ...documentForm, hospitalName: e.target.value })}
                            />
                          </div>

                          {/* File Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="document-upload">
                              Upload File <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="document-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                                onChange={handleFileSelect}
                                required
                                className="flex-1"
                              />
                              {selectedFile && (
                                <Badge variant="secondary">
                                  {selectedFile.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Supported: PDF, JPG, PNG, GIF (Max 10MB)
                            </p>
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            <Label htmlFor="doc-notes">Additional Notes (Optional)</Label>
                            <Textarea
                              id="doc-notes"
                              placeholder="Add any relevant notes..."
                              value={documentForm.notes}
                              onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                              rows={3}
                            />
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={uploadingDocument}
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Uploaded Documents List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Your Uploaded Documents ({patientDocuments.length})</h4>

                      {isLoadingDocuments ? (
                        <div className="text-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                        </div>
                      ) : patientDocuments.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No documents uploaded yet</p>
                          <p className="text-sm text-gray-400">Upload your first medical document above</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {patientDocuments.map((doc) => (
                            <div key={doc.id} className="border border-green-200 rounded-lg p-4 bg-green-50/50 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold">{formatDocumentType(doc.document_type)}</h4>
                                    <Badge className="bg-green-100 text-green-800">Self-Uploaded</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    <strong>File:</strong> {doc.document_name}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-1">
                                    <strong>Date:</strong> {new Date(doc.document_date).toLocaleDateString()}
                                  </p>
                                  {doc.hospital_name && (
                                    <p className="text-sm text-gray-600 mb-1">
                                      <strong>Hospital:</strong> {doc.hospital_name}
                                    </p>
                                  )}
                                  {doc.notes && (
                                    <p className="text-sm text-gray-500 mt-2 italic">{doc.notes}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="flex flex-col space-y-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      // Use backend proxy instead of direct Cloudinary URL
                                      link.href = `/api/documents/download/${doc.id}`;
                                      link.download = doc.document_name || 'document';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>

                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                    {isLoadingAppointments ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-gray-600">Loading appointments...</p>
                      </div>
                    ) : upcomingAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-800 mb-2">No Upcoming Appointments</h3>
                        <p className="text-sm text-gray-600 mb-4">You don't have any scheduled appointments.</p>
                        <Button
                          size="sm"
                          onClick={() => setIsAppointmentDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingAppointments.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium">{appointment.appointment_type}</h4>
                                  <Badge variant={getAppointmentStatusBadge(appointment.status)}>
                                    {getStatusLabel(appointment.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Stethoscope className="w-4 h-4 mr-1" />
                                  {appointment.doctor_name}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {appointment.current_hospital}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })} at {appointment.appointment_time}
                                </p>
                                {appointment.reason && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    Reason: {appointment.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {appointment.status === 'cancelled' && 'This appointment was cancelled'}
                                  {appointment.status === 'completed' && 'This appointment is completed'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>



                <Card>
                  <CardHeader>
                    <CardTitle>Book New Appointment</CardTitle>
                    <CardDescription>Schedule your next visit</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => openAppointmentDialog('General Checkup')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        General Checkup
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => openAppointmentDialog('Lab Tests')}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Lab Tests
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => openAppointmentDialog('Specialist Consultation')}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Specialist Consultation
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => openAppointmentDialog('Follow-up Visit')}
                      >
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
                <CardContent>
                  {isLoadingPrescriptions ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-gray-600">Loading your medications...</p>
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-800 mb-2">No Active Medications</h3>
                      <p className="text-sm text-gray-600">
                        Your prescribed medications will appear here when doctors add them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((med) => (
                        <div
                          key={med.id}
                          className="border rounded-lg p-4 bg-white hover:shadow-sm transition"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-base flex items-center gap-2">
                                <Pill className="w-4 h-4 text-primary" />
                                {med.medication_name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {med.dosage} · {formatFrequency(med.frequency)}
                              </p>
                            </div>

                            <Badge className="bg-green-100 text-green-800 text-xs px-3 py-1">
                              {med.status === "active" ? "Active" : med.status}
                            </Badge>
                          </div>

                          {/* Meta info */}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                            <span>🗓 {med.duration}</span>
                            <span>👨‍⚕️ {med.doctor_name}</span>
                            <span>
                              📅 Started{" "}
                              {new Date(med.start_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>

                          {/* Instructions (compact) */}
                          {med.instructions && (
                            <div className="mt-3 bg-blue-50 rounded-md p-3 text-sm text-blue-800">
                              <span className="font-medium">Instructions:</span>{" "}
                              {med.instructions}
                            </div>
                          )}
                        </div>
                      )


                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* <TabsContent value="map">
              <NearbyHospitalsMap
                linkedDoctor={linkedDoctors[0] ? {
                  id: linkedDoctors[0].id,
                  name: linkedDoctors[0].name,
                  specialization: linkedDoctors[0].specialization,
                  hospital: linkedDoctors[0].hospital,
                  latitude: 19.0760, // TODO: Get from database
                  longitude: 72.8777
                } : undefined}
              />
            </TabsContent> */}
            <TabsContent value="wallet">
              <div></div>

              {patientData?.id && (
                <WalletCard patientId={patientData.id} />
              )}
              {patientData?.id && (
                <VideoConsultationBooking patientId={patientData?.id} />
              )}

            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">

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
                                {/* {console.log('⚠️ No doctors in doctorsList state, length:', doctorsList.length)} */}
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
            {/* AI Analysis Card */}
            {linkedDoctors.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Health Analysis
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered insights about your health status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>About AI Analysis:</strong> Our AI analyzes your complete medical history,
                      recent visits, diagnoses, and vital signs to calculate a comprehensive health risk score
                      and provide personalized insights.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">What's Analyzed:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Age and medical history</li>
                      <li>• Recent diagnoses and prescriptions</li>
                      <li>• Visit frequency (last 3 months)</li>
                      <li>• Identified health patterns</li>
                      <li>• Chronic conditions and allergies</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2">
                      <strong>Note:</strong> Your doctor needs to trigger this analysis.
                      Contact Dr. {linkedDoctors[0].name} to request an AI health assessment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Health Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Please link with a doctor first to access AI health analysis.
                  </p>
                </CardContent>
              </Card>
            )
            }
          </Tabs>
        </div>

        {patientData?.id && (
          <FloatingHealthAssistant patientId={patientData.id} />
        )}

        <FloatingMapButton onClick={() => setOpenMap(true)} />


        <Dialog open={openMap} onOpenChange={setOpenMap}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <NearbyHospitalsMap
              linkedDoctor={linkedDoctors[0] ? {
                id: linkedDoctors[0].id,
                name: linkedDoctors[0].name,
                specialization: linkedDoctors[0].specialization,
                hospital: linkedDoctors[0].hospital,
                latitude: 19.0760,
                longitude: 72.8777
              } : undefined}
            />
          </DialogContent>
        </Dialog>

        {/* 
        <Dialog open={openMap} onOpenChange={setOpenMap}>
          <NearbyHospitalsMap
            linkedDoctor={linkedDoctors[0] ? {
              id: linkedDoctors[0].id,
              name: linkedDoctors[0].name,
              specialization: linkedDoctors[0].specialization,
              hospital: linkedDoctors[0].hospital,
              latitude: 19.0760,
              longitude: 72.8777
            } : undefined}
          />
        </Dialog> */}

        {/* <Dialog open={openChat} onOpenChange={setOpenChat}>
          <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden">
            <MedicalReportAnalyzer patientId={patientData.id} />
          </DialogContent>
        </Dialog>


        <FloatingActions
          onOpenMap={() => setOpenMap(true)}
          onOpenChat={() => setOpenChat(true)}
        /> */}


        {/* Emergency Banner */}
        <Card className="mt-8 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Emergency Helpline</h3>
                <p className="text-sm text-red-700">
                  Medical Advice Service, Govt. of Maharashtra <strong>104</strong> (24/7 available) <br />
                  Women Crisis Response Center <strong>1091</strong> (24/7 available) <br />

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