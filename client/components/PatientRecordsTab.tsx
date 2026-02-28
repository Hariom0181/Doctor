import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FileText, Upload, Download, Loader2, AlertCircle,
  ChevronUp, ChevronDown, Eye, Trash2, Stethoscope,
  FolderOpen, Calendar, Hospital, ClipboardList, X
} from "lucide-react";
import { PatientMedicalRecord } from "@/services/patientApi";

interface DocumentForm {
  documentType: string;
  documentDate: string;
  hospitalName: string;
  notes: string;
}

interface PatientDocument {
  id: number;
  document_type: string;
  document_name: string;
  document_date: string;
  hospital_name?: string;
  notes?: string;
  uploaded_at: string;
}

interface PatientRecordsTabProps {
  medicalRecords: PatientMedicalRecord[];
  isLoadingMedicalRecords: boolean;
  medicalRecordsError: string | null;
  showAllDoctorRecords: boolean;
  setShowAllDoctorRecords: (val: boolean) => void;
  fetchMedicalRecords: () => void;
  patientDocuments: PatientDocument[];
  isLoadingDocuments: boolean;
  documentForm: DocumentForm;
  setDocumentForm: (form: DocumentForm) => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentUpload: (e: React.FormEvent) => void;
  uploadingDocument: boolean;
  handleDeleteDocument: (id: number, name: string) => void;
  formatExaminationType: (type: string) => string;
  getRecordStatus: (record: PatientMedicalRecord) => string;
  formatDocumentType: (type: string) => string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "normal":           return "bg-green-100 text-green-700 border-green-200";
    case "attention needed": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "warning":          return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "critical":         return "bg-red-100 text-red-700 border-red-200";
    default:                 return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export function PatientRecordsTab({
  medicalRecords,
  isLoadingMedicalRecords,
  medicalRecordsError,
  showAllDoctorRecords,
  setShowAllDoctorRecords,
  fetchMedicalRecords,
  patientDocuments,
  isLoadingDocuments,
  documentForm,
  setDocumentForm,
  selectedFile,
  handleFileSelect,
  handleDocumentUpload,
  uploadingDocument,
  handleDeleteDocument,
  formatExaminationType,
  getRecordStatus,
  formatDocumentType,
}: PatientRecordsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-blue-400/30 to-transparent" />

        {/* Header */}
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  Complete Medical Records
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  All your medical history and test results
                </CardDescription>
              </div>
            </div>

            {/* Upload Dialog Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all h-9 px-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0">
                {/* Dialog Header */}
                <div className="relative bg-gradient-to-br from-primary via-blue-600 to-blue-700 p-8 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <DialogHeader className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-3 w-fit">
                      <Upload className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white/90 tracking-wider uppercase">Patient Portal</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-white">Upload Medical Documents</DialogTitle>
                    <DialogDescription className="text-blue-100/90 text-sm mt-1 font-medium">
                      Upload lab reports, prescriptions, or other documents from healthcare providers
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Dialog Form */}
                <form className="p-8 space-y-6 bg-white">
                  {/* Document Info */}
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Document Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                          Document Type <span className="text-red-400">*</span>
                        </Label>
                        <Select>
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700">
                            <SelectValue placeholder="Choose document type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="lab-report">🧪 Lab Report</SelectItem>
                            <SelectItem value="prescription">💊 Prescription</SelectItem>
                            <SelectItem value="xray">📷 X-Ray/Scan</SelectItem>
                            <SelectItem value="discharge">📋 Discharge Summary</SelectItem>
                            <SelectItem value="vaccination">💉 Vaccination Record</SelectItem>
                            <SelectItem value="other">📄 Other Medical Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                          Date of Test/Visit <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="date"
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Hospital / Lab / Clinic Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        placeholder="Enter the name of the healthcare facility"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  {/* File Upload Zone */}
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload File</p>
                    <div className="border-2 border-dashed border-primary/25 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/2 transition-all duration-200 bg-primary/3 group cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          <Upload className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">Drop files here or click to browse</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, JPG, JPEG, PNG · Max 10MB per file</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">
                          Choose Files
                        </Button>
                        <Input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Notes <span className="text-slate-300 normal-case font-medium">(Optional)</span>
                    </Label>
                    <Textarea
                      placeholder="Add any relevant notes about this document..."
                      className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-700 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 py-4 h-auto rounded-2xl font-bold text-sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                    <Button type="button" variant="outline" className="px-6 rounded-2xl font-bold border-slate-200 text-slate-500">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 space-y-10">

