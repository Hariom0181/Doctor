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
  const handleJoinMeeting = (consultation: VideoConsultation, isDemoMode: boolean = false) => {
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
      const doctors = await patientApiService.getLinkedDoctors(patientId.toString());
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
    if (isDemoMode) return true; // ✅ Demo mode: always allow

    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60); // Minutes until meeting

    // Can join 15 minutes before OR if meeting time has passed (for 1 hour window)
    return timeDiff <= 15 && timeDiff >= -60;
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

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep('confirm');
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 " />
                Video Consultations
              </CardTitle>
              <CardDescription>Book and manage your video consultations</CardDescription>
            </div>
            <Button onClick={() => {
              resetBooking();
              setIsBookingOpen(true);
            }}>
              <Video className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-40 overflow-y-auto">
          {loadingConsultations ? (
            <div className="text-center py-8 ">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading consultations...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No consultations yet</p>
              <p className="text-sm mt-1">Book your first video consultation to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{consultation.doctor_name}</h4>
                        {getStatusBadge(consultation.status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {consultation.doctor_specialization}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(consultation.scheduled_date).toLocaleDateString()} at {formatTime(consultation.scheduled_time)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {consultation.duration_minutes} minutes • ₹{formatFee(consultation.consultation_fee)}
                        </p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Payment: <span className="font-medium">{consultation.payment_status}</span>
                        </p>
                      </div>

                      {consultation.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Reason:</strong> {consultation.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {/* Join Meeting Button (Confirmed consultations only) */}
                      {consultation.status === 'confirmed' && (
                        <>
                          {/* Demo Mode Button - Always enabled */}
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleJoinMeeting(consultation, true)}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Join (Demo)
                          </Button>

                          {/* Real Mode Button - Time-based */}
                          <Button
                            size="sm"
                            disabled={!canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false)}
                            onClick={() => handleJoinMeeting(consultation, false)}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            {getMeetingStatus(consultation.scheduled_date, consultation.scheduled_time)}
                          </Button>
                        </>
                      )}

                      {/* Pending Approval */}
                      {consultation.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelConsultation(consultation.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}

                      {/* Confirmed but can still cancel */}
                      {consultation.status === 'confirmed' && canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false) && (
                        <Button
                          size="sm"
                          variant="outline"
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

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Video Consultation</DialogTitle>
            <DialogDescription>
              Follow the steps to book your consultation
            </DialogDescription>
          </DialogHeader>

          {/* Wallet Balance Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Wallet Balance:</span>
              <span className="text-lg font-bold text-blue-900">₹{walletBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${step === 'doctor' ? 'text-blue-600 font-medium' : step === 'duration' || step === 'datetime' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'doctor' ? 'bg-blue-600 text-white' : step === 'duration' || step === 'datetime' || step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-sm">Doctor</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'duration' ? 'text-blue-600 font-medium' : step === 'datetime' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'duration' ? 'bg-blue-600 text-white' : step === 'datetime' || step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-sm">Duration</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'datetime' ? 'text-blue-600 font-medium' : step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'datetime' ? 'bg-blue-600 text-white' : step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-sm">Date & Time</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="text-sm">Confirm</span>
            </div>
          </div>

          {/* Step 1: Select Doctor */}
          {step === 'doctor' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Select Your Doctor</h3>
              {linkedDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No linked doctors found. Please link with a doctor first.
                </p>
              ) : (
                linkedDoctors.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="border rounded-lg p-4 cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{doctor.name}</h4>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <p className="text-xs text-gray-500">{doctor.hospital}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select Duration */}
          {step === 'duration' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Select Consultation Duration</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('doctor')}>
                  ← Back
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Consulting with: <strong>{selectedDoctor?.name}</strong>
              </p>
              {consultationFees.map(fee => (
                <div
                  key={fee.duration_minutes}
                  onClick={() => handleDurationSelect(fee)}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all ${selectedFee?.duration_minutes === fee.duration_minutes ? 'border-blue-600 bg-blue-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{getDurationLabel(fee.duration_minutes)}</p>
                        <p className="text-sm text-gray-600">Video consultation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">₹{fee.fee.toFixed(2)}</p>
                      {walletBalance < fee.fee && (
                        <p className="text-xs text-red-600">Insufficient balance</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 'datetime' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Select Date & Time</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('duration')}>
                  ← Back
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Select Date</h4>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Available Time Slots
                    {selectedDate && ` - ${selectedDate.toLocaleDateString()}`}
                  </h4>
                  {!selectedDate ? (
                    <p className="text-gray-500 text-sm">Please select a date first</p>
                  ) : loadingSlots ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No slots available for this date</p>) : (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {availableSlots.map(slot => (
                        <Button
                          key={slot.time}
                          variant={selectedSlot === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => slot.available && handleSlotSelect(slot.time)}
                          className="h-auto py-3"
                        >
                          {formatTime(slot.time)}
                        </Button>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}{/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Confirm Booking</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('datetime')}>
                  ← Back
                </Button>
              </div>

              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-medium">{selectedDoctor?.name}</p>
                    <p className="text-sm text-gray-600">{selectedDoctor?.specialization}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {selectedDate?.toLocaleDateString()} at {selectedSlot && formatTime(selectedSlot)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{selectedFee && getDurationLabel(selectedFee.duration_minutes)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                    <p className="font-medium text-blue-600">₹{selectedFee?.fee.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your booking request will be sent to the doctor for approval.
                  The consultation fee will be deducted from your wallet only after the doctor approves.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBooking} disabled={loading}>
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
    </>);
}