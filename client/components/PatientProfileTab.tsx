import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, MapPin, Phone, Settings, Download,
  Stethoscope, Shield, FileDown, RefreshCw,
  Mail, Building2, Calendar, CheckCircle2
} from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── LEFT: Personal Information ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-blue-400/30 to-transparent" />

        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your basic details and contact information
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-5">

          {/* Info Fields */}
          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Full Name
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {patientData?.name || '—'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Email Address
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {patientData?.email || '—'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Phone Number
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {patientData?.phone || '—'}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Address
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {patientData?.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <Button className="w-full h-11 rounded-2xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all">
            Edit Profile
          </Button>

        </CardContent>
      </Card>

      {/* ── RIGHT: Doctor + Quick Actions ── */}
      <div className="space-y-5">

        {/* Doctor Selection Card */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 via-blue-400/30 to-transparent" />

          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-800 tracking-tight">
                  My Doctor
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Your location and emergency information
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-4">

            {/* Current Doctor Banner */}
            {linkedDoctors.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-400/20 border border-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-black text-sm">
                        {linkedDoctors[0].name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          Current Doctor
                        </p>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </div>
                      <p className="font-black text-slate-800 text-sm leading-tight truncate">
                        {linkedDoctors[0].name}
                      </p>
                      <p className="text-xs text-primary font-bold mt-0.5">
                        {linkedDoctors[0].specialization}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Linked since {new Date(linkedDoctors[0].linkedDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Change Doctor
              </Label>
              <div className="flex gap-2">
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="flex-1 h-11 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-primary/20">
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {isLoadingAvailableDoctors ? (
                      <SelectItem value="loading" disabled>
                        Loading doctors...
                      </SelectItem>
                    ) : doctorsList.length > 0 ? (
                      doctorsList.map((doctor) => (
                        <SelectItem
                          key={doctor.id}
                          value={doctor.id}
                          className="py-3 rounded-lg focus:bg-primary/5"
                        >
                          <span className="font-bold text-slate-800">{doctor.name}</span>
                          <span className="ml-2 text-slate-400 text-xs">— {doctor.specialization}</span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No doctors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {selectedDoctor && (
                  <Button
                    onClick={() => handleDoctorSelection(selectedDoctor)}
                    className="h-11 px-5 rounded-xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all shrink-0"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Update
                  </Button>
                )}
              </div>

              {selectedDoctor && (
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                  Click Update to change your assigned doctor
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-slate-400/30 to-transparent" />

          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-800 tracking-tight">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Manage your account settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-2.5">
            {[
              {
                icon: FileDown,
                label: "Download Health Summary",
                desc: "Export your full medical history",
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-100 hover:border-blue-200"
              },
              {
                icon: Phone,
                label: "Emergency Contacts",
                desc: "Manage your emergency contacts",
                color: "text-red-500",
                bg: "bg-red-50",
                border: "border-red-100 hover:border-red-200"
              },
              {
                icon: Shield,
                label: "Privacy Settings",
                desc: "Control your data and privacy",
                color: "text-slate-500",
                bg: "bg-slate-100",
                border: "border-slate-200 hover:border-slate-300"
              },
            ].map((action) => (
              <button
                key={action.label}
                className={`w-full group flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left ${action.border}`}
              >
                <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 text-sm leading-tight">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}