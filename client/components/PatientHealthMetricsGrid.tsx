import { Card, CardContent } from "@/components/ui/card";
import { Activity, Heart, Thermometer, Weight, HeartPulse } from "lucide-react";

interface HealthMetric {
  id?: number;
  label: string;
  value: string;
  status: string;
  lastChecked: string;
  notes?: string;
}

interface PatientHealthMetricsGridProps {
  healthMetrics: HealthMetric[];
}

const getMetricColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":   return "text-green-600";
    case "warning":  return "text-yellow-600";
    case "critical": return "text-red-600";
    default:         return "text-gray-500";
  }
};

const getMetricBg = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":   return "bg-green-50 border-green-100";
    case "warning":  return "bg-yellow-50 border-yellow-100";
    case "critical": return "bg-red-50 border-red-100";
    default:         return "bg-slate-50 border-slate-100";
  }
};

const getMetricIconBg = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":   return "bg-green-100";
    case "warning":  return "bg-yellow-100";
    case "critical": return "bg-red-100";
    default:         return "bg-slate-100";
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Not recorded";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const PLACEHOLDER_METRICS = [
  { label: 'Blood Pressure', icon: Heart },
  { label: 'Temperature',    icon: Thermometer },
  { label: 'Weight',         icon: Activity },
  { label: 'Heart Rate',     icon: HeartPulse },
];

export function PatientHealthMetricsGrid({ healthMetrics }: PatientHealthMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

      {healthMetrics.length > 0 ? (
        healthMetrics.map((metric, index) => (
          <Card
            key={metric.id || index}
            className={`border ${getMetricBg(metric.status)} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}
          >
            {/* Top status strip */}
            <div className={`h-1 w-full ${
              metric.status?.toLowerCase() === 'normal'   ? 'bg-green-400' :
              metric.status?.toLowerCase() === 'warning'  ? 'bg-yellow-400' :
              metric.status?.toLowerCase() === 'critical' ? 'bg-red-400' :
              'bg-slate-300'
            }`} />

            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-black tracking-tight ${getMetricColor(metric.status)}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {formatDate(metric.lastChecked)}
                  </p>
                  {metric.notes && (
                    <p className="text-xs text-slate-400 italic mt-1 line-clamp-1">
                      {metric.notes}
                    </p>
                  )}
                </div>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3 ${getMetricIconBg(metric.status)}`}>
                  <Activity className={`w-5 h-5 ${getMetricColor(metric.status)}`} />
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-3 pt-3 border-t border-slate-200/60">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                  metric.status?.toLowerCase() === 'normal'   ? 'bg-green-100 text-green-700' :
                  metric.status?.toLowerCase() === 'warning'  ? 'bg-yellow-100 text-yellow-700' :
                  metric.status?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                    metric.status?.toLowerCase() === 'normal'   ? 'bg-green-500' :
                    metric.status?.toLowerCase() === 'warning'  ? 'bg-yellow-500' :
                    metric.status?.toLowerCase() === 'critical' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`} />
                  {metric.status || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        PLACEHOLDER_METRICS.map((item, index) => (
          <Card
            key={index}
            className="border border-slate-100 bg-slate-50/50 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="h-1 w-full bg-slate-200" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-2xl font-black text-slate-300">
                    — —
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    Not recorded yet
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 ml-3">
                  <item.icon className="w-5 h-5 text-slate-300" />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/40">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full inline-block bg-slate-300" />
                  No Data
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}