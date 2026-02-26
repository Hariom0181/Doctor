import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Stethoscope, Phone, Mail, GraduationCap, Building2, Loader2 } from "lucide-react";
import { nurseApiService } from "@/services/nurseService";

interface FormDataType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  licenseNumber: string;
  currentHospital: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export default function NurseRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    licenseNumber: "",
    currentHospital: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleInputChange = (field: keyof FormDataType, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validateForm = (): string | null => {
    if (!formData.firstName) return "First name is required";
    if (!formData.lastName) return "Last name is required";
    if (!formData.email) return "Email is required";
    if (!formData.phone) return "Phone is required";
    if (!formData.qualification) return "Qualification is required";
    if (!formData.licenseNumber) return "License number is required";
    if (!formData.currentHospital) return "Hospital name is required";
    if (!formData.password) return "Password is required";
    if (!formData.confirmPassword) return "Confirm password is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return "Please enter a valid phone number";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      return "You must agree to the terms and conditions";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await nurseApiService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        qualification: formData.qualification,
        licenseNumber: formData.licenseNumber,
        currentHospital: formData.currentHospital,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(result.message);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please check your connection.');
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
              <p className="text-sm text-gray-600">
                Login will be available in the HealthTrack mobile app
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nurse Registration</h1>
          <p className="text-gray-600">Join HealthTrack as a healthcare professional</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success} Redirecting to home page...
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Create Your Professional Profile
            </CardTitle>
            <CardDescription>
              Please provide your nursing credentials and contact information
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
                        placeholder="your.email@example.com"
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
              </div>

              {/* Professional Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Professional Credentials
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification *</Label>
                  <Input
                    id="qualification"
                    placeholder="e.g., BSc Nursing, RN, GNM"
                    value={formData.qualification}
                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="Your nursing license number"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
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

              {/* Terms */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeTerms", Boolean(checked))}
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    I agree to the <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{" "}
                    <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span> *
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.agreeTerms || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register as Nurse"
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1" asChild disabled={isLoading}>
                  <Link to="/">Cancel</Link>
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Verification Process</h4>
                <p className="text-sm text-blue-700">
                  Your account will be reviewed and activated within 24-48 hours after verification of your nursing credentials.
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
          <p className="text-sm text-gray-600 mt-2">
            Are you a doctor?{" "}
            <Link to="/doctor/register" className="text-primary hover:underline">
              Register as Doctor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}