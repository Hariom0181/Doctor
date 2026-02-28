import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, DollarSign, Save, Loader2, Info, CheckCircle2 } from 'lucide-react';
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
      const availabilityData = await videoConsultationApiService.getDoctorAvailability(doctorId);
      
      if (availabilityData.length > 0) {
        setAvailability(prev => 
          prev.map(day => {
            const existing = availabilityData.find(a => a.day_of_week === day.day_of_week);
            if (existing) {
              return {
                ...day,
                is_available: existing.is_available,
                start_time: existing.start_time.substring(0, 5),
                end_time: existing.end_time.substring(0, 5),
                slot_duration_minutes: existing.slot_duration_minutes
              };
            }
            return day;
          })
        );
      }

      const feesData = await videoConsultationApiService.getDoctorConsultationFees(doctorId);
      if (feesData.length > 0) {
        setFees(prev => 
          prev.map(feeItem => {
            const existing = feesData.find(f => f.duration_minutes === feeItem.duration_minutes);
            if (existing) {
              return { ...feeItem, fee: existing.fee.toString() };
            }
            return feeItem;
          })
        );
      }
    } catch (error) {
      toast({
        title: "Configuration Needed",
        description: "Please set up your preferred consultation hours and fees.",
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
      const invalidFees = fees.some(f => !f.fee || parseFloat(f.fee) <= 0);
      if (invalidFees) {
        toast({
          title: "Validation Error",
          description: "Please enter valid consultation fees",
          variant: "destructive"
        });
        return;
      }

      const availabilityToSave = availability.map(day => ({
        day_of_week: day.day_of_week,
        start_time: day.start_time + ':00',
        end_time: day.end_time + ':00',
        slot_duration_minutes: day.slot_duration_minutes,
        is_available: day.is_available
      }));

      await videoConsultationApiService.setDoctorAvailability(availabilityToSave);

      const feesToSave = fees.map(f => ({
        duration_minutes: f.duration_minutes,
        fee: parseFloat(f.fee)
      }));

      await videoConsultationApiService.setConsultationFees(feesToSave);

      toast({
        title: "Settings Saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
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
      <Card className="border-none shadow-md">
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground font-medium">Synchronizing your schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Availability Settings */}
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader className="border-b bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-3 text-slate-800">
                <Calendar className="w-6 h-6 text-blue-600" />
                Working Hours
              </CardTitle>
              <CardDescription className="text-base text-slate-500">
                Define when patients can book video consultations with you.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3">
            {availability.map((day, index) => (
              <div 
                key={day.day_of_week} 
                className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  day.is_available 
                  ? "bg-white border-blue-100 shadow-sm" 
                  : "bg-slate-50/50 border-slate-100 opacity-70"
                }`}
              >
                <div className="flex items-center gap-4 min-w-[140px]">
                  <Switch
                    id={`day-${day.day_of_week}`}
                    checked={day.is_available}
                    onCheckedChange={(checked) => handleAvailabilityChange(index, 'is_available', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor={`day-${day.day_of_week}`} className="font-bold text-slate-700 cursor-pointer">
                    {day.day_name}
                  </Label>
                </div>

                {day.is_available ? (
                  <div className="flex flex-1 flex-wrap items-center gap-6 justify-end">
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-400 ml-2" />
                      <Input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                        className="w-28 border-none bg-transparent shadow-none focus-visible:ring-0 h-8"
                      />
                      <span className="text-slate-400 font-medium">to</span>
                      <Input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                        className="w-28 border-none bg-transparent shadow-none focus-visible:ring-0 h-8"
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-[180px]">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Slots:</span>
                      <select
                        value={day.slot_duration_minutes}
                        onChange={(e) => handleAvailabilityChange(index, 'slot_duration_minutes', parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg text-sm font-medium px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 py-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm italic">Offline</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fees Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Service Pricing
            </CardTitle>
            <CardDescription>Determine the cost per session duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fees.map((fee, index) => (
              <div key={fee.duration_minutes} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <Clock className="w-4 h-4 text-emerald-700" />
                  </div>
                  <Label className="font-semibold text-slate-700">{fee.label}</Label>
                </div>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <Input
                    type="number"
                    value={fee.fee}
                    onChange={(e) => handleFeeChange(index, e.target.value)}
                    className="pl-8 w-40 h-11 bg-white border-slate-200 rounded-lg focus:ring-emerald-500 font-mono font-bold text-lg"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="space-y-4">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold">Patient Policy</h3>
            </div>
            <p className="text-blue-50 leading-relaxed text-sm">
              Patients are charged upfront based on duration. If a session is ended prematurely, the system calculates a fair partial refund automatically.
            </p>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`w-full h-16 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-95 ${
              saving ? "bg-slate-100" : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {saving ? (
              <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Apply Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}