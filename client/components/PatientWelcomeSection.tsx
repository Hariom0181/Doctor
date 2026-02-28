import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
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
  return `HMS${new Date().getFullYear()}${String(id).padStart(4, '0')}`;
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
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-slate-200 rounded-2xl ring-4 ring-slate-100" />
              <div className="space-y-3">
                <div className="h-8 bg-slate-200 rounded-xl w-64" />
                <div className="h-4 bg-slate-200 rounded-lg w-40" />
              </div>
            </div>
            <div className="h-12 bg-slate-200 rounded-2xl w-44" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (!patientData) {
    return (
      <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-red-700 font-semibold text-sm">
          Unable to load patient data. Please log in again.
        </p>
      </div>
    );
  }

  // Main Welcome Card
  return (
    <div className="mb-8 relative">
      {/* Ambient glow */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-48 h-48 bg-primary/6 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="relative bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-blue-400/40 to-transparent" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">

          {/* Left: Avatar + Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">

            {/* Avatar Upload */}
            <div className="relative inline-block group shrink-0">
              <input
                type="file"
                id="profile-upload"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />

              <label htmlFor="profile-upload" className="cursor-pointer block">
                {/* Gradient ring */}
                <div className="p-[3px] rounded-[1.4rem] bg-gradient-to-br from-primary/30 via-blue-400/20 to-slate-200/60 shadow-lg group-hover:shadow-primary/20 transition-all duration-300 group-hover:scale-[1.03]">
                  <Avatar className="w-[88px] h-[88px] rounded-[1.2rem] border-[3px] border-white shadow-inner">
                    {profileImageUrl ? (
                      <AvatarImage
                        src={profileImageUrl}
                        alt={`${patientData.firstName} ${patientData.lastName}`}
                        className="object-cover rounded-[1rem]"
                      />
                    ) : (
                      <AvatarFallback className="rounded-[1rem] bg-gradient-to-br from-primary via-blue-500 to-blue-700 text-white text-2xl font-black tracking-tight">
                        {patientData.firstName?.charAt(0)}{patientData.lastName?.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                {/* Camera overlay */}
                <div className="absolute inset-0 bg-slate-900/50 rounded-[1.4rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Uploading spinner */}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/85 rounded-[1.4rem] flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                )}
              </label>

              {/* Add Photo tooltip */}
              {!profileImageUrl && !uploadingImage && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
                  Change Photo
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div className="space-y-2.5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Patient Dashboard
                </p>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Hello, <span className="text-primary">{patientData.name}</span> 👋
                </h1>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold tracking-wide border border-slate-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  ID: {generatePatientId(patientData.id)}
                </span>

                {imageUploadError && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {imageUploadError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Book Appointment */}
          <div className="shrink-0">
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
  );
}