          {/* ── SECTION 1: Doctor Records ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">Doctor Records</h3>
              {medicalRecords.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">
                  {medicalRecords.length} records
                </span>
              )}
            </div>

            {/* Loading */}
            {isLoadingMedicalRecords && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-5 bg-slate-50">
                    <div className="flex gap-3 mb-3">
                      <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
                      <div className="h-5 bg-slate-200 rounded-lg w-16" />
                      <div className="h-5 bg-slate-200 rounded-lg w-20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded-lg w-full" />
                        <div className="h-3 bg-slate-200 rounded-lg w-3/4" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded-lg w-full" />
                        <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                      </div>
                    </div>
                    <div className="h-16 bg-slate-200 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!isLoadingMedicalRecords && medicalRecordsError && (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="font-bold text-slate-800 mb-1">Error Loading Records</p>
                <p className="text-sm text-slate-500 mb-4">{medicalRecordsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold border-slate-200"
                  onClick={fetchMedicalRecords}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty */}
            {!isLoadingMedicalRecords && !medicalRecordsError && medicalRecords.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-bold text-slate-600">No medical records found</p>
                <p className="text-xs text-slate-400 mt-1">Your records will appear here when doctors add them.</p>
              </div>
            )}

            {/* Records List */}
            {!isLoadingMedicalRecords && !medicalRecordsError && medicalRecords.length > 0 && (
              <div className="space-y-4">
                <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1">
                  {(showAllDoctorRecords ? medicalRecords : medicalRecords.slice(0, 3)).map((record) => (
                    <div
                      key={record.id}
                      className="group border border-slate-200/80 rounded-2xl p-5 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Record Header */}
                      <div className="flex items-start gap-3 mb-4 flex-wrap">
                        <h4 className="font-black text-slate-800 text-base">
                          {formatExaminationType(record.examinationType)}
                        </h4>
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(getRecordStatus(record))}`}>
                          {getRecordStatus(record)}
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                          Doctor Added
                        </span>
                      </div>

                      {/* Record Meta Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Doctor: </span>
                            {record.doctorName || `Dr. ${record.doctorId}`}
                          </p>
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Specialization: </span>
                            {record.doctorSpecialization || 'General Medicine'}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Date: </span>
                            {new Date(record.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                          {record.nextCheckupDate && (
                            <p className="text-xs text-primary font-bold">
                              Next Checkup: {new Date(record.nextCheckupDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Diagnosis Box */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 space-y-2">
                        <p className="text-xs text-slate-700">
                          <span className="font-bold">Diagnosis: </span>{record.diagnosis}
                        </p>
                        {record.prescription && (
                          <p className="text-xs text-slate-600">
                            <span className="font-bold">Prescription: </span>{record.prescription}
                          </p>
                        )}
                        {record.additionalNotes && (
                          <p className="text-xs text-slate-500 italic">
                            <span className="font-bold not-italic">Notes: </span>{record.additionalNotes}
                          </p>
                        )}
                      </div>

                      {/* Download */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-9"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Medical Report
                      </Button>
                    </div>
                  ))}
                </div>

                {medicalRecords.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowAllDoctorRecords(!showAllDoctorRecords)}
                    >
                      {showAllDoctorRecords ? (
                        <><ChevronUp className="w-4 h-4 mr-2" />Show Less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-2" />View All {medicalRecords.length} Records</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION 2: My Health Documents ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">My Health Documents</h3>
              {patientDocuments.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
                  {patientDocuments.length} uploaded
                </span>
              )}
            </div>

            {/* Upload Form Card */}
            <Card className="rounded-2xl border border-blue-100 bg-blue-50/30 shadow-none overflow-hidden">
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-400/50 to-transparent" />
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-black text-slate-800">Upload Your Medical Document</CardTitle>
                <CardDescription className="text-xs">
                  Upload lab reports, X-rays, prescriptions, or other medical documents
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <form onSubmit={handleDocumentUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Document Type <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={documentForm.documentType}
                        onValueChange={(value) => setDocumentForm({ ...documentForm, documentType: value })}
                        required
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-700">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="lab_report">🧪 Lab Report</SelectItem>
                          <SelectItem value="xray">📷 X-Ray/Scan</SelectItem>
                          <SelectItem value="prescription">💊 Prescription</SelectItem>
                          <SelectItem value="discharge_summary">📋 Discharge Summary</SelectItem>
                          <SelectItem value="vaccination">💉 Vaccination Record</SelectItem>
                          <SelectItem value="other">📄 Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Document Date <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        type="date"
                        className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-700"
                        value={documentForm.documentDate}
                        onChange={(e) => setDocumentForm({ ...documentForm, documentDate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Hospital / Clinic <span className="text-slate-300 normal-case font-medium">(Optional)</span>
                    </Label>
                    <Input
                      placeholder="Enter hospital or clinic name"
                      className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-700"
                      value={documentForm.hospitalName}
                      onChange={(e) => setDocumentForm({ ...documentForm, hospitalName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Upload File <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="document-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                        onChange={handleFileSelect}
                        required
                        className="flex-1 h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-600"
                      />
                      {selectedFile && (
                        <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-lg whitespace-nowrap max-w-[120px] truncate">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">PDF, JPG, PNG, GIF · Max 10MB</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Notes <span className="text-slate-300 normal-case font-medium">(Optional)</span>
                    </Label>
                    <Textarea
                      placeholder="Add any relevant notes..."
                      className="rounded-xl border-slate-200 bg-white font-medium text-slate-700 resize-none"
                      rows={3}
                      value={documentForm.notes}
                      onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-2xl font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all"
                    disabled={uploadingDocument}
                  >
                    {uploadingDocument ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload Document</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Uploaded Documents List */}
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Your Uploaded Documents
                <span className="ml-2 normal-case font-bold text-slate-400">({patientDocuments.length})</span>
              </p>

              {isLoadingDocuments ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                        <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                        <div className="h-3 bg-slate-200 rounded-lg w-1/4" />
                      </div>
                      <div className="flex gap-2 ml-4">
                        <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                        <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : patientDocuments.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 text-sm">No documents uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-1">Upload your first medical document above</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {patientDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group border border-slate-200/80 rounded-2xl p-4 bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400/60 to-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="font-black text-slate-800 text-sm">
                                {formatDocumentType(doc.document_type)}
                              </h4>
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-100">
                                Self-Uploaded
                              </span>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-slate-600 font-medium truncate">
                                📄 {doc.document_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                📅 {new Date(doc.document_date).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </p>
                              {doc.hospital_name && (
                                <p className="text-xs text-slate-500">
                                  🏥 {doc.hospital_name}
                                </p>
                              )}
                              {doc.notes && (
                                <p className="text-xs text-slate-400 italic line-clamp-1 mt-1">
                                  {doc.notes}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-300 font-medium pt-1">
                                Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs px-3"
                            onClick={() => {
                              const backendUrl = "http://localhost:5000";
                              window.open(`${backendUrl}/api/documents/view/${doc.id}`, "_blank");
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-red-100 font-bold text-red-500 hover:bg-red-50 hover:border-red-200 text-xs px-3"
                            onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}