import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function PatientEmergencyBanner() {
  return (
    <Card className="mt-8 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50/50 overflow-hidden shadow-sm">
      <div className="h-0.5 w-full bg-gradient-to-r from-red-400/60 via-rose-400/40 to-transparent" />
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">
              Emergency Helpline
            </p>
            <div className="space-y-0.5">
              <p className="text-xs text-red-700 font-medium">
                Medical Advice Service, Govt. of Maharashtra —{" "}
                <span className="font-black text-red-800">104</span>{" "}
                <span className="text-red-400">(24/7 available)</span>
              </p>
              <p className="text-xs text-red-700 font-medium">
                Women Crisis Response Center —{" "}
                <span className="font-black text-red-800">1091</span>{" "}
                <span className="text-red-400">(24/7 available)</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-xl font-bold shrink-0 transition-all"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}