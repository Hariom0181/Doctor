import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, FileText, TrendingUp, Calendar, Phone, Mail, MapPin, Plus, Search, Download } from "lucide-react";

interface HealthRecord {
  id: string;
  date: string;
  type: string;
  doctor: string;
  diagnosis: string;
  status: "Normal" | "Attention Needed" | "Critical";
  nextCheckup?: string;
}

interface PatientData {
  name: string;
  age: number;
  id: string;
  contact: string;
  recentRecords: HealthRecord[];
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  // Sample data for demonstration
  const samplePatient: PatientData = {
    name: "Rajesh Kumar",
    age: 45,
    id: "HMS2024001",
    contact: "+91 98765 43210",
    recentRecords: [
      {
        id: "1",
        date: "2024-01-15",
        type: "General Checkup",
        doctor: "Dr. Priya Sharma",
        diagnosis: "Blood pressure slightly elevated, cholesterol normal",
        status: "Attention Needed",
        nextCheckup: "2024-04-15"
      },
      {
        id: "2", 
        date: "2024-01-10",
        type: "Blood Test",
        doctor: "Dr. Amit Verma",
        diagnosis: "All parameters within normal range",
        status: "Normal"
      },
      {
        id: "3",
        date: "2024-01-05",
        type: "Heart Screening",
        doctor: "Dr. Sunita Patel",
        diagnosis: "Mild irregularity detected, follow-up recommended",
        status: "Attention Needed",
        nextCheckup: "2024-03-05"
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-success text-success-foreground";
      case "Attention Needed": return "bg-warning text-warning-foreground";
      case "Critical": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
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
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
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
                  <p className="text-2xl font-bold text-gray-900">5,892</p>
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
                  <p className="text-2xl font-bold text-gray-900">₹2.3L</p>
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
                  <p className="text-2xl font-bold text-gray-900">847</p>
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
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter patient name, ID, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => setSelectedPatient(samplePatient)}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    New Patient
                  </Button>
                </div>

                {selectedPatient && (
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                        <p className="text-gray-600">Age: {selectedPatient.age} | ID: {selectedPatient.id}</p>
                        <p className="text-gray-600 flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedPatient.contact}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Records
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Recent Health Records</h4>
                      {selectedPatient.recentRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium">{record.type}</h5>
                                <Badge className={getStatusColor(record.status)}>
                                  {record.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Doctor:</strong> {record.doctor}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Diagnosis:</strong> {record.diagnosis}
                              </p>
                              {record.nextCheckup && (
                                <p className="text-sm text-primary font-medium">
                                  Next checkup: {new Date(record.nextCheckup).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
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
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Blood test completed for Meera Patel</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Follow-up reminder sent to Rajesh Kumar</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New patient registration: Lakshmi Devi</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Scheduled checkups and follow-ups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Rajesh Kumar</p>
                        <p className="text-sm text-gray-600">Blood pressure follow-up</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Apr 15</p>
                        <p className="text-xs text-gray-500">10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Sunita Sharma</p>
                        <p className="text-sm text-gray-600">Diabetes checkup</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Apr 18</p>
                        <p className="text-xs text-gray-500">2:30 PM</p>
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
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hypertension</span>
                        <span className="text-sm font-medium">23%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '23%'}}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Diabetes</span>
                        <span className="text-sm font-medium">18%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{width: '18%'}}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">General Checkup</span>
                        <span className="text-sm font-medium">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-success h-2 rounded-full" style={{width: '35%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Cost Savings Impact</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">₹2,31,000</p>
                      <p className="text-sm text-green-600">Total money saved by avoiding duplicate tests</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">847</p>
                      <p className="text-sm text-blue-600">Unnecessary checkups prevented</p>
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
