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

  useEffect(() => {
    loadLinkedDoctors();
    loadWalletBalance();
  }, [patientId]);

  const loadLinkedDoctors = async () => {
    try {
      const doctors = await patientApiService.getLinkedDoctors(patientId.toString());
      setLinkedDoctors(doctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
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

  const handleDurationSelect = (fee: ConsultationFee) => {
    setSelectedFee(fee);
    setStep('datetime');
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !selectedDoctor) return;
    
    setSelectedDate(date);
    setSelectedSlot(null);
    
    try {
      setLoadingSlots(true);
      const dateStr = date.toISOString().split('T')[0];
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
      
      // TODO: Call booking API (we'll create this next)
      console.log('Booking:', {
        doctorId: selectedDoctor.id,
        patientId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedSlot,
        duration: selectedFee.duration_minutes,
        fee: selectedFee.fee
      });

      toast({
        title: "Request Sent!",
        description: "Your consultation request has been sent to the doctor for approval",
      });

      // Reset and close
      resetBooking();
      setIsBookingOpen(false);
    } catch (error) {
      console.error('Error booking:', error);
      toast({
        title: "Error",
        description: "Failed to book consultation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
                <Video className="w-5 h-5" />
                Video Consultation
              </CardTitle>
              <CardDescription>Book a video consultation with your doctor</CardDescription>
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
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No upcoming video consultations</p>
            <p className="text-sm mt-1">Book your first consultation to get started</p>
          </div>
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
                  </>);
}