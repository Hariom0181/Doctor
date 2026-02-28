import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar as CalendarIcon, Clock, DollarSign, User, CheckCircle } from 'lucide-react';
import { videoConsultationApiService, type ConsultationFee, type TimeSlot } from '@/services/videoConsultationApi';
import { walletApiService } from '@/services/walletApi';
import { patientApiService, type LinkedDoctor } from '@/services/patientApi';
import { useToast } from '@/hooks/use-toast';
import { bookingApiService, type VideoConsultation } from '@/services/bookingApi';
import { AlertCircle, Calendar as CheckCircle2, XCircle } from 'lucide-react';
import { VideoCallRoom } from '@/components/VideoCallRoom';

interface VideoConsultationBookingProps {
  patientId: number;
}

export function VideoConsultationBooking({ patientId }: VideoConsultationBookingProps) {
  const { toast } = useToast();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [linkedDoctors, setLinkedDoctors] = useState<LinkedDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<LinkedDoctor | null>(null);
  const [consultationFees, setConsultationFees] = useState<ConsultationFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<ConsultationFee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<'doctor' | 'duration' | 'datetime' | 'confirm'>('doctor');
  const [consultations, setConsultations] = useState<VideoConsultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  // Add with other state declarations
  const [isInCall, setIsInCall] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<VideoConsultation | null>(null);

  useEffect(() => {
    loadLinkedDoctors();
    loadWalletBalance();
  }, [patientId]);



  useEffect(() => {
    if (patientId) {
      loadConsultations();
      expireOldConsultations();
    }
  }, [patientId]);


  const loadConsultations = async () => {
    try {
      setLoadingConsultations(true);
      const data = await bookingApiService.getPatientConsultations(patientId);

      setConsultations(data);
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const expireOldConsultations = async () => {
    try {
      await fetch('http://localhost:5000/api/bookings/expire-old-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('PatientToken')}`
        }
      });
    } catch (error) {
      console.error('Error expiring consultations:', error);
    }
  };

  const sortedConsultations = [...consultations].sort((a, b) => {
    // Priority: confirmed first
    if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
    if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;

    // If both have the same priority (both confirmed or both not confirmed), sort by datetime
    const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
    const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
    return dateB.getTime() - dateA.getTime(); // latest first
  });

  const latestThree = sortedConsultations.slice(0, 3);



  const handleJoinMeeting = (consultation: VideoConsultation, isDemoMode: boolean = false) => {

    if (isInCall) {
      toast({
        title: "Already in call",
        description: "Please end the current call first",
        variant: "destructive"
      });
      return;
    }
    if (!isDemoMode) {
      // Check time for real mode
      const canJoin = canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false);
      if (!canJoin) {
        toast({
          title: "Not Available Yet",
          description: "You can join 15 minutes before the scheduled time",
          variant: "destructive"
        });
        return;
      }

    }

    setActiveConsultation(consultation);
    setIsInCall(true);
  };

  const handleEndCall = async () => {
    setIsInCall(false);
    setActiveConsultation(null);

    // Reload consultations to get updated status
    await loadConsultations();
    await loadWalletBalance();

    toast({
      title: "Call Ended",
      description: "You have left the consultation"
    });
  };

  const loadLinkedDoctors = async () => {
    try {
      const doctors = await patientApiService.getLinkedDoctors();
      setLinkedDoctors(doctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  // Helper to safely format currency
  const formatFee = (fee: string | number): string => {
    const numFee = typeof fee === 'string' ? parseFloat(fee) : fee;
    return isNaN(numFee) ? '0.00' : numFee.toFixed(2);
  };

  const loadWalletBalance = async () => {
    try {
      const balance = await walletApiService.getBalance(patientId);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleDoctorSelect = async (doctor: LinkedDoctor) => {
    try {
      setLoading(true);
      setSelectedDoctor(doctor);

      // Load consultation fees for this doctor
      const fees = await videoConsultationApiService.getDoctorConsultationFees(doctor.id);
      setConsultationFees(fees);

      if (fees.length > 0) {
        setStep('duration');
      } else {
        toast({
          title: "Not Available",
          description: "This doctor hasn't set up video consultation yet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading fees:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // Helper to check if meeting can be joined
  const canJoinMeeting = (scheduledDate: string, scheduledTime: string, isDemoMode: boolean = false) => {
    if (isDemoMode) return true;

    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60);

    // Can join 15 minutes before until 1 hour after start time
    return timeDiff <= 15 && timeDiff >= -60;
  };
  const isMeetingExpired = (scheduledDate: string, scheduledTime: string, durationMinutes: number) => {
    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const endDateTime = new Date(consultDateTime.getTime() + durationMinutes * 60000);
    const now = new Date();

    return now > endDateTime; // Meeting has completely expired
  };

  // Helper to get meeting status message
  const getMeetingStatus = (scheduledDate: string, scheduledTime: string) => {
    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60); // Minutes

    if (timeDiff > 15) {
      return `Available in ${Math.ceil(timeDiff)} minutes`;
    } else if (timeDiff > 0) {
      return 'Join Now';
    } else if (timeDiff >= -60) {
      return 'Join Now (Meeting Time)';
    } else {
      return 'Meeting Ended';
    }
  };
  const handleDurationSelect = (fee: ConsultationFee) => {
    setSelectedFee(fee);
    setStep('datetime');
  };

  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };


  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !selectedDoctor) return;

    setSelectedDate(date);
    setSelectedSlot(null);

    try {
      setLoadingSlots(true);
      const dateStr = toLocalDateString(date);
      const slotsData = await videoConsultationApiService.getAvailableSlots(selectedDoctor.id, dateStr);
      setAvailableSlots(slotsData.data);

      if (slotsData.data.length === 0 || slotsData.data.every(s => !s.available)) {
        toast({
          title: "Not Available",
          description: "No slots available for this date. Please select another date.",
        });
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive"
      });
    } finally {
      setLoadingSlots(false);
    }
  };
  const isPastSlot = (date: Date | undefined, time: string) => {
    if (!date) return false;

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return (
      date.toDateString() === now.toDateString() &&
      slotDateTime < now
    );
  };




  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const isPastSlotStrict = (date: Date, time: string) => {
    const now = new Date();
    const [h, m] = time.split(':').map(Number);

    const slotDateTime = new Date(date);
    slotDateTime.setHours(h, m, 0, 0);

    return slotDateTime < now;
  };


  const handleBooking = async () => {
    if (!selectedDoctor || !selectedFee || !selectedDate || !selectedSlot) {
      toast({
        title: "Incomplete",
        description: "Please complete all booking steps",
        variant: "destructive"
      });
      return;
    }
    // ⛔ FINAL SAFETY CHECK: prevent booking past slot
    if (isPastSlotStrict(selectedDate, selectedSlot)) {
      toast({
        title: "Invalid Time Slot",
        description: "This time slot has already passed. Please select another slot.",
        variant: "destructive",
      });

      setStep('datetime');
      setSelectedSlot(null);
      return;
    }

    const toLocalDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // Check wallet balance
    if (walletBalance < selectedFee.fee) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${selectedFee.fee.toFixed(2)} but your balance is ₹${walletBalance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        doctorId: selectedDoctor.id,
        scheduledDate: toLocalDateString(selectedDate),
        scheduledTime: selectedSlot,
        durationMinutes: selectedFee.duration_minutes,
        consultationFee: selectedFee.fee
      };

      await bookingApiService.bookConsultation(bookingData);

      toast({
        title: "Request Sent!",
        description: "Your consultation request has been sent to the doctor for approval",
      });

      // Reload consultations and wallet
      await loadConsultations();
      await loadWalletBalance();

      // Reset and close
      resetBooking();
      setIsBookingOpen(false);
    } catch (error: any) {
      console.error('Error booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to book consultation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCancelConsultation = async (consultationId: number) => {
    if (!confirm('Are you sure you want to cancel this consultation?')) {
      return;
    }

    try {
      const result = await bookingApiService.cancelConsultation(consultationId);

      toast({
        title: "Cancelled",
        description: result.refundAmount
          ? `Consultation cancelled. ₹${result.refundAmount} refunded to wallet.`
          : "Consultation cancelled successfully"
      });

      // Reload consultations and wallet
      await loadConsultations();
      await loadWalletBalance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel consultation",
        variant: "destructive"
      });
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'in_progress':  // ✅ ADD THIS
        return <Badge className="bg-blue-500 animate-pulse"><Video className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'cancelled_by_patient':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  const resetBooking = () => {
    setSelectedDoctor(null);
    setSelectedFee(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setStep('doctor');
  };

  const getDurationLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} Minutes`;
    return `${minutes / 60} Hour${minutes > 60 ? 's' : ''}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* ── Main Card ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 via-violet-400/30 to-transparent" />
  
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  Video Consultations
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Book and manage your video consultations
                </CardDescription>
              </div>
            </div>
            <Button
              className="rounded-xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all"
              onClick={() => { resetBooking(); setIsBookingOpen(true); }}
            >
              <Video className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
          </div>
        </CardHeader>
  
        <CardContent className="px-6 pb-6 max-h-80 overflow-y-auto">
          {loadingConsultations ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                    <div className="h-4 bg-slate-200 rounded-lg w-20" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                    <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-3 bg-slate-200 rounded-lg w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-bold text-slate-600">No consultations yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Book your first video consultation to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestThree.map((consultation) => (
                <div
                  key={consultation.id}
                  className="group border border-slate-200/80 rounded-2xl p-4 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/60 to-violet-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 border border-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-black text-sm">
                          {consultation.doctor_name?.charAt(0)}
                        </span>
                      </div>
  
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-black text-slate-800 text-sm">
                            {consultation.doctor_name}
                          </h4>
                          {getStatusBadge(consultation.status)}
                        </div>
  
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {consultation.doctor_specialization}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {new Date(consultation.scheduled_date).toLocaleDateString()} · {formatTime(consultation.scheduled_time)}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {consultation.duration_minutes} min · ₹{formatFee(consultation.consultation_fee)}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            Payment: <span className="font-bold text-slate-700 ml-1">{consultation.payment_status}</span>
                          </p>
                        </div>
  
                        {consultation.rejection_reason && (
                          <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
                            <strong>Reason:</strong> {consultation.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
  
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {(consultation.status === 'confirmed' || consultation.status === 'in_progress') &&
                        !isMeetingExpired(consultation.scheduled_date, consultation.scheduled_time, consultation.duration_minutes) && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-xs px-3"
                              onClick={() => handleJoinMeeting(consultation, true)}
                            >
                              <Video className="w-3.5 h-3.5 mr-1" />
                              Demo
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 rounded-xl font-bold text-xs px-3"
                              disabled={!canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false)}
                              onClick={() => handleJoinMeeting(consultation, false)}
                            >
                              <Video className="w-3.5 h-3.5 mr-1" />
                              Join
                            </Button>
                          </>
                        )}
  
                      {consultation.status === 'in_progress' && (
                        <Badge className="bg-blue-500 animate-pulse text-[10px] px-2 py-1 rounded-lg">
                          <Video className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
  
                      {consultation.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl border-red-100 text-red-500 font-bold text-xs hover:bg-red-50 px-3"
                          onClick={() => handleCancelConsultation(consultation.id)}
                        >
                          Cancel
                        </Button>
                      )}
  
                      {consultation.status === 'confirmed' &&
                        canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl border-slate-200 font-bold text-xs hover:bg-slate-50 px-3"
                            onClick={() => handleCancelConsultation(consultation.id)}
                          >
                            Cancel
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  
      {/* ── Booking Dialog ── */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0">
  
          {/* Dialog Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <DialogHeader className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-3 w-fit">
                <Video className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white/90 tracking-wider uppercase">Patient Portal</span>
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">
                Book Video Consultation
              </DialogTitle>
              <DialogDescription className="text-blue-100/90 text-sm mt-1 font-medium">
                Follow the steps to book your consultation
              </DialogDescription>
            </DialogHeader>
  
            {/* Wallet Balance */}
            <div className="relative z-10 mt-4 inline-flex items-center gap-3 bg-white/15 border border-white/20 rounded-2xl px-4 py-2.5">
              <DollarSign className="w-4 h-4 text-white/80" />
              <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Wallet</span>
              <span className="text-lg font-black text-white">₹{walletBalance.toFixed(2)}</span>
            </div>
          </div>
  
          <div className="p-8 bg-white space-y-6">
  
            {/* Steps Indicator */}
            <div className="flex items-center justify-center gap-1">
              {[
                { key: 'doctor',   label: 'Doctor' },
                { key: 'duration', label: 'Duration' },
                { key: 'datetime', label: 'Date & Time' },
                { key: 'confirm',  label: 'Confirm' },
              ].map((s, index, arr) => {
                const stepOrder = ['doctor', 'duration', 'datetime', 'confirm'];
                const currentIndex = stepOrder.indexOf(step);
                const thisIndex = stepOrder.indexOf(s.key);
                const isActive = step === s.key;
                const isDone = currentIndex > thisIndex;
  
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isActive ? 'bg-primary text-white shadow-md shadow-primary/30' :
                        isDone  ? 'bg-green-500 text-white' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${
                        isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {index < arr.length - 1 && (
                      <div className={`w-10 h-0.5 mb-4 rounded-full transition-all ${
                        isDone ? 'bg-green-400' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
  
            {/* ── Step 1: Doctor ── */}
            {step === 'doctor' && (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Select Your Doctor
                </p>
                {linkedDoctors.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-500 text-sm">No linked doctors found</p>
                    <p className="text-xs text-slate-400 mt-1">Please link with a doctor first</p>
                  </div>
                ) : (
                  linkedDoctors.map(doctor => (
                    <div
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="group border border-slate-200/80 rounded-2xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-400/20 border border-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-black text-sm">
                              {doctor.name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">{doctor.name}</h4>
                            <p className="text-xs text-primary font-bold">{doctor.specialization}</p>
                            <p className="text-xs text-slate-400 font-medium">{doctor.hospital}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold text-xs hover:border-primary/30 hover:bg-primary/5">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
  
            {/* ── Step 2: Duration ── */}
            {step === 'duration' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Select Duration
                  </p>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-slate-500" onClick={() => setStep('doctor')}>
                    ← Back
                  </Button>
                </div>
  
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">
                    Consulting with <span className="text-primary">{selectedDoctor?.name}</span>
                  </p>
                </div>
  
                {consultationFees.map(fee => (
                  <div
                    key={fee.duration_minutes}
                    onClick={() => handleDurationSelect(fee)}
                    className={`group border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden ${
                      selectedFee?.duration_minutes === fee.duration_minutes
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-slate-200/80 bg-white hover:border-primary/30'
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">
                            {getDurationLabel(fee.duration_minutes)}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">Video consultation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary">₹{fee.fee.toFixed(2)}</p>
                        {walletBalance < fee.fee && (
                          <p className="text-[10px] font-bold text-red-500">Insufficient balance</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
  
            {/* ── Step 3: Date & Time ── */}
            {step === 'datetime' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Select Date & Time
                  </p>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-slate-500" onClick={() => setStep('duration')}>
                    ← Back
                  </Button>
                </div>
  
                <div className="grid grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Select Date
                    </p>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
  
                  {/* Time Slots */}
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Available Slots
                      {selectedDate && (
                        <span className="ml-2 normal-case font-bold text-slate-300">
                          — {selectedDate.toLocaleDateString()}
                        </span>
                      )}
                    </p>
  
                    {!selectedDate ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                        <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Select a date first</p>
                      </div>
                    ) : loadingSlots ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse h-11 bg-slate-100 rounded-xl" />
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No slots available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                        {availableSlots.map(slot => {
                          const isDisabled = !slot.available || isPastSlot(selectedDate, slot.time);
                          const isSelected = selectedSlot === slot.time;
                          return (
                            <Button
                              key={slot.time}
                              variant="outline"
                              disabled={isDisabled}
                              onClick={() => !isDisabled && handleSlotSelect(slot.time)}
                              className={`h-11 rounded-xl font-bold text-xs transition-all ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                  : isDisabled
                                  ? 'opacity-40 cursor-not-allowed bg-slate-50'
                                  : 'border-slate-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                              }`}
                            >
                              {formatTime(slot.time)}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
  
            {/* ── Step 4: Confirm ── */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Confirm Booking
                  </p>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-slate-500" onClick={() => setStep('datetime')}>
                    ← Back
                  </Button>
                </div>
  
                {/* Summary Card */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 to-blue-400/30" />
                  <div className="p-5 space-y-4">
                    {[
                      {
                        icon: User,
                        label: 'Doctor',
                        value: selectedDoctor?.name,
                        sub: selectedDoctor?.specialization,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                      },
                      {
                        icon: CalendarIcon,
                        label: 'Date & Time',
                        value: `${selectedDate?.toLocaleDateString()}`,
                        sub: selectedSlot ? `at ${formatTime(selectedSlot)}` : '',
                        color: 'text-violet-600',
                        bg: 'bg-violet-50'
                      },
                      {
                        icon: Clock,
                        label: 'Duration',
                        value: selectedFee ? getDurationLabel(selectedFee.duration_minutes) : '',
                        sub: 'Video consultation',
                        color: 'text-blue-600',
                        bg: 'bg-blue-50'
                      },
                      {
                        icon: DollarSign,
                        label: 'Consultation Fee',
                        value: `₹${selectedFee?.fee.toFixed(2)}`,
                        sub: 'Deducted after approval',
                        color: 'text-green-600',
                        bg: 'bg-green-50'
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {item.label}
                          </p>
                          <p className={`font-black text-sm ${item.color}`}>{item.value}</p>
                          {item.sub && (
                            <p className="text-xs text-slate-400 font-medium">{item.sub}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
  
                {/* Note */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">
                      Important Note
                    </p>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Your booking request will be sent to the doctor for approval.
                      The consultation fee will be deducted from your wallet only after the doctor approves.
                    </p>
                  </div>
                </div>
  
                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    className="flex-1 h-12 rounded-2xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all"
                    onClick={handleBooking}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />Booking...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" />Confirm Booking</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 h-12 rounded-2xl font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                    onClick={() => setIsBookingOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  
      {/* ── Video Call Room ── */}
      {isInCall && activeConsultation && (
        <VideoCallRoom
          consultationId={activeConsultation.id}
          userId={patientId}
          role="patient"
          doctorName={activeConsultation.doctor_name}
          duration={activeConsultation.duration_minutes}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}