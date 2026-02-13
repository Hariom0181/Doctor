import { useState } from "react";
import { MapPin, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionsProps {
  onOpenMap: () => void;
  onOpenChat: () => void;
}

export function FloatingActions({ onOpenMap, onOpenChat }: FloatingActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Buttons */}
      {open && (
        <>
          <Button
            onClick={() => {
              onOpenMap();
              setOpen(false);
            }}
            className="h-12 w-12 rounded-full shadow bg-blue-600 hover:bg-blue-700"
          >
            <MapPin className="w-5 h-5 text-white" />
          </Button>

          <Button
            onClick={() => {
              onOpenChat();
              setOpen(false);
            }}
            className="h-12 w-12 rounded-full shadow bg-green-600 hover:bg-green-700"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </Button>
        </>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setOpen(!open)}
        className="
          h-14 w-14 rounded-full
          shadow-lg
          bg-primary hover:bg-primary/90
          flex items-center justify-center
          transition-transform
        "
      >
        <Plus
          className={`w-6 h-6 text-white transition-transform ${
            open ? "rotate-45" : ""
          }`}
        />
      </Button>
    </div>
  );
}
