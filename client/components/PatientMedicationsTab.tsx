import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Loader2, Clock, User, Calendar, AlertCircle } from "lucide-react";

interface Prescription {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  status: string;
  duration: string;
  doctor_name: string;
  start_date: string;
  instructions?: string;
}

interface PatientMedicationsTabProps {
  prescriptions: Prescription[];
  isLoadingPrescriptions: boolean;
  formatFrequency: (freq: string) => string;
}

const getFrequencyDots = (frequency: string): number => {
  switch (frequency) {
    case "once":       return 1;
    case "twice":      return 2;
    case "thrice":     return 3;
    case "four_times": return 4;
    default:           return 1;
  }
};

export function PatientMedicationsTab({
  prescriptions,
  isLoadingPrescriptions,
  formatFrequency,
}: PatientMedicationsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-green-500/50 via-green-400/30 to-transparent" />

        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  Current Medications
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Manage your active prescriptions
                </CardDescription>
              </div>
            </div>

            {!isLoadingPrescriptions && prescriptions.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                {prescriptions.length} Active
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8">

          {/* Loading */}
          {isLoadingPrescriptions && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-5 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded-lg w-36" />
                        <div className="h-3 bg-slate-200 rounded-lg w-24" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-slate-200 rounded-lg w-20" />
                    <div className="h-3 bg-slate-200 rounded-lg w-28" />
                    <div className="h-3 bg-slate-200 rounded-lg w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoadingPrescriptions && prescriptions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 mb-2">No Active Medications</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Your prescribed medications will appear here when doctors add them
              </p>
            </div>
          )}

          {/* Medications List */}
          {!isLoadingPrescriptions && prescriptions.length > 0 && (
            <div className="space-y-4">
              {prescriptions.map((med) => (
                <div
                  key={med.id}
                  className="group border border-slate-200/80 rounded-2xl p-5 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                >
                  {/* Left accent bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-all duration-200" />

                  {/* Top accent on hover */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400/60 to-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Pill icon box */}
                      <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                        <Pill className="w-5 h-5 text-green-600" />
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-base leading-tight">
                          {med.medication_name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {med.dosage} · {formatFrequency(med.frequency)}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-100 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {med.status === "active" ? "Active" : med.status}
                    </span>
                  </div>

                  {/* Frequency dots visual */}
                  {med.frequency !== 'as_needed' && med.frequency !== 'weekly' && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Daily</span>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            i < getFrequencyDots(med.frequency)
                              ? 'bg-green-500 border-green-500'
                              : 'bg-slate-100 border-slate-200'
                          }`}
                        >
                          {i < getFrequencyDots(med.frequency) && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      ))}
                      <span className="text-[10px] font-bold text-slate-400 ml-1">
                        {getFrequencyDots(med.frequency)}x per day
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-slate-100 pt-3 mb-3" />

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {med.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {med.doctor_name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Started {new Date(med.start_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <div className="mt-4 bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">
                          Instructions
                        </p>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          {med.instructions}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}