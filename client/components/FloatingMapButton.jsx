import { MapPin } from "lucide-react";

export function FloatingMapButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-[1000]
        w-14 h-14 rounded-full
        bg-primary text-white
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-300
        hover:scale-105
        animate-pulse
      "
      aria-label="Open Nearby Hospitals Map"
    >
      <MapPin className="w-6 h-6" />
    </button>
  );
}
