import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Download, Plus, Save } from "lucide-react";

// Sample data - would come from props/context in real app
const recentRecords = [
  {
    id: "1",
    date: "2024-01-15",
    type: "General Checkup",
    doctor: "Dr. Priya Sharma",
    hospital: "Primary Health Center",
    diagnosis: "Blood pressure slightly elevated, cholesterol normal",
    status: "Attention Needed",
    nextCheckup: "2024-04-15",
    documents: ["Blood Report", "ECG Report"]
  },
  {
    id: "2",
    date: "2024-01-10", 
    type: "Blood Test",
    doctor: "Dr. Amit Verma",
    hospital: "District Hospital",
    diagnosis: "All parameters within normal range",
    status: "Normal",
    documents: ["Complete Blood Count", "Lipid Profile"]
  }
];

interface RecordsTabProps {
  getStatusColor: (status: string) => string;
}

export default function RecordsTab({ getStatusColor }: RecordsTabProps) {
  const [uploadForm, setUploadForm] = useState({
    documentType: "",
    date: "",
    hospitalName: "",
    notes: ""
  });

  const [healthForm, setHealthForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    bloodSugar: "",
    weight: "",
    heartRate: "",
    temperature: "",
    symptoms: "",
    location: ""
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Complete Medical Records</CardTitle>
              <CardDescription>All your medical history and test results</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Upload Documents Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-3 pb-6">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                      Upload Medical Documents
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Upload lab reports, prescriptions, or other medical documents you've received from healthcare providers
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form className="space-y-8">
                    {/* Document Information Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          📋 Document Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Provide details about the medical document you're uploading
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="doc-type" className="text-sm font-medium text-gray-700">
                            Document Type <span className="text-red-500">*</span>
                          </Label>
                          <Select value={uploadForm.documentType} onValueChange={(value) => setUploadForm({...uploadForm, documentType: value})}>
                            <SelectTrigger id="doc-type" className="w-full h-11">
                              <SelectValue placeholder="Choose document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lab-report">🧪 Lab Report</SelectItem>
                              <SelectItem value="prescription">💊 Prescription</SelectItem>
                              <SelectItem value="xray">📷 X-Ray/Scan</SelectItem>
                              <SelectItem value="discharge">📋 Discharge Summary</SelectItem>
                              <SelectItem value="vaccination">💉 Vaccination Record</SelectItem>
                              <SelectItem value="other">📄 Other Medical Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="doc-date" className="text-sm font-medium text-gray-700">
                            Date of Test/Visit <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            id="doc-date"
                            type="date" 
                            className="w-full h-11"
                            max={new Date().toISOString().split('T')[0]}
                            value={uploadForm.date}
                            onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="hospital-name" className="text-sm font-medium text-gray-700">
                          Hospital/Lab/Clinic Name <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="hospital-name"
                          placeholder="Enter the name of the healthcare facility"
                          className="w-full h-11"
                          value={uploadForm.hospitalName}
                          onChange={(e) => setUploadForm({...uploadForm, hospitalName: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          📎 Upload Files
                        </h3>
                        <p className="text-sm text-gray-600">
                          Select the documents you want to upload
                        </p>
                      </div>
                      
                      <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/50 transition-all duration-200 bg-primary/5">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900">
                              Drop files here or click to browse
                            </p>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                              Supported formats: PDF, JPG, JPEG, PNG • Maximum size: 10MB per file
                            </p>
                          </div>
                          <Button type="button" variant="outline" className="mt-4">
                            Choose Files
                          </Button>
                          <Input 
                            type="file" 
                            className="hidden" 
                            multiple 
                            accept=".pdf,.jpg,.jpeg,.png"
                            aria-label="Upload medical documents"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          📝 Additional Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Add any relevant notes or context (optional)
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="doc-notes" className="text-sm font-medium text-gray-700">
                          Notes
                        </Label>
                        <Textarea 
                          id="doc-notes"
                          placeholder="Add any relevant notes about this document, symptoms experienced, or additional context that might help your doctor..."
                          className="min-h-[120px] resize-none"
                          value={uploadForm.notes}
                          onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Submit Section */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <Button type="submit" className="flex-1 h-11">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 h-11">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Add Health Data Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Health Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-3 pb-6">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                      Add Health Measurements
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Record your own health measurements taken at home or other healthcare facilities
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form className="space-y-8">
                    {/* Date & Time Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          🗓️ When & Where
                        </h3>
                        <p className="text-sm text-gray-600">
                          Specify when and where these measurements were taken
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="measurement-date" className="text-sm font-medium text-gray-700">
                            Date <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            id="measurement-date"
                            type="date" 
                            className="w-full h-11"
                            value={healthForm.date}
                            onChange={(e) => setHealthForm({...healthForm, date: e.target.value})}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="measurement-time" className="text-sm font-medium text-gray-700">
                            Time
                          </Label>
                          <Input 
                            id="measurement-time"
                            type="time" 
                            className="w-full h-11"
                            value={healthForm.time}
                            onChange={(e) => setHealthForm({...healthForm, time: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="measurement-location" className="text-sm font-medium text-gray-700">
                            Measured At
                          </Label>
                          <Select value={healthForm.location} onValueChange={(value) => setHealthForm({...healthForm, location: value})}>
                            <SelectTrigger id="measurement-location" className="w-full h-11">
                              <SelectValue placeholder="Where was this measured?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="home">🏠 At Home</SelectItem>
                              <SelectItem value="pharmacy">💊 Pharmacy</SelectItem>
                              <SelectItem value="clinic">🏥 Local Clinic</SelectItem>
                              <SelectItem value="hospital">🏨 Hospital</SelectItem>
                              <SelectItem value="other">📍 Other Location</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Vital Signs Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          💓 Vital Signs
                        </h3>
                        <p className="text-sm text-gray-600">
                          Enter the measurements you've taken (fill in only what you have)
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Blood Pressure</Label>
                            <div className="flex items-center space-x-3">
                              <Input 
                                placeholder="120"
                                type="number"
                                className="flex-1 h-11"
                                value={healthForm.bloodPressureSystolic}
                                onChange={(e) => setHealthForm({...healthForm, bloodPressureSystolic: e.target.value})}
                              />
                              <span className="text-gray-500">/</span>
                              <Input 
                                placeholder="80"
                                type="number"
                                className="flex-1 h-11"
                                value={healthForm.bloodPressureDiastolic}
                                onChange={(e) => setHealthForm({...healthForm, bloodPressureDiastolic: e.target.value})}
                              />
                              <span className="text-sm text-gray-500 min-w-[60px]">mmHg</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="blood-sugar" className="text-sm font-medium text-gray-700">
                              Blood Sugar
                            </Label>
                            <div className="flex items-center space-x-3">
                              <Input 
                                id="blood-sugar"
                                placeholder="95"
                                type="number"
                                className="flex-1 h-11"
                                value={healthForm.bloodSugar}
                                onChange={(e) => setHealthForm({...healthForm, bloodSugar: e.target.value})}
                              />
                              <span className="text-sm text-gray-500 min-w-[60px]">mg/dL</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                              Weight
                            </Label>
                            <div className="flex items-center space-x-3">
                              <Input 
                                id="weight"
                                placeholder="70"
                                type="number"
                                step="0.1"
                                className="flex-1 h-11"
                                value={healthForm.weight}
                                onChange={(e) => setHealthForm({...healthForm, weight: e.target.value})}
                              />
                              <span className="text-sm text-gray-500 min-w-[60px]">kg</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="heart-rate" className="text-sm font-medium text-gray-700">
                              Heart Rate
                            </Label>
                            <div className="flex items-center space-x-3">
                              <Input 
                                id="heart-rate"
                                placeholder="72"
                                type="number"
                                className="flex-1 h-11"
                                value={healthForm.heartRate}
                                onChange={(e) => setHealthForm({...healthForm, heartRate: e.target.value})}
                              />
                              <span className="text-sm text-gray-500 min-w-[60px]">bpm</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="temperature" className="text-sm font-medium text-gray-700">
                              Temperature
                            </Label>
                            <div className="flex items-center space-x-3">
                              <Input 
                                id="temperature"
                                placeholder="98.6"
                                type="number"
                                step="0.1"
                                className="flex-1 h-11"
                                value={healthForm.temperature}
                                onChange={(e) => setHealthForm({...healthForm, temperature: e.target.value})}
                              />
                              <span className="text-sm text-gray-500 min-w-[60px]">°F</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Symptoms & Notes Section */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          📝 Symptoms & Notes
                        </h3>
                        <p className="text-sm text-gray-600">
                          Describe how you're feeling and any symptoms
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="symptoms" className="text-sm font-medium text-gray-700">
                          Symptoms/Notes
                        </Label>
                        <Textarea 
                          id="symptoms"
                          placeholder="Describe any symptoms you're experiencing, how you're feeling, or any relevant notes about your health..."
                          className="min-h-[120px] resize-none"
                          value={healthForm.symptoms}
                          onChange={(e) => setHealthForm({...healthForm, symptoms: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Submit Section */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <Button type="submit" className="flex-1 h-11">
                        <Save className="w-4 h-4 mr-2" />
                        Save Health Data
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 h-11">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Doctor Records Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                👨‍⚕️ Doctor Records
              </h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {recentRecords.length} records
              </Badge>
            </div>
            
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="font-semibold text-lg text-gray-900">{record.type}</h4>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Doctor Added
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="space-y-1">
                          <p><span className="font-medium">Doctor:</span> {record.doctor}</p>
                          <p><span className="font-medium">Hospital:</span> {record.hospital}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="font-medium">Date:</span> {new Date(record.date).toLocaleDateString()}</p>
                          {record.nextCheckup && (
                            <p><span className="font-medium">Next Checkup:</span> {new Date(record.nextCheckup).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">Diagnosis:</span> {record.diagnosis}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {record.documents.map((doc, index) => (
                          <Button key={index} variant="outline" size="sm" className="h-8">
                            <Download className="w-3 h-3 mr-1" />
                            {doc}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Uploaded Records Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                📤 My Uploaded Documents & Health Data
              </h3>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                2 entries
              </Badge>
            </div>
            
            <div className="space-y-4">
              {/* Sample patient-uploaded content */}
              <div className="border border-green-200 rounded-lg p-6 bg-green-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-semibold text-lg text-gray-900">Blood Sugar Self-Monitoring</h4>
                      <Badge className="bg-green-100 text-green-800">Self-Reported</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="space-y-1">
                        <p><span className="font-medium">Date:</span> January 18, 2024</p>
                        <p><span className="font-medium">Time:</span> 8:00 AM</p>
                      </div>
                      <div className="space-y-1">
                        <p><span className="font-medium">Measured At:</span> Home</p>
                        <p><span className="font-medium">Blood Sugar:</span> 105 mg/dL</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm">
                        <span className="font-medium text-gray-900">Notes:</span> Fasting blood sugar measured with home glucometer. Feeling normal today, no symptoms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-semibold text-lg text-gray-900">Lab Report - District Hospital</h4>
                      <Badge className="bg-blue-100 text-blue-800">Document Uploaded</Badge>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending Review
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="space-y-1">
                        <p><span className="font-medium">Date:</span> January 16, 2024</p>
                        <p><span className="font-medium">Hospital:</span> District Hospital Meerut</p>
                      </div>
                      <div className="space-y-1">
                        <p><span className="font-medium">Test Type:</span> Complete Blood Count</p>
                        <p><span className="font-medium">Status:</span> Pending Doctor Review</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-sm">
                        <span className="font-medium text-gray-900">Notes:</span> Got these tests done during emergency visit. All values appear normal based on reference ranges.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-8">
                        <Download className="w-3 h-3 mr-1" />
                        CBC_Report.pdf
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        <Download className="w-3 h-3 mr-1" />
                        Receipt.jpg
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State for New Users */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your Health Information</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload lab reports, track vital signs, or add health notes for your doctor to review and get a complete picture of your health.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </DialogTrigger>
                {/* Same dialog content as above */}
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Health Data
                  </Button>
                </DialogTrigger>
                {/* Same dialog content as above */}
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
