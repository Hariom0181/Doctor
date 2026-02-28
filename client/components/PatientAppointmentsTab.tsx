import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, Loader2, Plus, Clock, Stethoscope,
  MapPin, TestTube, Heart, Clipboard, X,
  CheckCircle2, AlertCircle, ArrowRight
} from "lucide-react";

interface Appointment {
  id: number;
  appointment_type: string;
  doctor_name: string;
  current_hospital: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason?: string;
}

interface PatientAppointmentsTabProps {
  upcomingAppointments: Appointment[];
  isLoadingAppointments: boolean;
  handleCancelAppointment: (id: number) => void;
  setIsAppointmentDialogOpen: (open: boolean) => void;
  openAppointmentDialog: (type: string) => void;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "confirmed": return "bg-blue-50 text-blue-700 border-blue-100";
    case "pending":   return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case "completed": return "bg-green-50 text-green-700 border-green-100";
    case "cancelled": return "bg-red-50 text-red-700 border-red-100";
    default:          return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":   return "⏳ Pending";
    case "confirmed": return "✅ Confirmed";
    case "completed": return "✔️ Completed";
    case "cancelled": return "❌ Cancelled";
    default:          return status;
  }
};

const QUICK_BOOK_OPTIONS = [
  {
    label: "General Checkup",
    type: "General Checkup",
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100 hover:border-blue-300",
    desc: "Routine health examination"
  },
  {
    label: "Lab Tests",
    type: "Lab Tests",
    icon: TestTube,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100 hover:border-purple-300",
    desc: "Blood work & diagnostics"
  },
  {
    label: "Specialist Consultation",
    type: "Specialist Consultation",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100 hover:border-rose-300",
    desc: "Expert specialist visit"
  },
  {
    label: "Follow-up Visit",
    type: "Follow-up Visit",
    icon: Clipboard,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100 hover:border-green-300",
    desc: "Post-treatment check-in"
  },
];

export function PatientAppointmentsTab({
  upcomingAppointments,
  isLoadingAppointments,
  handleCancelAppointment,
  setIsAppointmentDialogOpen,
  openAppointmentDialog,
}: PatientAppointmentsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── LEFT: Upcoming Appointments ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-violet-500/50 via-violet-400/30 to-transparent" />

        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-800">
                  Upcoming Appointments
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Your scheduled visits
                </CardDescription>
              </div>
            </div>

            {upcomingAppointments.length > 0 && (
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg">
                {upcomingAppointments.length} scheduled
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">

          {/* Loading */}
          {isLoadingAppointments && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                    <div className="h-4 bg-slate-200 rounded-lg w-20" />
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                    <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-3 bg-slate-200 rounded-lg w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-200 rounded-xl w-24" />
                    <div className="h-8 bg-slate-200 rounded-xl w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoadingAppointments && upcomingAppointments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 mb-1">No Upcoming Appointments</h3>
              <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">
                You don't have any scheduled appointments. Book one from the options on the right.
              </p>
              <Button
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => setIsAppointmentDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          )}

          {/* List */}
          {!isLoadingAppointments && upcomingAppointments.length > 0 && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="group border border-slate-200/80 rounded-2xl p-4 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400/60 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-black text-slate-800 text-sm leading-tight">
                      {appointment.appointment_type}
                    </h4>
                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${getStatusStyle(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {appointment.doctor_name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {appointment.current_hospital}
                    </p>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })} · {appointment.appointment_time}
                    </p>
                    {appointment.reason && (
                      <p className="text-xs text-slate-400 italic pl-5 line-clamp-1">
                        "{appointment.reason}"
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 pt-3">
                    {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-8 rounded-xl border-slate-200 font-bold text-xs opacity-40 cursor-not-allowed"
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-red-100 text-red-500 font-bold text-xs hover:bg-red-50 hover:border-red-200 transition-all"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        {appointment.status === 'cancelled' && (
                          <><AlertCircle className="w-3.5 h-3.5 text-red-400" /> This appointment was cancelled</>
                        )}
                        {appointment.status === 'completed' && (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> This appointment is completed</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── RIGHT: Book New Appointment ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-blue-400/30 to-transparent" />

        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-800">
                Book New Appointment
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Schedule your next visit
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-3">

          {QUICK_BOOK_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => openAppointmentDialog(option.type)}
              className={`w-full group flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left ${option.border} overflow-hidden relative`}
            >
              {/* Hover accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${option.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />

              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl ${option.bg} border ${option.border} flex items-center justify-center shrink-0`}>
                <option.icon className={`w-5 h-5 ${option.color}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 text-sm leading-tight">
                  {option.label}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {option.desc}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className={`w-4 h-4 ${option.color} opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 shrink-0`} />
            </button>
          ))}

          {/* Divider */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center font-medium mb-3">
              or book with full options
            </p>
            <Button
              className="w-full h-11 rounded-2xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all"
              onClick={() => setIsAppointmentDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Full Booking Form
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}