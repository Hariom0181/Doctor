import { useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WalletCard } from "@/components/WalletCard";
import { VideoConsultationBooking } from "@/components/VideoConsultationBooking";
import { FloatingHealthAssistant } from "@/components/FloatingHealthAssistant";
import { NearbyHospitalsMap } from "@/components/NearbyHospitalsMap";
import { FloatingMapButton } from "@/components/FloatingMapButton";
import { useAuth } from "@/contexts/AuthContext";

// ── Page Components ──
import { DashboardHeader } from "@/components/DashboardHeader";
import { PatientWelcomeSection } from "@/components/PatientWelcomeSection";
import { PatientHealthMetricsGrid } from "@/components/PatientHealthMetricsGrid";
import { PatientHealthcareTeam } from "@/components/PatientHealthcareTeam";
import { PatientOverviewTab } from "@/components/PatientOverviewTab";
import { PatientRecordsTab } from "@/components/PatientRecordsTab";
import { PatientAppointmentsTab } from "@/components/PatientAppointmentsTab";
import { PatientMedicationsTab } from "@/components/PatientMedicationsTab";
import { PatientProfileTab } from "@/components/PatientProfileTab";
import { PatientAIHealthCard } from "@/components/PatientAIHealthCard";
import { PatientEmergencyBanner } from "@/components/PatientEmergencyBanner";

// ── Icons ──
import {
  LayoutDashboard, FileText, Calendar,
  Pill, Video, User
} from "lucide-react";

// ── Services & Types ──
import {
  patientApiService,
  LinkedDoctor,
  AvailableDoctor,
  PatientMedicalRecord,
  PatientProfile
} from "@/services/patientApi";

// ── Tab config ──
const TABS = [
  { value: "overview",      label: "Overview",          icon: LayoutDashboard },
  { value: "records",       label: "Medical Records",   icon: FileText },
  { value: "appointments",  label: "Appointments",      icon: Calendar },
  { value: "medications",   label: "Medications",       icon: Pill },
  { value: "wallet",        label: "Video Consult",     icon: Video },
  { value: "profile",       label: "Profile",           icon: User },
];

