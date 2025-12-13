import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, FileText, TrendingUp, Calendar, Phone, Mail, MapPin, Plus, Search, Download, AlertCircle } from "lucide-react";
import { dashboardApi } from "@/services/dashboardApi";

interface HealthRecord {
  id: string;
  examination_type: string;
  diagnosis: string;
  prescription: string;
  next_checkup_date: string;
  created_at: string;
  doctor_name: string;
  specialization: string;
}

interface PatientData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
}

interface DashboardStats {
  totalPatients: number;
  totalRecords: number;
  totalDoctors: number;
  moneySaved: number;
  avoidedCheckups: number;
}

interface Activity {
  id: number;
  type: string;
  patientName: string;
  doctorName: string;
  timestamp: string;
}

interface DiagnosisAnalytic {
  examination_type: string;
  count: number;
  percentage: number;
}

export default function Index() {
  // Search and patient data
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientRecords, setPatientRecords] = useState<HealthRecord[]>([]);
  const [searchResults, setSearchResults] = useState<PatientData[]>([]);
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalRecords: 0,
    totalDoctors: 0,
    moneySaved: 0,
    avoidedCheckups: 0
  });
  
  // Activities and analytics
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [diagnosisAnalytics, setDiagnosisAnalytics] = useState<DiagnosisAnalytic[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard stats on mount
  useEffect(() => {
    loadDashboardStats();
    loadRecentActivities();
    loadDiagnosisAnalytics();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const response = await dashboardApi.getRecentActivities();
      if (response.success) {
        setRecentActivities(response.data);
      }
    } catch (err) {
      console.error("Error loading recent activities:", err);
    }
  };

  const loadDiagnosisAnalytics = async () => {
    try {
      const response = await dashboardApi.getDiagnosisAnalytics();
      if (response.success) {
        setDiagnosisAnalytics(response.data);
      }
    } catch (err) {
      console.error("Error loading diagnosis analytics:", err);
    }
  };

  // Sample data for demonstration
  // const samplePatient: PatientData = {
  //   name: "Rajesh Kumar",
  //   age: 45,
  //   id: "HMS2024001",
  //   contact: "+91 98765 43210",
  //   recentRecords: [
  //     {
  //       id: "1",
  //       date: "2024-01-15",
  //       type: "General Checkup",
  //       doctor: "Dr. Priya Sharma",
  //       diagnosis: "Blood pressure slightly elevated, cholesterol normal",
  //       status: "Attention Needed",
  //       nextCheckup: "2024-04-15"
  //     },
  //     {
  //       id: "2", 
  //       date: "2024-01-10",
  //       type: "Blood Test",
  //       doctor: "Dr. Amit Verma",
  //       diagnosis: "All parameters within normal range",
  //       status: "Normal"
  //     },
  //     {
  //       id: "3",
  //       date: "2024-01-05",
  //       type: "Heart Screening",
  //       doctor: "Dr. Sunita Patel",
  //       diagnosis: "Mild irregularity detected, follow-up recommended",
  //       status: "Attention Needed",
  //       nextCheckup: "2024-03-05"
  //     }
  //   ]
  // };
  // Handle patient search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.searchPatients(searchQuery);
      if (response.success) {
        setSearchResults(response.data);
        
        // If only one result, automatically select it
        if (response.data.length === 1) {
          handleSelectPatient(response.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error searching patients:", err);
      setError("Failed to search patients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle patient selection
  const handleSelectPatient = async (patientId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.getPatientDetails(patientId.toString());
      if (response.success) {
        setSelectedPatient(response.data.patient);
        setPatientRecords(response.data.records);
        setSearchResults([]); // Clear search results
      }
    } catch (err) {
      console.error("Error loading patient details:", err);
      setError("Failed to load patient details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (diagnosis: string) => {
    const lowerDiagnosis = diagnosis.toLowerCase();
    if (lowerDiagnosis.includes("critical") || lowerDiagnosis.includes("severe")) {
      return "bg-destructive text-destructive-foreground";
    } else if (lowerDiagnosis.includes("attention") || lowerDiagnosis.includes("elevated")) {
      return "bg-warning text-warning-foreground";
    } else {
      return "bg-success text-success-foreground";
    }
  };

  // Helper function to format time ago
  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HealthTrack</h1>
                <p className="text-sm text-gray-600">Automatic Health Monitoring</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-primary font-medium">Dashboard</a>
              <a href="#" className="text-gray-700 hover:text-primary font-medium">Patients</a>
              <a href="#" className="text-gray-700 hover:text-primary font-medium">Reports</a>
              <div className="flex items-center space-x-3 ml-6 border-l pl-6">
                <Link to="/patient/login">
                  <Button variant="outline" size="sm">
                    Patient Login
                  </Button>
                </Link>
                <Link to="/doctor/login">
                  <Button size="sm">
                    Doctor Login
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Automatic Health Monitoring System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering rural and suburban communities with digital health record management. 
            Reduce repetitive checkups, save money, and maintain comprehensive diagnosis reports automatically.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                  <p className="text-sm text-gray-600">Registered Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-secondary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                  <p className="text-sm text-gray-600">Health Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.moneySaved / 1000).toFixed(1)}K</p>
                  <p className="text-sm text-gray-600">Money Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-info mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avoidedCheckups}</p>
                  <p className="text-sm text-gray-600">Avoided Checkups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Patient Search</TabsTrigger>
            <TabsTrigger value="dashboard">Health Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Patient Records</CardTitle>
                <CardDescription>
                  Search for existing patients to view their health history and avoid duplicate diagnoses
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter patient name, ID, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                  {/* <Link to="/patient/register">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      New Patient
                    </Button>
                  </Link> */}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-destructive mr-2" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Search Results List */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Search ({searchResults.length})</h4>
                    <div className="space-y-2">
                      {searchResults.map((patient) => (
                        <div  
                          key={patient.id}
                          className="bg-white border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleSelectPatient(patient.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                              <p className="text-sm text-gray-600">{patient.phone} • {patient.email}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Patient Details */}
                {selectedPatient && (
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </h3>
                        <p className="text-gray-600">
                          DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} | 
                          Blood Group: {selectedPatient.bloodGroup || "N/A"}
                        </p>
                        <p className="text-gray-600 flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedPatient.phone}
                        </p>
                        <p className="text-gray-600 flex items-center mt-1">
                          <Mail className="w-4 h-4 mr-1" />
                          {selectedPatient.email}
                        </p>
                        {selectedPatient.address && (
                          <p className="text-gray-600 flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {selectedPatient.address}, {selectedPatient.city}, {selectedPatient.state}
                          </p>
                        )}
                      </div>
                      {/* <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Records
                      </Button> */}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">
                        Medical Records ({patientRecords.length})
                      </h4>
                      
                      {patientRecords.length === 0 ? (
                        <p className="text-gray-500 text-sm">No medical records found</p>
                      ) : (
                        patientRecords.map((record) => (
                          <div key={record.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h5 className="font-medium">{record.examination_type}</h5>
                                  <Badge className={getStatusColor(record.diagnosis)}>
                                    {record.diagnosis.length > 30 
                                      ? "Review Required" 
                                      : "Recorded"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Doctor:</strong> {record.doctor_name} ({record.specialization})
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Diagnosis:</strong> {record.diagnosis}
                                </p>
                                {record.prescription && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Prescription:</strong> {record.prescription}
                                  </p>
                                )}
                                {record.next_checkup_date && (
                                  <p className="text-sm text-primary font-medium">
                                    Next checkup: {new Date(record.next_checkup_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(record.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest patient interactions and diagnoses</CardDescription>
                </CardHeader>

                <CardContent className="max-h-60 overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.type} for {activity.patientName}
                            </p>
                            <p className="text-xs text-gray-500">
                              by {activity.doctorName} • {timeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Quick system statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Total Doctors</p>
                        <p className="text-sm text-gray-600">Active in system</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{stats.totalDoctors}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">This Month</p>
                        <p className="text-sm text-gray-600">New records created</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">{stats.totalRecords}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Analytics</CardTitle>
                <CardDescription>
                  Track community health trends and system effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Common Diagnoses (This Month)</h4>
                    {diagnosisAnalytics.length === 0 ? (
                      <p className="text-gray-500 text-sm">No data available</p>
                    ) : (
                      diagnosisAnalytics.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{item.examination_type}</span>
                            <span className="text-sm font-medium">{item.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{width: `${item.percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Cost Savings Impact</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">
                        ₹{stats.moneySaved.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-green-600">
                        Total money saved by avoiding duplicate tests
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{stats.avoidedCheckups}</p>
                      <p className="text-sm text-blue-600">
                        Unnecessary checkups prevented
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Health Center Information</CardTitle>
            <CardDescription>
              24/7 support for rural and suburban communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Phone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Emergency Helpline</p>
                  <p className="text-sm text-gray-600">+91 1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-gray-600">help@healthtrack.gov.in</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Nearest Center</p>
                  <p className="text-sm text-gray-600">Primary Health Center, Sector 12</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
