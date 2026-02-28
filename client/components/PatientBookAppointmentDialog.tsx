import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, Stethoscope } from "lucide-react";
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
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      appointmentType: '',
      reason: '',
      notes: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="relative rounded-2xl px-7 py-6 h-auto text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
          onClick={() => setIsOpen(true)}
        >
          <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="w-4 h-4 mr-2 stroke-[3px] shrink-0" />
          Book Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl shadow-slate-900/20 p-0 overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary via-blue-600 to-blue-700 p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <DialogHeader className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-3 w-fit">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-xs font-bold text-white/90 tracking-wider uppercase">Patient Portal</span>
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              Book Appointment
            </DialogTitle>
            <DialogDescription className="text-blue-100/90 text-sm mt-1 font-medium">
              Choose your preferred specialist and time slot.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleAppointmentSubmit} className="p-8 space-y-5 bg-white">

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Select Doctor <span className="text-red-400">*</span>
            </Label>
            <Select
              value={appointmentForm.doctorId}
              onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctorId: value })}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20">
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                {linkedDoctors.length > 0 ? (
                  linkedDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()} className="py-3 rounded-lg focus:bg-primary/5">
                      <span className="font-bold text-slate-800">{doctor.name}</span>
                      <span className="ml-2 text-slate-400 text-xs font-medium">— {doctor.specialization}</span>
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
            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Type of Visit <span className="text-red-400">*</span>
            </Label>
            <Select
              value={appointmentForm.appointmentType}
              onValueChange={(value) => setAppointmentForm({ ...appointmentForm, appointmentType: value })}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Date <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20"
                min={new Date().toISOString().split('T')[0]}
                value={appointmentForm.appointmentDate}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Time <span className="text-red-400">*</span>
              </Label>
              <Input
                type="time"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20"
                value={appointmentForm.appointmentTime}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Reason for Visit <span className="text-red-400">*</span>
            </Label>
            <Textarea
              placeholder="Describe your symptoms or reason for the appointment..."
              className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20 resize-none"
              value={appointmentForm.reason}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Additional Notes <span className="text-slate-300 normal-case font-medium">(Optional)</span>
            </Label>
            <Textarea
              placeholder="Any other information the doctor should know..."
              className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20 resize-none"
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 py-4 h-auto rounded-2xl font-bold text-sm shadow-md shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-primary/25 active:scale-[0.98]"
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
                  Book Appointment
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-6 py-4 h-auto rounded-2xl font-bold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
              onClick={resetForm}
            >
              Reset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}