export default function PatientDashboard() {

  // ── State ──
  const [activeTab, setActiveTab] = useState("overview");
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [isLoadingRecentRecords, setIsLoadingRecentRecords] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [linkedDoctors, setLinkedDoctors] = useState<LinkedDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [isLoadingAvailableDoctors, setIsLoadingAvailableDoctors] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecord[]>([]);
  const [isLoadingMedicalRecords, setIsLoadingMedicalRecords] = useState(false);
  const [medicalRecordsError, setMedicalRecordsError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAllDoctorRecords, setShowAllDoctorRecords] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<PatientProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    documentType: '', documentDate: '', hospitalName: '', notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: '', appointmentDate: '', appointmentTime: '',
    appointmentType: '', reason: '', notes: ''
  });

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const { logout } = useAuth();

  // ── Effects ──
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const storedPatientData = localStorage.getItem('userData');
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
          setPatientData(transformedData);
          if (parsedData.id) {
            await loadProfileImage(parsedData.id);
            await loadAppointmentsById(parsedData.id);
            await loadPatientDocumentsById(parsedData.id);
            await loadPrescriptionsById(parsedData.id);
          }
        } else {
          console.warn('No patient data found in localStorage');
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
        try {
          await loadAppointments();
          await loadPrescriptions();
        } catch (error) {
          console.error('Visibility refresh failed:', error);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => { fetchMetrics(); }, []);

  useEffect(() => {
    if (activeTab === "records" || !recentRecords.length) fetchMedicalRecords();
  }, [activeTab]);

  useEffect(() => { fetchMedicalRecords(); }, []);

  useEffect(() => {
    const fetchLinkedDoctors = async () => {
      setIsLoadingDoctors(true);
      setDoctorsError(null);
      try {
        const patientId = getCurrentPatientId();
        if (!patientId) throw new Error('No patient logged in');
        const doctors = await patientApiService.getLinkedDoctors();
        setLinkedDoctors(doctors);
        if (doctors.length > 0) {
          setDoctorsList(doctors.map(d => ({
            id: d.id.toString(), name: d.name, specialization: d.specialization
          })));
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
          setDoctorsList(doctors.map(d => ({
            id: d.id.toString(), name: d.name, specialization: d.specialization
          })));
        }
      } catch (error) {
        console.error('Failed to fetch available doctors:', error);
      } finally {
        setIsLoadingAvailableDoctors(false);
      }
    };
    setTimeout(() => fetchAvailableDoctors(), 100);
  }, []);

  // ── Helpers ──
  const getCurrentPatientId = () => {
    const data = localStorage.getItem("userData");
    if (data) return JSON.parse(data).id?.toString();
    return null;
  };

  const formatFrequency = (freq: string) => {
    const map: { [key: string]: string } = {
      'once': 'Once daily', 'twice': 'Twice daily',
      'thrice': 'Three times daily', 'four_times': 'Four times daily',
      'weekly': 'Once weekly', 'as_needed': 'As needed'
    };
    return map[freq] || freq;
  };

  const formatExaminationType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'general': return 'General Checkup';
      case 'blood':   return 'Blood Test';
      case 'heart':   return 'Heart Screening';
      default: return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Medical Examination';
    }
  };

  const formatDocumentType = (type: string) => {
    const map: { [key: string]: string } = {
      'lab_report': '🧪 Lab Report', 'xray': '📷 X-Ray/Scan',
      'prescription': '💊 Prescription', 'discharge_summary': '📋 Discharge Summary',
      'vaccination': '💉 Vaccination Record', 'other': '📄 Other Document'
    };
    return map[type] || type;
  };

  const getRecordStatus = (record: PatientMedicalRecord) => {
    const diagnosis = record.diagnosis?.toLowerCase() || '';
    if (diagnosis.includes('critical') || diagnosis.includes('urgent')) return 'Critical';
    if (diagnosis.includes('attention') || diagnosis.includes('elevated')) return 'Attention Needed';
    return 'Normal';
  };

  // ── API Calls ──
  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/patients/health-metrics`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) setHealthMetrics(result.data);
    } catch (error) {
      console.error("Failed to fetch health metrics:", error);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setIsLoadingMedicalRecords(true);
      setIsLoadingRecentRecords(true);
      setMedicalRecordsError(null);
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      const patientId = stored.id;
      if (!patientId) throw new Error('Patient ID not found');
      const records = await patientApiService.getMedicalRecords(patientId);
      setMedicalRecords(records);
      setRecentRecords(records.map(record => ({
        id: String(record.id),
        type: formatExaminationType(record.examinationType),
        doctor: record.doctorName || `Doctor ${record.doctorId}`,
        currentHospital: record.currentHospital || 'Hospital Name',
        date: record.createdAt,
        status: getRecordStatus(record),
        diagnosis: record.diagnosis,
        nextCheckup: record.nextCheckupDate || null,
        documents: ['Medical Report']
      })));
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecordsError(error.message);
      setRecentRecords([]);
    } finally {
      setIsLoadingMedicalRecords(false);
      setIsLoadingRecentRecords(false);
    }
  };

  const loadProfileImage = async (patientId: number) => {
    try {
      const imageUrl = await patientApiService.getProfileImage(patientId);
      if (imageUrl) setProfileImageUrl(imageUrl);
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const loadPrescriptions = async (patientId?: number) => {
    const id = patientId || patientData?.id;
    if (!id) return;
    setIsLoadingPrescriptions(true);
    try {
      const data = await patientApiService.getPatientPrescriptions(id, 'active');
      setPrescriptions(data);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };
  const loadPrescriptionsById = (id: number) => loadPrescriptions(id);

  const loadPatientDocuments = async (patientId?: number) => {
    const id = patientId || patientData?.id;
    if (!id) return;
    setIsLoadingDocuments(true);
    try {
      const docs = await patientApiService.getPatientDocuments(id);
      setPatientDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };
  const loadPatientDocumentsById = (id: number) => loadPatientDocuments(id);

  const loadAppointments = async (patientId?: number) => {
    const id = patientId || patientData?.id;
    if (!id) return;
    setIsLoadingAppointments(true);
    try {
      const data = await patientApiService.getPatientAppointments(id);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const upcoming = data.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      });
      setUpcomingAppointments(upcoming);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };
  const loadAppointmentsById = (id: number) => loadAppointments(id);

  // ── Handlers ──
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { setImageUploadError('Please upload a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setImageUploadError('Image size must be less than 5MB'); return; }
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const result = await patientApiService.uploadProfileImage(patientData.id, file);
      if (result.success) {
        setProfileImageUrl(result.profileImagePath);
        setPatientData({ ...patientData, profilePicture: result.profileImagePath });
      }
    } catch (error) {
      setImageUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) { alert('Please upload PDF or image files only'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
    setSelectedFile(file);
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData?.id || !selectedFile) { alert('Please select a file to upload'); return; }
    if (!documentForm.documentType || !documentForm.documentDate) { alert('Please fill in document type and date'); return; }
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
        setDocumentForm({ documentType: '', documentDate: '', hospitalName: '', notes: '' });
        setSelectedFile(null);
        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await loadPatientDocuments();
      }
    } catch (error) {
      alert('❌ Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"?`)) return;
    try {
      const success = await patientApiService.deletePatientDocument(documentId);
      if (success) { alert('✅ Document deleted successfully'); await loadPatientDocuments(); }
    } catch (error) {
      alert('❌ Failed to delete document');
    }
  };

  const openAppointmentDialog = (appointmentType: string) => {
    setAppointmentForm({ ...appointmentForm, appointmentType });
    setIsAppointmentDialogOpen(true);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData?.id) { alert('Patient data not found.'); return; }
    if (!appointmentForm.doctorId) { alert('Please select a doctor'); return; }
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
        alert('✅ Appointment booked successfully!');
        setAppointmentForm({ doctorId: '', appointmentDate: '', appointmentTime: '', appointmentType: '', reason: '', notes: '' });
        setIsAppointmentDialogOpen(false);
        loadAppointments();
      }
    } catch (error) {
      alert('❌ Failed to book appointment.');
    } finally {
      setBookingAppointment(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const success = await patientApiService.cancelAppointment(appointmentId);
      if (success) { alert('✅ Appointment cancelled successfully'); await loadAppointments(); }
      else alert('❌ Failed to cancel appointment');
    } catch (error) {
      alert('❌ Error cancelling appointment');
    }
  };

  const handleDoctorSelection = async (doctorId: string) => {
    if (!doctorId) return;
    try {
      await patientApiService.updateDoctorRelationship(doctorId);
      const doctors = await patientApiService.getLinkedDoctors();
      setLinkedDoctors(doctors);
      alert('Doctor relationship updated successfully!');
    } catch (error) {
      alert('Failed to update doctor relationship.');
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-[#5A6478]">

      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabsRef={tabsRef}
        logout={logout}
      />

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientWelcomeSection
          loading={loading}
          patientData={patientData}
          profileImageUrl={profileImageUrl}
          uploadingImage={uploadingImage}
          imageUploadError={imageUploadError}
          handleImageUpload={handleImageUpload}
          isAppointmentDialogOpen={isAppointmentDialogOpen}
          setIsAppointmentDialogOpen={setIsAppointmentDialogOpen}
          appointmentForm={appointmentForm}
          setAppointmentForm={setAppointmentForm}
          linkedDoctors={linkedDoctors}
          handleAppointmentSubmit={handleAppointmentSubmit}
          bookingAppointment={bookingAppointment}
        />

        <PatientHealthMetricsGrid healthMetrics={healthMetrics} />

        <PatientHealthcareTeam
          linkedDoctors={linkedDoctors}
          isLoadingDoctors={isLoadingDoctors}
          doctorsError={doctorsError}
        />

        {/* ── Tabs ── */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

            {/* TabsList — professional pill style */}
            <TabsList className="h-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-wrap gap-1">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:text-slate-700 hover:bg-slate-50"
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <PatientOverviewTab
                recentRecords={recentRecords}
                isLoadingRecentRecords={isLoadingRecentRecords}
                upcomingAppointments={upcomingAppointments}
                isLoadingAppointments={isLoadingAppointments}
                prescriptions={prescriptions}
                isLoadingPrescriptions={isLoadingPrescriptions}
                setIsAppointmentDialogOpen={setIsAppointmentDialogOpen}
                setActiveTab={setActiveTab}
                formatFrequency={formatFrequency}
              />
            </TabsContent>

            <TabsContent value="records">
              <PatientRecordsTab
                medicalRecords={medicalRecords}
                isLoadingMedicalRecords={isLoadingMedicalRecords}
                medicalRecordsError={medicalRecordsError}
                showAllDoctorRecords={showAllDoctorRecords}
                setShowAllDoctorRecords={setShowAllDoctorRecords}
                fetchMedicalRecords={fetchMedicalRecords}
                patientDocuments={patientDocuments}
                isLoadingDocuments={isLoadingDocuments}
                documentForm={documentForm}
                setDocumentForm={setDocumentForm}
                selectedFile={selectedFile}
                handleFileSelect={handleFileSelect}
                handleDocumentUpload={handleDocumentUpload}
                uploadingDocument={uploadingDocument}
                handleDeleteDocument={handleDeleteDocument}
                formatExaminationType={formatExaminationType}
                getRecordStatus={getRecordStatus}
                formatDocumentType={formatDocumentType}
              />
            </TabsContent>

            <TabsContent value="appointments">
              <PatientAppointmentsTab
                upcomingAppointments={upcomingAppointments}
                isLoadingAppointments={isLoadingAppointments}
                handleCancelAppointment={handleCancelAppointment}
                setIsAppointmentDialogOpen={setIsAppointmentDialogOpen}
                openAppointmentDialog={openAppointmentDialog}
              />
            </TabsContent>

            <TabsContent value="medications">
              <PatientMedicationsTab
                prescriptions={prescriptions}
                isLoadingPrescriptions={isLoadingPrescriptions}
                formatFrequency={formatFrequency}
              />
            </TabsContent>

            <TabsContent value="wallet">
              {patientData?.id && <WalletCard patientId={patientData.id} />}
              {patientData?.id && <VideoConsultationBooking patientId={patientData.id} />}
            </TabsContent>

            <TabsContent value="profile">
              <PatientProfileTab
                patientData={patientData}
                linkedDoctors={linkedDoctors}
                selectedDoctor={selectedDoctor}
                setSelectedDoctor={setSelectedDoctor}
                doctorsList={doctorsList}
                isLoadingAvailableDoctors={isLoadingAvailableDoctors}
                handleDoctorSelection={handleDoctorSelection}
              />
            </TabsContent>

          </Tabs>

          {/* AI Card — OUTSIDE Tabs, INSIDE tabsRef div */}
          <PatientAIHealthCard linkedDoctors={linkedDoctors} />
        </div>

        {/* Floating elements */}
        {patientData?.id && <FloatingHealthAssistant patientId={patientData.id} />}
        <FloatingMapButton onClick={() => setOpenMap(true)} />

        {/* Map Dialog */}
        <Dialog open={openMap} onOpenChange={setOpenMap}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-2xl">
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

        <PatientEmergencyBanner />

      </div>
    </div>
  );
}