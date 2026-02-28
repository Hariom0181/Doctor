import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Activity } from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabsRef: React.RefObject<HTMLDivElement>;
  logout: () => void;
}

export function DashboardHeader({ activeTab, setActiveTab, tabsRef, logout }: DashboardHeaderProps) {
  const scrollToTabs = (tab: string) => {
    setActiveTab(tab);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tabs = ["overview", "records", "appointments", "medications"];

  const tabLabel = (tab: string) => {
    const labels: Record<string, string> = {
      overview: "Overview",
      records: "Records",
      appointments: "Appointments",
      medications: "Medications",
    };
    return labels[tab] ?? tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[68px]">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)] group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.4)] transition-shadow duration-200">
              <Heart className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold text-slate-900 tracking-tight">HealthTrack</span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Patient Portal</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToTabs(tab)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 capitalize ${
                  activeTab === tab
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tabLabel(tab)}
                {activeTab === tab && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}

            <div className="h-5 w-px bg-slate-200 mx-3" />

            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  window.location.href = "/patient/login";
                  logout();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 group"
            >
              <LogOut className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}