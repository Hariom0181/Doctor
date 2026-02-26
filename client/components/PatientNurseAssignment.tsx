import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { doctorApiService } from "@/services/doctorApi";

interface Nurse {
  id: number;
  first_name: string;
  last_name: string;
  qualification: string;
  current_hospital: string;
}

interface PatientNurseAssignmentProps {
  patientId: number;
  patientName: string;
  onAssignmentSuccess?: () => void;
}

export default function PatientNurseAssignment({
  patientId,
  patientName,
  onAssignmentSuccess,
}: PatientNurseAssignmentProps) {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadNurses();
  }, []);

  const loadNurses = async () => {
    try {
      setLoading(true);
      setError("");
      const nurseList = await doctorApiService.getNursesList();
      setNurses(nurseList);
    } catch (err) {
      console.error("Error loading nurses:", err);
      setError("Failed to load nurses list");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedNurseId) {
      setError("Please select a nurse");
      return;
    }

    setAssigning(true);
    setError("");
    setSuccess("");

    try {
      const result = await doctorApiService.assignNurseToPatient(
        patientId,
        parseInt(selectedNurseId),
        notes || undefined
      );

      if (result) {
        setSuccess(`Nurse assigned to ${patientName} successfully!`);
        setSelectedNurseId("");
        setNotes("");

        // Call callback after 2 seconds
        setTimeout(() => {
          onAssignmentSuccess?.();
        }, 2000);
      } else {
        setError("Failed to assign nurse");
      }
    } catch (err) {
      console.error("Error assigning nurse:", err);
      setError(err instanceof Error ? err.message : "Failed to assign nurse");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-600">Loading nurses...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          👩‍⚕️ Assign Nurse to Patient
        </CardTitle>
        <CardDescription>
          Assign a qualified nurse to monitor {patientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Nurse Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Nurse *</label>
          {nurses.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                No approved nurses available. Please check back later.
              </p>
            </div>
          ) : (
            <Select value={selectedNurseId} onValueChange={setSelectedNurseId} disabled={assigning}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a nurse..." />
              </SelectTrigger>
              <SelectContent>
                {nurses.map((nurse) => (
                  <SelectItem key={nurse.id} value={nurse.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {nurse.first_name} {nurse.last_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({nurse.qualification})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Selected Nurse Details */}
        {selectedNurseId && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {nurses
              .filter((n) => n.id.toString() === selectedNurseId)
              .map((nurse) => (
                <div key={nurse.id} className="space-y-2">
                  <p className="font-medium text-blue-900">
                    {nurse.first_name} {nurse.last_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Qualification:</strong> {nurse.qualification}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Hospital:</strong> {nurse.current_hospital}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Assignment Notes (Optional)</label>
          <Textarea
            placeholder="Add any special instructions or notes for the nurse..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={assigning}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            e.g., "Monitor vitals every 4 hours", "Check blood pressure regularly"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleAssign}
            disabled={!selectedNurseId || assigning}
            className="flex-1"
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Nurse"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedNurseId("");
              setNotes("");
              setError("");
              setSuccess("");
            }}
            disabled={assigning}
          >
            Clear
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Once assigned, the nurse will be able to view this patient,
            log medications, and add observations from the mobile app.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}