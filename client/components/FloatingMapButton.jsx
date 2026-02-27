import { MapPin, Navigation } from "lucide-react";

export function FloatingMapButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-[1000]
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
      aria-label="Open Nearby Hospitals Map"
    >
      {/* Animated Pulse Ring */}
      <span className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping group-hover:animate-none" />

      {/* Icon Container */}
      <div className="relative flex items-center justify-center">
        {/* Main Map Pin Icon */}
        <MapPin className="w-7 h-7 text-blue-400 transition-transform group-hover:scale-110 group-hover:rotate-3" />
        
        {/* Secondary Detail - Navigation Arrow */}
        <Navigation 
          className="
            absolute -top-1 -right-2 
            w-3.5 h-3.5 text-white 
            fill-white
            opacity-0 group-hover:opacity-100
            transition-all duration-300
            translate-x-[-4px] group-hover:translate-x-0
          " 
        />
      </div>

      {/* Refined Professional Tooltip - Fixed Visibility Logic */}
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
        Find Nearby Hospitals
        {/* Subtle Arrow for Tooltip */}
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-t border-slate-800" />
      </span>
    </button>
  );
}