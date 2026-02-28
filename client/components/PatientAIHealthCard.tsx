import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Stethoscope, AlertTriangle, Sparkles, Activity, Clock, Heart, Shield } from "lucide-react";
import { LinkedDoctor } from "@/services/patientApi";

interface PatientAIHealthCardProps {
  linkedDoctors: LinkedDoctor[];
}

const ANALYSIS_ITEMS = [
  { icon: Heart,      label: "Age and medical history" },
  { icon: Activity,   label: "Recent diagnoses and prescriptions" },
  { icon: Clock,      label: "Visit frequency (last 3 months)" },
  { icon: Brain,      label: "Identified health patterns" },
  { icon: Shield,     label: "Chronic conditions and allergies" },
];

export function PatientAIHealthCard({ linkedDoctors }: PatientAIHealthCardProps) {

  // ── No doctor linked ──
  if (linkedDoctors.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
        <div className="h-0.5 w-full bg-gradient-to-r from-slate-300/50 to-transparent" />

        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-800 tracking-tight">
                AI Health Analysis
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Powered by advanced health intelligence
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-600 text-sm mb-0.5">
                No Doctor Linked
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Please link with a doctor first to unlock AI health analysis and personalized insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Doctor linked ──
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
      <div className="h-0.5 w-full bg-gradient-to-r from-violet-500/50 via-blue-400/30 to-transparent" />

      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                AI Health Analysis
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg">
                  <Sparkles className="w-3 h-3" />
                  AI Powered
                </span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Get AI-powered insights about your health status
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">

        {/* About section */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-slate-50 p-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
                About AI Analysis
              </p>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                Our AI analyzes your complete medical history, recent visits, diagnoses, and vital signs
                to calculate a comprehensive health risk score and provide personalized insights.
              </p>
            </div>
          </div>
        </div>

        {/* What's analyzed */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            What's Analyzed
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ANALYSIS_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xs text-slate-600 font-medium leading-tight">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor note */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">
              Doctor Action Required
            </p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Your doctor needs to trigger this analysis. Contact{" "}
              <span className="font-black">{linkedDoctors[0].name}</span>{" "}
              to request an AI health assessment.
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}