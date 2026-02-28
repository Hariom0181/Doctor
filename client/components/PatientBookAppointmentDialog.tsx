import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, CalendarDays, Clock, FileText, StickyNote, Stethoscope, X } from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";

interface AppointmentForm {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  notes: string;
}

interface PatientBookAppointmentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  appointmentForm: AppointmentForm;
  setAppointmentForm: (form: AppointmentForm) => void;
  linkedDoctors: LinkedDoctor[];
  handleAppointmentSubmit: (e: React.FormEvent) => void;
  bookingAppointment: boolean;
}

const fieldClass =
  "h-11 rounded-lg border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150";

const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-widest";

export function PatientBookAppointmentDialog({
  isOpen,
  setIsOpen,
  appointmentForm,
  setAppointmentForm,
  linkedDoctors,
  handleAppointmentSubmit,
  bookingAppointment,
}: PatientBookAppointmentDialogProps) {
  const resetForm = () => {
    setAppointmentForm({
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
      appointmentType: "",
      reason: "",
      notes: "",
    });
  };

  return (
    <>
      {/* Custom scrollbar styles */}
      <style>{`
        .appt-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .appt-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 99px;
        }
        .appt-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
        .appt-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="default"
            className="gap-2 rounded-xl px-5 h-10 text-sm font-semibold shadow-sm shadow-blue-200 transition-all duration-150 hover:shadow-md hover:shadow-blue-200 active:scale-[0.98]"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-4 h-4 stroke-[2.5px] shrink-0" />
            Book Appointment
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-xl rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/15 p-0 overflow-hidden gap-0">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-100 uppercase tracking-widest">Patient Portal</span>
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Book an Appointment
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-sm mt-0.5">
                  Choose your specialist and preferred time slot.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Form */}
          <div className="appt-scroll overflow-y-auto max-h-[72vh]">
            <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-5 bg-white">

              {/* Doctor Selection */}
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  Select Doctor <span className="text-red-400 normal-case">*</span>
                </Label>
                <Select
                  value={appointmentForm.doctorId}
                  onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctorId: value })}
                  required
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {linkedDoctors.length > 0 ? (
                      linkedDoctors.map((doctor) => (
                        <SelectItem
                          key={doctor.id}
                          value={doctor.id.toString()}
                          className="py-2.5 rounded-lg focus:bg-blue-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{doctor.name}</span>
                          <span className="ml-2 text-slate-400 text-xs">· {doctor.specialization}</span>
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
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  Type of Visit <span className="text-red-400 normal-case">*</span>
                </Label>
                <Select
                  value={appointmentForm.appointmentType}
                  onValueChange={(value) => setAppointmentForm({ ...appointmentForm, appointmentType: value })}
                  required
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
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

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" /> Date <span className="text-red-400">*</span>
                    </span>
                  </Label>
                  <Input
                    type="date"
                    className={fieldClass}
                    min={new Date().toISOString().split("T")[0]}
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Time <span className="text-red-400">*</span>
                    </span>
                  </Label>
                  <Input
                    type="time"
                    className={fieldClass}
                    value={appointmentForm.appointmentTime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Reason */}
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Reason for Visit <span className="text-red-400">*</span>
                  </span>
                </Label>
                <Textarea
                  placeholder="Describe your symptoms or reason for the appointment..."
                  className="min-h-[96px] rounded-lg border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150 resize-none"
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                  required
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <StickyNote className="w-3 h-3" /> Additional Notes{" "}
                    <span className="text-slate-300 normal-case font-medium text-[10px]">(optional)</span>
                  </span>
                </Label>
                <Textarea
                  placeholder="Any other information the doctor should know..."
                  className="min-h-[72px] rounded-lg border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150 resize-none"
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-xl font-semibold text-sm shadow-sm shadow-blue-200 transition-all duration-150 hover:shadow-md hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-60"
                  disabled={bookingAppointment}
                >
                  {bookingAppointment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Confirm Appointment
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5 rounded-xl font-semibold text-sm border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-150 active:scale-[0.98]"
                  onClick={resetForm}
                >
                  Reset
                </Button>
              </div>

            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}