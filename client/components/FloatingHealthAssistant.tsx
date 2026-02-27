import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Sparkles } from "lucide-react";
import { MedicalReportAnalyzer } from "@/components/MedicalReportAnalyzer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "./ui/badge";

interface FloatingHealthAssistantProps {
  patientId: number;
}

export function FloatingHealthAssistant({ patientId }: FloatingHealthAssistantProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Professional AI Assistant Button */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-28 right-6 z-50
          h-16 w-16 rounded-2xl
          flex items-center justify-center
          bg-slate-900 text-white
          shadow-[0_20px_50px_rgba(0,0,0,0.3)]
          transition-all duration-300 ease-in-out
          hover:scale-105 hover:-translate-y-2
          active:scale-95
          group
          border-b-4 border-slate-950
        "
        aria-label="Open AI Health Assistant"
      >
        {/* Ambient AI Glow Effect */}
        <span className="absolute inset-0 rounded-2xl bg-amber-400/10 animate-pulse group-hover:bg-amber-400/20 transition-colors" />

        {/* Icon Container */}
        <div className="relative flex items-center justify-center">
          {/* Main Icon */}
          <MessageSquare className="w-7 h-7 text-slate-200 transition-transform group-hover:scale-110" />

          {/* Sparkle Badge - Floating Animation */}
          <div className="
            absolute -top-3 -right-3 
            w-7 h-7 rounded-xl 
            bg-gradient-to-br from-amber-300 to-amber-500 
            flex items-center justify-center 
            border-2 border-slate-900 
            shadow-lg shadow-amber-500/40 
            group-hover:rotate-12 transition-all duration-300
          ">
            <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-slate-900/20" />
          </div>
        </div>

        {/* Professional Tooltip - Synced with Map Button Style */}
        <span className="
          absolute right-20 
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          scale-90 group-hover:scale-100 
          translate-x-2 group-hover:translate-x-0
          transition-all duration-200 ease-out origin-right
          bg-slate-900 text-white text-xs font-semibold 
          py-2.5 px-4 rounded-xl shadow-2xl whitespace-nowrap
          pointer-events-none
          border border-slate-800
        ">
          AI Health Assistant
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-t border-slate-800" />
        </span>
      </button>

      {/* Dialog Window - Refined Professional UI */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="
            fixed bottom-6 right-6 
            sm:left-auto sm:top-auto 
            translate-x-0 translate-y-0 
            w-[calc(100vw-2rem)] sm:w-[450px] 
            h-[85vh] max-h-[800px] 
            p-0 gap-0 overflow-hidden 
            rounded-3xl border-none 
            bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] 
            flex flex-col
          "
        >
          <VisuallyHidden>
            <DialogTitle>AI Medical Assistant</DialogTitle>
          </VisuallyHidden>

          {/* Optional Header for the Dialog */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-bold text-slate-900">Health AI</span>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase tracking-wider">
              Ready to Analyze
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto">
            <MedicalReportAnalyzer patientId={patientId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}