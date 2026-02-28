import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Calendar, Pill, Loader2, Plus,
  Clock, Stethoscope, MapPin, ArrowRight, AlertCircle
} from "lucide-react";

interface RecentRecord {
  id: string;
  type: string;
  doctor: string;
  currentHospital: string;
  date: string;
  status: string;
  diagnosis: string;
  nextCheckup?: string | null;
}

interface Appointment {
  id: number;
  appointment_type: string;
  doctor_name: string;
  current_hospital: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface Prescription {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
}

interface PatientOverviewTabProps {
  recentRecords: RecentRecord[];
  isLoadingRecentRecords: boolean;
  upcomingAppointments: Appointment[];
  isLoadingAppointments: boolean;
  prescriptions: Prescription[];
  isLoadingPrescriptions: boolean;
  setIsAppointmentDialogOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  formatFrequency: (freq: string) => string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":           return "bg-green-100 text-green-700 border-green-200";
    case "attention needed": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "warning":          return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "critical":         return "bg-red-100 text-red-700 border-red-200";
    default:                 return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getAppointmentStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":  return "default";
    case "pending":    return "secondary";
    case "completed":  return "outline";
    case "cancelled":  return "destructive";
    default:           return "secondary";
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

const getAppointmentStatusStyle = (status: string) => {
  switch (status) {
    case "confirmed":  return "bg-blue-50 text-blue-700 border-blue-100";
    case "pending":    return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case "completed":  return "bg-green-50 text-green-700 border-green-100";
    case "cancelled":  return "bg-red-50 text-red-700 border-red-100";
    default:           return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

export function PatientOverviewTab({
  recentRecords,
  isLoadingRecentRecords,
  upcomingAppointments,
  isLoadingAppointments,
  prescriptions,
  isLoadingPrescriptions,
  setIsAppointmentDialogOpen,
  setActiveTab,
  formatFrequency,
}: PatientOverviewTabProps) {
  return (
    <div className="space-y-6">

      {/* Top Row — Records + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Medical Records */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 via-blue-400/30 to-transparent" />

          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800">
                    Recent Medical Records
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Your latest health checkups and diagnoses
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-5">
            {isLoadingRecentRecords ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse border border-slate-100 rounded-xl p-4 bg-slate-50">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
                      <div className="h-4 bg-slate-200 rounded-lg w-16" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded-lg w-3/4 mb-1" />
                    <div className="h-3 bg-slate-200 rounded-lg w-full" />
                  </div>
                ))}
              </div>
            ) : recentRecords && recentRecords.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {recentRecords.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="group border border-slate-200/80 rounded-xl px-4 py-3 bg-white hover:shadow-md hover:border-slate-300/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-sm truncate">
                            {record.type}
                          </h4>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mb-1">
                          {record.doctor} · {record.currentHospital}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {record.diagnosis}
                        </p>
                        {record.nextCheckup && (
                          <p className="mt-2 text-xs text-primary font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Next: {new Date(record.nextCheckup).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-semibold shrink-0 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No recent records available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
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
                  {upcomingAppointments.length} upcoming
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-5">
            {isLoadingAppointments ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse border border-slate-100 rounded-xl p-4 bg-slate-50">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                      <div className="h-4 bg-slate-200 rounded-lg w-20" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2 mb-1" />
                    <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-4">No upcoming appointments</p>
                <Button
                  size="sm"
                  className="rounded-xl font-bold"
                  onClick={() => setIsAppointmentDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-slate-200/80 rounded-xl p-4 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">
                          {appointment.appointment_type}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-0.5">
                          <Stethoscope className="w-3 h-3 shrink-0" />
                          {appointment.doctor_name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {appointment.current_hospital}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 mb-1.5">
                          {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric'
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mb-1.5 text-right">
                          {appointment.appointment_time}
                        </p>
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getAppointmentStatusStyle(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {upcomingAppointments.length > 3 && (
                  <p className="text-xs text-center text-slate-400 font-medium pt-1">
                    +{upcomingAppointments.length - 3} more appointments
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-1 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm h-10"
                  onClick={() => setActiveTab('appointments')}
                >
                  View All Appointments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Medications */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-green-500/50 via-green-400/30 to-transparent" />

        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Pill className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-800">
                  Active Medications
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Current medications and reminders
                </CardDescription>
              </div>
            </div>

            {prescriptions.length > 0 && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
                {prescriptions.length} active
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-5">
          {isLoadingPrescriptions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                  </div>
                  <div className="h-6 w-14 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Pill className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No active medications</p>
              <p className="text-xs text-slate-400 mt-1">Your prescribed medications will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prescriptions.slice(0, 4).map((med) => (
                <div
                  key={med.id}
                  className="group border border-slate-200/80 rounded-xl px-4 py-3 bg-white flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm leading-tight truncate">
                        {med.medication_name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {med.dosage} · {formatFrequency(med.frequency)}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 shrink-0 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}

          {prescriptions.length > 4 && (
            <Button
              variant="outline"
              className="w-full mt-4 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm h-10"
              onClick={() => setActiveTab('medications')}
            >
              View All Medications ({prescriptions.length})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}