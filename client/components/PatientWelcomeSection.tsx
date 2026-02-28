import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Camera, Loader2, CalendarDays, Shield } from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";
import { PatientBookAppointmentDialog } from "@/components/PatientBookAppointmentDialog";

interface AppointmentForm {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  notes: string;
}

interface PatientData {
  id: number | string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
}

interface PatientWelcomeSectionProps {
  loading: boolean;
  patientData: PatientData | null;
  profileImageUrl: string | null;
  uploadingImage: boolean;
  imageUploadError: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAppointmentDialogOpen: boolean;
  setIsAppointmentDialogOpen: (open: boolean) => void;
  appointmentForm: AppointmentForm;
  setAppointmentForm: (form: AppointmentForm) => void;
  linkedDoctors: LinkedDoctor[];
  handleAppointmentSubmit: (e: React.FormEvent) => void;
  bookingAppointment: boolean;
}

const generatePatientId = (id: number | string): string => {
  return `HMS${new Date().getFullYear()}${String(id).padStart(4, "0")}`;
};

export function PatientWelcomeSection({
  loading,
  patientData,
  profileImageUrl,
  uploadingImage,
  imageUploadError,
  handleImageUpload,
  isAppointmentDialogOpen,
  setIsAppointmentDialogOpen,
  appointmentForm,
  setAppointmentForm,
  linkedDoctors,
  handleAppointmentSubmit,
  bookingAppointment,
}: PatientWelcomeSectionProps) {

  // Loading State
  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-slate-200 rounded-2xl" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-200 rounded w-24" />
                <div className="h-6 bg-slate-200 rounded w-52" />
                <div className="h-5 bg-slate-200 rounded w-32" />
              </div>
            </div>
            <div className="h-10 bg-slate-200 rounded-lg w-44" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (!patientData) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-red-700 font-medium text-sm">
          Unable to load patient data. Please log in again.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Slim blue top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-5">

              {/* Avatar */}
              <div className="relative group shrink-0">
                <input
                  type="file"
                  id="profile-upload"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <label htmlFor="profile-upload" className="cursor-pointer block">
                  <div className="relative w-20 h-20 rounded-2xl ring-4 ring-blue-50 transition-all duration-200 group-hover:ring-blue-100">
                    <Avatar className="w-20 h-20 rounded-2xl">
                      {profileImageUrl ? (
                        <AvatarImage
                          src={profileImageUrl}
                          alt={`${patientData.firstName} ${patientData.lastName}`}
                          className="object-cover rounded-2xl"
                        />
                      ) : (
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                          {patientData.firstName?.charAt(0)}{patientData.lastName?.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Camera hover overlay */}
                    <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="w-5 h-5 text-white" />
                    </div>

                    {/* Upload spinner */}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </label>

                {/* Active indicator */}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {today}
                </p>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Hello, {patientData.name} 👋
                </h1>

                <div className="flex items-center flex-wrap gap-2 pt-0.5">
                  {/* Patient ID badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                    <Shield className="w-3 h-3" />
                    {generatePatientId(patientData.id)}
                  </span>

                  {/* Status badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active Patient
                  </span>

                  {/* Upload error */}
                  {imageUploadError && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                      <AlertCircle className="w-3 h-3" />
                      {imageUploadError}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Book Appointment */}
            <div className="shrink-0 w-full md:w-auto">
              <PatientBookAppointmentDialog
                isOpen={isAppointmentDialogOpen}
                setIsOpen={setIsAppointmentDialogOpen}
                appointmentForm={appointmentForm}
                setAppointmentForm={setAppointmentForm}
                linkedDoctors={linkedDoctors}
                handleAppointmentSubmit={handleAppointmentSubmit}
                bookingAppointment={bookingAppointment}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}