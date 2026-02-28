import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, MapPin, Phone, Settings, 
  Stethoscope, Shield, FileDown, RefreshCw,
  Mail, CheckCircle2, ChevronRight, Fingerprint, Activity
} from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";

// --- START: Missing Interfaces ---
interface PatientData {
  id: number | string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface DoctorListItem {
  id: string;
  name: string;
  specialization: string;
}

interface PatientProfileTabProps {
  patientData: PatientData | null;
  linkedDoctors: LinkedDoctor[];
  selectedDoctor: string;
  setSelectedDoctor: (val: string) => void;
  doctorsList: DoctorListItem[];
  isLoadingAvailableDoctors: boolean;
  handleDoctorSelection: (doctorId: string) => void;
}
// --- END: Missing Interfaces ---

export function PatientProfileTab({
  patientData,
  linkedDoctors,
  selectedDoctor,
  setSelectedDoctor,
  doctorsList,
  isLoadingAvailableDoctors,
  handleDoctorSelection,
}: PatientProfileTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-2 bg-[#f8fafc]">
      
      {/* ── LEFT: Identity & Info ── */}
      <Card className="lg:col-span-7 rounded-[2rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
        <div className="h-2 w-full bg-indigo-600" />
        
        <CardHeader className="pb-8 pt-10 px-10 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
                <Fingerprint className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                  Patient Identity
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500">
                    ID: {patientData?.id || 'REF-882'}
                  </Badge>
                  <span className="text-xs text-slate-400">• Verified Record</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-6">
              Manage
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {[
              { icon: User, label: "Full Legal Name", value: patientData?.name },
              { icon: Mail, label: "Digital Mail", value: patientData?.email },
              { icon: Phone, label: "Primary Phone", value: patientData?.phone },
              { icon: MapPin, label: "Registered Address", value: patientData?.address },
            ].map((item, idx) => (
              <div key={idx} className="group transition-all">
                <dt className="flex items-center gap-2 mb-2.5">
                  <item.icon className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {item.label}
                  </span>
                </dt>
                <dd className="text-base font-semibold text-slate-800 border-b-2 border-slate-50 group-hover:border-indigo-100 pb-3 transition-colors">
                  {item.value || <span className="text-slate-300 font-normal italic">Unspecified</span>}
                </dd>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-indigo-600 flex items-center justify-between text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-indigo-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Health Compliance</p>
              </div>
              <p className="text-sm font-medium">Encrypted medical data under 256-bit HIPAA standards.</p>
            </div>
            <Shield className="w-16 h-16 text-white/10 absolute -right-4 -bottom-4" />
          </div>
        </CardContent>
      </Card>

      {/* ── RIGHT: Medical Care ── */}
      <div className="lg:col-span-5 space-y-8">
        
        <Card className="rounded-[2rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Medical Team</h3>
                <Stethoscope className="w-5 h-5 text-indigo-600" />
             </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {linkedDoctors.length > 0 ? (
              <div className="group relative p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all mb-8">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <span className="text-indigo-600 font-black text-2xl">
                      {linkedDoctors[0].name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Lead Physician</p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight">Dr. {linkedDoctors[0].name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{linkedDoctors[0].specialization}</p>
                  </div>
                </div>
              </div>
            ) : (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 text-center mb-8">
                    <p className="text-sm font-bold text-slate-400">No primary doctor assigned</p>
                </div>
            )}

            <div className="space-y-4">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Care Provider</Label>
              <div className="flex flex-col gap-3">
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50 font-semibold focus:ring-indigo-500/20 text-slate-700">
                    <SelectValue placeholder="Select from network..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl border-none">
                    {isLoadingAvailableDoctors ? (
                      <SelectItem value="loading" disabled>Syncing database...</SelectItem>
                    ) : (
                      doctorsList.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id} className="py-4 border-b border-slate-50 last:border-0 cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{doctor.name}</span>
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{doctor.specialization}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedDoctor && (
                  <Button 
                    onClick={() => handleDoctorSelection(selectedDoctor)}
                    className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Apply Transfer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action List */}
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <FileDown className="w-5 h-5 text-indigo-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm">Download Clinical Summary</p>
                <p className="text-xs text-slate-400 font-medium">Last updated: Today, 09:42 AM</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400" />
          </button>
        </div>

      </div>
    </div>
  );
}