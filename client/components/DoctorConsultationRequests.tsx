import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, XCircle, Video, User, Calendar, Clock, DollarSign, Phone, Mail, Droplet } from 'lucide-react';
import { bookingApiService, type VideoConsultation } from '@/services/bookingApi';
import { useToast } from '@/hooks/use-toast';
import { VideoCallRoom } from '@/components/VideoCallRoom';

interface DoctorConsultationRequestsProps {
  doctorId: number;
}

export function DoctorConsultationRequests({ doctorId }: DoctorConsultationRequestsProps) {
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<VideoConsultation[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<VideoConsultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingConsultation, setRejectingConsultation] = useState<VideoConsultation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  // Add with other state declarations
  const [isInCall, setIsInCall] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<VideoConsultation | null>(null);

  useEffect(() => {
    if (doctorId) {
      loadData();
    }
  }, [doctorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingRequests(),
        loadUpcomingConsultations()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await bookingApiService.getDoctorPendingRequests(doctorId);
      setPendingRequests(data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };
  const handleStartMeeting = (consultation: VideoConsultation, isDemoMode: boolean = false) => {
    if (!isDemoMode) {
      // Check time for real mode
      const consultDateTime = new Date(`${consultation.scheduled_date}T${consultation.scheduled_time}`);
      const now = new Date();
      const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60);

      if (timeDiff > 15) {
        toast({
          title: "Not Available Yet",
          description: `You can start the meeting ${Math.ceil(timeDiff)} minutes before scheduled time`,
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

    // Reload data to get updated status
    await loadData();

    toast({
      title: "Call Ended",
      description: "Consultation has been completed"
    });
  };

  const loadUpcomingConsultations = async () => {
    try {
      // Get ALL consultations
      const allData = await bookingApiService.getDoctorConsultations(doctorId);

      // Filter: EXCLUDE pending_approval (they're already in the top card)
      // ONLY show: confirmed, approved, in_progress
      const upcoming = allData.filter(c => {
        const consultDate = new Date(`${c.scheduled_date}T${c.scheduled_time}`);
        const now = new Date();
        const isPastDate = consultDate < now;

        // ❌ Exclude these statuses
        if (
          c.status === 'completed' ||
          c.status === 'cancelled_by_patient' ||
          c.status === 'cancelled_by_doctor' ||
          c.status === 'no_show' ||
          c.status === 'rejected' ||
          c.status === 'pending_approval' // ✅ NEW: Don't duplicate pending here
        ) {
          return false;
        }

        // Show in_progress
        if (c.status === 'in_progress') {
          return true;
        }

        // For confirmed/approved - only show future or recent past (within 1 hour)
        if (c.status === 'confirmed' || c.status === 'approved') {
          const hoursPast = (now.getTime() - consultDate.getTime()) / (1000 * 60 * 60);
          return !isPastDate || hoursPast < 1;
        }

        return false;
      });

      // Sort by date and time (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
        const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('📅 Total consultations fetched:', allData.length);
      console.log('📅 Filtered upcoming consultations:', upcoming.length);

      setUpcomingConsultations(upcoming);
    } catch (error) {
      console.error('Error loading upcoming consultations:', error);
    }
  };
  // Add at the top with other helper functions
  const canJoinMeeting = (scheduledDate: string, scheduledTime: string, isDemoMode: boolean = false) => {
    if (isDemoMode) return true;

    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60);

    return timeDiff <= 15 && timeDiff >= -60;
  };

  const getMeetingStatus = (scheduledDate: string, scheduledTime: string) => {
    const consultDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const timeDiff = (consultDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (timeDiff > 15) {
      return `Available in ${Math.ceil(timeDiff)} min`;
    } else if (timeDiff > 0) {
      return 'Join Now';
    } else if (timeDiff >= -60) {
      return 'Join Now';
    } else {
      return 'Ended';
    }
  };
  const handleApprove = async (consultationId: number) => {
    if (!confirm('Are you sure you want to approve this consultation request?')) {
      return;
    }

    try {
      setProcessingId(consultationId);
      await bookingApiService.approveConsultation(consultationId);

      toast({
        title: "Approved!",
        description: "Consultation approved and payment processed",
      });

      // Reload data
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve consultation",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (consultation: VideoConsultation) => {
    setRejectingConsultation(consultation);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingConsultation) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingId(rejectingConsultation.id);
      await bookingApiService.rejectConsultation(rejectingConsultation.id, rejectionReason);

      toast({
        title: "Rejected",
        description: "Consultation request has been rejected",
      });

      setIsRejectDialogOpen(false);
      setRejectingConsultation(null);
      setRejectionReason('');

      // Reload data
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject consultation",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatFee = (fee: string | number): string => {
    const numFee = typeof fee === 'string' ? parseFloat(fee) : fee;
    return isNaN(numFee) ? '0.00' : numFee.toFixed(2);
  };

  if (loading && pendingRequests.length === 0 && upcomingConsultations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading consultations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pending Approval Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Pending Approval Requests
                  {pendingRequests.length > 0 && (
                    <Badge className="bg-yellow-500">{pendingRequests.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Review and approve consultation requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No pending requests</p>
                <p className="text-sm mt-1">All consultation requests have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-lg">{request.patient_name}</h4>
                          <Badge className="bg-yellow-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Date:</span>
                              {new Date(request.scheduled_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Time:</span>
                              {formatTime(request.scheduled_time)}
                            </p>
                            <p className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Duration:</span>
                              {request.duration_minutes} minutes
                            </p>
                          </div>

                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-gray-700">
                              <Mail className="w-4 h-4 text-blue-600" />
                              {request.patient_email}
                            </p>
                            <p className="flex items-center gap-2 text-gray-700">
                              <Phone className="w-4 h-4 text-blue-600" />
                              {request.patient_phone}
                            </p>
                            {request.patient_blood_group && (
                              <p className="flex items-center gap-2 text-gray-700">
                                <Droplet className="w-4 h-4 text-red-600" />
                                <span className="font-medium">Blood Group:</span>
                                {request.patient_blood_group}
                              </p>
                            )}
                          </div>
                        </div>

                        {request.patient_allergies && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Allergies:</strong> {request.patient_allergies}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-yellow-300">
                          <p className="text-sm text-gray-600">
                            <strong>Consultation Fee:</strong>
                            <span className="text-lg font-bold text-green-600 ml-2">
                              ₹{formatFee(request.consultation_fee)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested on: {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          onClick={() => openRejectDialog(request)}
                          disabled={processingId === request.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Consultations */}
        {/* Upcoming Consultations - Shows both pending and confirmed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-600" />
              Upcoming Video Consultations
              {upcomingConsultations.length > 0 && (
                <Badge className="bg-green-500">{upcomingConsultations.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Your confirmed and approved scheduled consultations</CardDescription>
          </CardHeader>
          <CardContent className="max-h-45 overflow-y-auto">
            {upcomingConsultations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No upcoming consultations</p>
                <p className="text-sm mt-1">Approved consultations will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className={`border rounded-lg p-4 ${consultation.status === 'confirmed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{consultation.patient_name}</h4>
                          {consultation.status === 'confirmed' ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending Approval
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(consultation.scheduled_date).toLocaleDateString()} at {formatTime(consultation.scheduled_time)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Duration: {consultation.duration_minutes} minutes
                          </p>
                          <p className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Fee: ₹{formatFee(consultation.consultation_fee)}
                            {consultation.payment_status === 'paid' ? ' (Paid)' : ' (Not paid yet)'}
                          </p>
                          {consultation.patient_email && (
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {consultation.patient_email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {/* Demo Mode - Always available */}
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleStartMeeting(consultation, true)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Start (Demo)
                        </Button>

                        {/* Real Mode - Time-based */}
                        <Button
                          size="sm"
                          disabled={!canJoinMeeting(consultation.scheduled_date, consultation.scheduled_time, false)}
                          onClick={() => handleStartMeeting(consultation, false)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          {getMeetingStatus(consultation.scheduled_date, consultation.scheduled_time)}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Consultation Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this consultation request
            </DialogDescription>
          </DialogHeader>

          {rejectingConsultation && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Patient:</strong> {rejectingConsultation.patient_name}
                </p>
                <p className="text-sm">
                  <strong>Date:</strong> {new Date(rejectingConsultation.scheduled_date).toLocaleDateString()}
                  at {formatTime(rejectingConsultation.scheduled_time)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Reason for Rejection *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Not available at this time, Emergency cases only, etc."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectingConsultation(null);
                    setRejectionReason('');
                  }}
                  disabled={processingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processingId !== null || !rejectionReason.trim()}
                >
                  {processingId !== null ? 'Processing...' : 'Reject Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {isInCall && activeConsultation && (
        <VideoCallRoom
          consultationId={activeConsultation.id}
          userId={doctorId}
          role="doctor"
          patientName={activeConsultation.patient_name}
          duration={activeConsultation.duration_minutes}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}