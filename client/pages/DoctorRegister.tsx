import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Stethoscope, Phone, Mail, Calendar, MapPin, FileText, GraduationCap, Building2, Loader2 } from "lucide-react";

export default function DoctorRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    medicalLicenseNumber: "",
    specialization: "",
    yearsOfExperience: "",
    qualifications: "",
    currentHospital: "",
    hospitalAddress: "",
    emergencyContact: "",
    emergencyPhone: "",
    consultationFee: "",
    availableHours: "",
    languages: "",
    bio: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    verifyIdentity: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    // Check required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'address', 'city', 'state', 'pincode', 'medicalLicenseNumber',
      'specialization', 'yearsOfExperience', 'qualifications', 'consultationFee',
      'currentHospital', 'hospitalAddress', 'password', 'confirmPassword'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    // Validate phone number
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return "Please enter a valid phone number";
    }

    // Validate pincode
    if (!/^\d{6}$/.test(formData.pincode)) {
      return "Pincode must be exactly 6 digits";
    }

    // Validate consultation fee
    const fee = parseFloat(formData.consultationFee);
    if (isNaN(fee) || fee < 0 || fee > 99999.99) {
      return "Consultation fee must be a valid number between 0 and 99999.99";
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    // Validate checkboxes
    if (!formData.agreeTerms) {
      return "You must agree to the terms and conditions";
    }

    if (!formData.verifyIdentity) {
      return "You must agree to identity verification";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        agreeTerms: formData.agreeTerms.toString(),
        verifyIdentity: formData.verifyIdentity.toString(),
        // Clean up phone number
        phone: formData.phone.replace(/\s/g, ''),
        emergencyPhone: formData.emergencyPhone ? formData.emergencyPhone.replace(/\s/g, '') : "",
        // Convert consultation fee to number
        consultationFee: parseFloat(formData.consultationFee)
      };

      const response = await fetch('http://localhost:5000/api/doctors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
//-------------------------------
if (data.success) {
  setSuccess(data.message);
  // Redirect to login page after successful registration
  setTimeout(() => {
    navigate('/doctor/login');
  }, 3000);
} else {
  if (data.errors && Array.isArray(data.errors)) {
    // Display validation errors from backend
    const errorMessages = data.errors.map(err => err.msg).join(', ');
    setError(errorMessages);

    // 🔥 Added alert
    alert("Validation Errors:\n" + data.errors.map(err => "• " + err.msg).join("\n"));
  } else {
    setError(data.message || 'Registration failed. Please try again.');

    // 🔥 Added alert
    alert("❌ " + (data.message || 'Registration failed. Please try again.'));
  }
}

      //--------
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HealthTrack</h1>
                <p className="text-sm text-gray-600">Automatic Health Monitoring</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/doctor/login" className="text-primary hover:text-primary/80">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Registration</h1>
          <p className="text-gray-600">Join as a healthcare provider to serve rural and suburban communities</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success} Redirecting to login page...
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Create Your Medical Profile
            </CardTitle>
            <CardDescription>
              Please provide your professional credentials and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="dr.yourname@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-10"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Professional Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Professional Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalLicenseNumber">Medical License Number *</Label>
                    <Input
                      id="medicalLicenseNumber"
                      placeholder="e.g., DL-12345-2023"
                      value={formData.medicalLicenseNumber}
                      onChange={(e) => handleInputChange("medicalLicenseNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Select value={formData.specialization} onValueChange={(value) => handleInputChange("specialization", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Medicine</SelectItem>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="dermatology">Dermatology</SelectItem>
                        <SelectItem value="endocrinology">Endocrinology</SelectItem>
                        <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="psychiatry">Psychiatry</SelectItem>
                        <SelectItem value="gynecology">Gynecology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                    <Select value={formData.yearsOfExperience} onValueChange={(value) => handleInputChange("yearsOfExperience", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-20">11-20 years</SelectItem>
                        <SelectItem value="20+">20+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Consultation Fee (₹) *</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      placeholder="e.g., 500"
                      min="0"
                      max="99999.99"
                      step="0.01"
                      value={formData.consultationFee}
                      onChange={(e) => handleInputChange("consultationFee", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications *</Label>
                  <Textarea
                    id="qualifications"
                    placeholder="MBBS, MD, etc. (Please list all relevant qualifications)"
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange("qualifications", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Practice Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Practice Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="currentHospital">Current Hospital/Clinic *</Label>
                  <Input
                    id="currentHospital"
                    placeholder="Name of your current workplace"
                    value={formData.currentHospital}
                    onChange={(e) => handleInputChange("currentHospital", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hospitalAddress">Hospital/Clinic Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="hospitalAddress"
                      placeholder="Complete address of your practice"
                      className="pl-10"
                      value={formData.hospitalAddress}
                      onChange={(e) => handleInputChange("hospitalAddress", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableHours">Available Hours</Label>
                    <Input
                      id="availableHours"
                      placeholder="e.g., Mon-Fri 9AM-6PM"
                      value={formData.availableHours}
                      onChange={(e) => handleInputChange("availableHours", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages Spoken</Label>
                    <Input
                      id="languages"
                      placeholder="e.g., English, Hindi, Bengali"
                      value={formData.languages}
                      onChange={(e) => handleInputChange("languages", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Personal Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Your residential address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Your city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="Your state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      placeholder="123456"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handleInputChange("pincode", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact person"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Bio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Professional Bio
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="bio">Brief Professional Biography</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell patients about your experience, approach to healthcare, and what makes your practice special..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Must contain uppercase, lowercase, number, and special character (min 8 chars)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Verification & Terms */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verifyIdentity"
                    checked={formData.verifyIdentity}
                    onCheckedChange={(checked) => handleInputChange("verifyIdentity", checked)}
                  />
                  <Label htmlFor="verifyIdentity" className="text-sm">
                    I understand that my medical credentials will be verified before account activation
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeTerms", checked)}
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    I agree to the <span className="text-primary cursor-pointer hover:underline">Medical Practice Terms</span>,{" "}
                    <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>, and{" "}
                    <span className="text-primary cursor-pointer hover:underline">Professional Code of Conduct</span>
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={!formData.agreeTerms || !formData.verifyIdentity || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register as Doctor"
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1" asChild disabled={isLoading}>
                  <Link to="/">Cancel</Link>
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Verification Process</h4>
                <p className="text-sm text-blue-700">
                  Your account will be reviewed and activated within 24-48 hours after verification of your medical license and credentials. 
                  You'll receive an email confirmation once approved.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Are you a patient?{" "}
            <Link to="/patient/register" className="text-primary hover:underline">
              Register as Patient
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}