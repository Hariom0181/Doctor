import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Stethoscope, Mail, Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';


interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Clear general error message
    if (submitMessage) {
      setSubmitMessage(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 1) {
      newErrors.password = "Password cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!validateForm()) {
      setSubmitMessage({ type: 'error', message: 'Please fix the errors below and try again.' });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Doctor login data:", formData);
      await login(formData.email, formData.password, 'doctor');
      setSubmitMessage({ type: 'success', message: "Login successful! Redirecting..." });
      setTimeout(() => {
        navigate("/doctor/dashboard");
      }, 1000);

    } catch (error) {
      console.error("Error during login:", error);
      setSubmitMessage({ 
        type: 'error', 
        message: error.message || "Login failed. Please check your credentials." 
      });
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
              <Link to="/doctor/register" className="text-primary hover:text-primary/80">
                Don't have an account? Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Portal</h1>
            <p className="text-gray-600">Access your medical practice dashboard</p>
          </div>

          {/* Success/Error Message */}
          {submitMessage && (
            <Alert className={`mb-6 ${submitMessage.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
              <AlertDescription className={submitMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {submitMessage.message}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Secure Login
              </CardTitle>
              <CardDescription>
                Enter your verified medical credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Medical Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="dr.yourname@hospital.com"
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your secure password"
                      className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange("rememberMe", checked)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="rememberMe" className="text-sm">
                      Keep me signed in
                    </Label>
                  </div>
                  <Link to="/doctor/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Authenticating..." : "Access Medical Portal"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              New to the platform?{" "}
              <Link to="/doctor/register" className="text-primary hover:underline font-medium">
                Register as Doctor
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Are you a patient?{" "}
              <Link to="/patient/login" className="text-primary hover:underline font-medium">
                Patient Login
              </Link>
            </p>
          </div>

          {/* Security Features */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Security Features:
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• End-to-end encrypted patient data</li>
                <li>• Multi-factor authentication available</li>
                <li>• HIPAA compliant data protection</li>
                <li>• Secure medical records access</li>
                <li>• Audit trail for all activities</li>
              </ul>
            </CardContent>
          </Card>

          {/* Doctor Dashboard Preview */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2">Doctor Dashboard Features:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Patient appointment management</li>
                <li>• Medical records and history access</li>
                <li>• Prescription and diagnosis tools</li>
                <li>• Telemedicine consultation platform</li>
                <li>• Health analytics and reports</li>
                <li>• Integration with lab results</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}