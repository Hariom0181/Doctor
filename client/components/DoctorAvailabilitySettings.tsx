import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, DollarSign, Save } from 'lucide-react';
import { videoConsultationApiService } from '@/services/videoConsultationApi';
import { useToast } from '@/hooks/use-toast';

interface DoctorAvailabilitySettingsProps {
  doctorId: number;
}

interface DayAvailability {
  day_of_week: number;
  day_name: string;
  is_available: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

interface FeeStructure {
  duration_minutes: number;
  fee: string;
  label: string;
}

export function DoctorAvailabilitySettings({ doctorId }: DoctorAvailabilitySettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [availability, setAvailability] = useState<DayAvailability[]>([
    { day_of_week: 1, day_name: 'Monday', is_available: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 },
    { day_of_week: 2, day_name: 'Tuesday', is_available: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 },
    { day_of_week: 3, day_name: 'Wednesday', is_available: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 },
    { day_of_week: 4, day_name: 'Thursday', is_available: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 },
    { day_of_week: 5, day_name: 'Friday', is_available: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 },
    { day_of_week: 6, day_name: 'Saturday', is_available: false, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 30 },
    { day_of_week: 7, day_name: 'Sunday', is_available: false, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 30 },
  ]);

  const [fees, setFees] = useState<FeeStructure[]>([
    { duration_minutes: 15, fee: '300', label: '15 Minutes' },
    { duration_minutes: 30, fee: '500', label: '30 Minutes' },
    { duration_minutes: 60, fee: '800', label: '1 Hour' },
  ]);

  useEffect(() => {
    loadSettings();
  }, [doctorId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load availability
      const availabilityData = await videoConsultationApiService.getDoctorAvailability(doctorId);
      console.log("fetching availability of doctor id ",doctorId);
      console.log("fetching availability data ",availabilityData);
      
      if (availabilityData.length > 0) {
        setAvailability(prev => 
          prev.map(day => {
            const existing = availabilityData.find(a => a.day_of_week === day.day_of_week);
            if (existing) {
              return {
                ...day,
                is_available: existing.is_available,
                start_time: existing.start_time.substring(0, 5), // Remove seconds
                end_time: existing.end_time.substring(0, 5),
                slot_duration_minutes: existing.slot_duration_minutes
              };
            }
            return day;
          })
        );
      }

      // Load fees
      const feesData = await videoConsultationApiService.getDoctorConsultationFees(doctorId);
      
      if (feesData.length > 0) {
        setFees(prev => 
          prev.map(feeItem => {
            const existing = feesData.find(f => f.duration_minutes === feeItem.duration_minutes);
            if (existing) {
              return {
                ...feeItem,
                fee: existing.fee.toString()
              };
            }
            return feeItem;
          })
        );
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Info",
        description: "No existing settings found. Please configure your availability.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (dayIndex: number, field: string, value: any) => {
    setAvailability(prev => 
      prev.map((day, idx) => 
        idx === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const handleFeeChange = (index: number, value: string) => {
    setFees(prev => 
      prev.map((fee, idx) => 
        idx === index ? { ...fee, fee: value } : fee
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate fees
      const invalidFees = fees.some(f => !f.fee || parseFloat(f.fee) <= 0);
      if (invalidFees) {
        toast({
          title: "Validation Error",
          description: "Please enter valid consultation fees",
          variant: "destructive"
        });
        return;
      }

      // Save availability
      const availabilityToSave = availability.map(day => ({
        day_of_week: day.day_of_week,
        start_time: day.start_time + ':00',
        end_time: day.end_time + ':00',
        slot_duration_minutes: day.slot_duration_minutes,
        is_available: day.is_available
      }));

      await videoConsultationApiService.setDoctorAvailability(availabilityToSave);

      // Save fees
      const feesToSave = fees.map(f => ({
        duration_minutes: f.duration_minutes,
        fee: parseFloat(f.fee)
      }));

      await videoConsultationApiService.setConsultationFees(feesToSave);

      toast({
        title: "Success!",
        description: "Your availability and consultation fees have been updated",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Availability
          </CardTitle>
          <CardDescription>
            Set your available days and time slots for video consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availability.map((day, index) => (
              <div key={day.day_of_week} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3 w-32">
                  <Switch
                    checked={day.is_available}
                    onCheckedChange={(checked) => handleAvailabilityChange(index, 'is_available', checked)}
                  />
                  <Label className="font-medium">{day.day_name}</Label>
                </div>

                {day.is_available && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <Input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                        className="w-32"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Slot Duration:</Label>
                      <select
                        value={day.slot_duration_minutes}
                        onChange={(e) => handleAvailabilityChange(index, 'slot_duration_minutes', parseInt(e.target.value))}
                        className="border rounded px-3 py-2"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                  </>
                )}

                {!day.is_available && (
                  <span className="text-gray-400 italic">Not Available</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consultation Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Consultation Fees
          </CardTitle>
          <CardDescription>
            Set your consultation fees based on duration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fees.map((fee, index) => (
              <div key={fee.duration_minutes} className="flex items-center gap-4 p-4 border rounded-lg">
                <Label className="w-32 font-medium">{fee.label}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">₹</span>
                  <Input
                    type="number"
                    value={fee.fee}
                    onChange={(e) => handleFeeChange(index, e.target.value)}
                    placeholder="Enter fee"
                    className="w-40"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Patients will be charged based on the selected consultation duration. 
              If you end the consultation early, they will receive a partial refund.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}