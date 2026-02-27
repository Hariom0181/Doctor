import { useState } from "react";
import { MapPin, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils"; // Standard shadcn utility

interface FloatingActionsProps {
  onOpenMap: () => void;
  onOpenChat: () => void;
}

export function FloatingActions({ onOpenMap, onOpenChat }: FloatingActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-end gap-3"
          >
            {/* Map Button */}
            <div className="flex items-center gap-3">
              <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium shadow-sm border">Map</span>
              <Button
                size="icon"
                onClick={() => {
                  onOpenMap();
                  setOpen(false);
                }}
                className="h-12 w-12 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-110"
              >
                <MapPin className="w-5 h-5 text-white" />
              </Button>
            </div>

            {/* Chat Button */}
            <div className="flex items-center gap-3">
              <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium shadow-sm border">Chat</span>
              <Button
                size="icon"
                onClick={() => {
                  onOpenChat();
                  setOpen(false);
                }}
                className="h-12 w-12 rounded-full shadow-xl bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-110"
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB */}
      <Button
        size="icon"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          open ? "bg-slate-800 hover:bg-slate-900" : "bg-primary"
        )}
      >
        <Plus
          className={cn(
            "w-7 h-7 text-white transition-transform duration-300",
            open && "rotate-45"
          )}
        />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </div>
  );
}