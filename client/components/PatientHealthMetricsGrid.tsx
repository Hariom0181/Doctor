import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Heart,
  Thermometer,
  Weight,
  HeartPulse,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

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

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":
      return { bg: "#EDFBF7", text: "#0B6B50", dot: "#0B8A6C" };
    case "warning":
      return { bg: "#FFF7E6", text: "#AD6800", dot: "#FAAD14" };
    case "critical":
      return { bg: "#FFF1F0", text: "#CF1322", dot: "#FF4D4F" };
    default:
      return { bg: "#F2F4F7", text: "#5A6478", dot: "#B0BAC9" };
  }
};

const getMetricIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("blood pressure")) return Heart;
  if (l.includes("temp")) return Thermometer;
  if (l.includes("weight")) return Weight;
  if (l.includes("heart") || l.includes("pulse")) return HeartPulse;
  return Activity;
};

export function PatientHealthMetricsGrid({
  healthMetrics,
}: PatientHealthMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {healthMetrics.map((metric, index) => {
        const status = getStatusStyles(metric.status);
        const Icon = getMetricIcon(metric.label);

        return (
          <Card
            key={metric.id || index}
            className="rounded-xl border border-[#E2E6EE] shadow-sm hover:shadow-md transition-all"
          >
            {/* Slim Accent */}
            <div
              style={{
                height: "3px",
                background: "#0B4F6C",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            />

            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#F2F4F7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} color="#0B4F6C" />
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#5A6478",
                    }}
                  >
                    {metric.label}
                  </span>
                </div>

                <Badge
                  style={{
                    background: status.bg,
                    color: status.text,
                    border: "none",
                    fontSize: "0.65rem",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontWeight: 600,
                  }}
                >
                  {metric.status}
                </Badge>
              </div>

              {/* Value */}
              <div className="flex items-end justify-between">
                <div>
                  <h3
                    style={{
                      fontFamily: "DM Serif Display, serif",
                      fontSize: "1.4rem",
                      color: "#0D1621",
                      lineHeight: 1.1,
                    }}
                  >
                    {metric.value}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                      color: "#8C96A8",
                      fontSize: "0.65rem",
                    }}
                  >
                    <Clock size={12} />
                    {new Date(metric.lastChecked).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: status.dot,
                  }}
                />
              </div>

              {/* Optional Notes */}
              {metric.notes && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#8C96A8",
                    borderTop: "1px solid #EDF0F5",
                    paddingTop: "6px",
                  }}
                >
                  {metric.notes}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 