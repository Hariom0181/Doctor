import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityLog {
    id: number;
    type: "medication" | "note";
    nurse_id: number;
    patient_id: number;
    created_at: string;
    nurse_name?: string;
    patient_name?: string;
    medication_name?: string;
    dosage?: string;
    given_at?: string;
    notes?: string;
    observation?: string;
    observation_type?: string;
    severity?: "normal" | "warning" | "critical";
}

interface NurseActivityLogsProps {
    patientId?: number;
    nurseId?: number;
}

const ITEMS_PER_PAGE = 2; // ✅ Show only 2 items per page

export default function NurseActivityLogs({
    patientId,
    nurseId,
}: NurseActivityLogsProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "medications" | "notes">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<"all" | "normal" | "warning" | "critical">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadActivityLogs();
    }, [patientId, nurseId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, severityFilter]);

    const loadActivityLogs = async () => {
        try {
            setLoading(true);
            setError("");

            // ✅ Use working endpoint
            const response = await fetch(
                `http://localhost:5000/api/nurses/activity-log`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLogs(data.data || []);
        } catch (err) {
            console.error("Error loading activity logs:", err);
            setError(err instanceof Error ? err.message : "Failed to load activity logs");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (activeTab === "medications" && log.type !== "medication") return false;
        if (activeTab === "notes" && log.type !== "note") return false;

        if (severityFilter !== "all" && log.severity && log.severity !== severityFilter) {
            return false;
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                log.patient_name?.toLowerCase().includes(query) ||
                log.nurse_name?.toLowerCase().includes(query) ||
                log.medication_name?.toLowerCase().includes(query) ||
                log.observation?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getSeverityBadgeVariant = (severity: string) => {
        switch (severity) {
            case "critical":
                return "destructive";
            case "warning":
                return "secondary";
            default:
                return "outline";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const medicationCount = logs.filter((l) => l.type === "medication").length;
    const noteCount = logs.filter((l) => l.type === "note").length;
    const criticalCount = logs.filter((l) => l.severity === "critical").length;

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                        <span className="text-sm text-gray-600">Loading activity logs...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>📊 Nurse Activity Logs</CardTitle>
                    <CardDescription>
                        Medication logs and observation notes from assigned nurses
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
                            <p className="text-xl font-bold text-blue-600">{logs.length}</p>
                            <p className="text-xs text-gray-600">Total</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 rounded-lg text-center">
                            <p className="text-xl font-bold text-cyan-600">{medicationCount}</p>
                            <p className="text-xs text-gray-600">💊 Meds</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center">
                            <p className="text-xl font-bold text-purple-600">{noteCount}</p>
                            <p className="text-xs text-gray-600">📝 Notes</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg text-center">
                            <p className="text-xl font-bold text-red-600">{criticalCount}</p>
                            <p className="text-xs text-gray-600">🚨 Critical</p>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    {/* Search and Filters - Organized Layout */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        {/* Search Input */}
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search patient, nurse, medication..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 text-sm"
                                />
                            </div>
                        </div>

                        {/* Activity Type Tabs */}
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-2">Activity Type</label>
                            <Tabs
                                value={activeTab}
                                onValueChange={(value) => setActiveTab(value as any)}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="medications">💊 Medication</TabsTrigger>
                                    <TabsTrigger value="notes">📝 Notes</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Severity Filter */}
                        {activeTab !== "medications" && (
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-2">Severity</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Button
                                        variant={severityFilter === "all" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSeverityFilter("all")}
                                        className="text-xs h-8"
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={severityFilter === "normal" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSeverityFilter("normal")}
                                        className="text-xs h-8"
                                    >
                                        🟢 Normal
                                    </Button>
                                    <Button
                                        variant={severityFilter === "warning" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSeverityFilter("warning")}
                                        className="text-xs h-8"
                                    >
                                        🟡 Warning
                                    </Button>
                                    <Button
                                        variant={severityFilter === "critical" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSeverityFilter("critical")}
                                        className="text-xs h-8"
                                    >
                                        🔴 Critical
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs List */}
                    <div className="space-y-2">
                        {paginatedLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No activities found</p>
                            </div>
                        ) : (
                            paginatedLogs.map((log) => (
                                <div
                                    key={`${log.type}-${log.id}`}
                                    className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition ${log.type === "medication"
                                            ? "border-l-4 border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                                            : "border-l-4 border-l-purple-500 bg-purple-50 hover:bg-purple-100"
                                        }`}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setShowDetailsModal(true);
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg">
                                                    {log.type === "medication" ? "💊" : "📝"}
                                                </span>
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {log.type === "medication"
                                                        ? `${log.medication_name} (${log.dosage})`
                                                        : log.observation_type?.replace("_", " ").toUpperCase()}
                                                </p>
                                                {log.severity && (
                                                    <Badge variant={getSeverityBadgeVariant(log.severity)} className="text-xs">
                                                        {log.severity.toUpperCase()}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {log.patient_name} • {log.nurse_name}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-xs text-gray-600">
                                Page {currentPage} of {totalPages} ({filteredLogs.length} items)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedLog?.type === "medication" ? "💊 Medication Log" : "📝 Observation Note"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog?.patient_name} • {selectedLog?.nurse_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Patient</p>
                                    <p className="text-sm font-semibold">{selectedLog.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Nurse</p>
                                    <p className="text-sm font-semibold">{selectedLog.nurse_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Date & Time</p>
                                    <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Record ID</p>
                                    <p className="text-sm">{selectedLog.id}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                {selectedLog.type === "medication" ? (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Medication</p>
                                            <p className="text-sm font-semibold">{selectedLog.medication_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Dosage</p>
                                            <p className="text-sm">{selectedLog.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Given At</p>
                                            <p className="text-sm">
                                                {selectedLog.given_at ? formatDate(selectedLog.given_at) : "Not recorded"}
                                            </p>
                                        </div>
                                        {selectedLog.notes && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Notes</p>
                                                <p className="text-sm bg-gray-50 p-2 rounded">{selectedLog.notes}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Observation Type</p>
                                            <p className="text-sm font-semibold">
                                                {selectedLog.observation_type?.replace("_", " ").toUpperCase()}
                                            </p>
                                        </div>
                                        {selectedLog.severity && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Severity</p>
                                                <Badge variant={getSeverityBadgeVariant(selectedLog.severity)}>
                                                    {selectedLog.severity.toUpperCase()}
                                                </Badge>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Observation</p>
                                            <p className="text-sm bg-gray-50 p-3 rounded leading-relaxed">
                                                {selectedLog.observation}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}