import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, LogOut } from "lucide-react";

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

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HealthTrack</h1>
              <p className="text-sm text-gray-600">Patient Portal</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {["overview", "records", "appointments", "medications"].map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToTabs(tab)}
                className={`font-medium transition-colors capitalize ${
                  activeTab === tab ? "text-primary" : "text-gray-700 hover:text-primary"
                }`}
              >
                {tab === "records" ? "Records" :
                 tab === "appointments" ? "Appointments" :
                 tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="flex items-center space-x-3 ml-6 border-l pl-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to logout?")) {
                    window.location.href = "/patient/login";
                    logout();
                  }
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}