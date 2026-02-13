  import { useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Dialog, DialogContent } from "@/components/ui/dialog";
  import { Sparkles, MessageSquare } from "lucide-react";
  import { MedicalReportAnalyzer } from "@/components/MedicalReportAnalyzer";

  interface FloatingHealthAssistantProps {
    patientId: number;
  }

  export function FloatingHealthAssistant({ patientId }: FloatingHealthAssistantProps) {
    const [open, setOpen] = useState(false);

    return (
      <>
        {/* Floating Button */}
        <Button
          onClick={() => setOpen(true)}
          className="
            fixed bottom-20 right-6 z-50
            h-14 w-14 rounded-full
            shadow-lg
            bg-primary hover:bg-primary/90
            flex items-center justify-center
          "
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>

        {/* Dialog / Drawer */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="
              max-w-3xl
              h-[85vh]
              p-0
              overflow-y-auto
            "
          >
            <MedicalReportAnalyzer patientId={patientId} />
          </DialogContent>
        </Dialog>
      </>
    );
  }
