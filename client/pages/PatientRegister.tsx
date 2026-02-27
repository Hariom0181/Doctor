import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, User, Phone, Mail, Calendar, MapPin, FileText, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function PatientRegister() {
  const [formData, setFormData] = useState<FormData>({
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
    emergencyContact: "",
    emergencyPhone: "",
    bloodGroup: "",
    allergies: "",
    medicalHistory: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (field === 'confirmPassword' || field === 'password') {
      validatePasswordMatch(
        field === 'confirmPassword' ? value as string : formData.confirmPassword,
        field === 'password' ? value as string : formData.password
      );
    }
  };

  const validatePasswordMatch = (confirmPassword: string, password: string) => {
    if (confirmPassword && password && confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const requiredFields: (keyof FormData)[] = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'address', 'city', 'state', 'pincode', 'emergencyContact', 'emergencyPhone', 'password', 'confirmPassword'
    ];
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && (formData[field] as string).trim() === '')) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid Indian phone number (10 digits starting with 6-9)";
    }
    if (formData.emergencyPhone && !/^[6-9]\d{9}$/.test(formData.emergencyPhone.replace(/\D/g, ''))) {
      newErrors.emergencyPhone = "Please enter a valid Indian phone number";
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = "Password must contain uppercase, lowercase, and a number";
      }
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 1 || birthDate > today) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions";
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
      const response = await fetch("http://localhost:5000/api/patients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          const serverErrors: ValidationErrors = {};
          data.errors.forEach((err: any) => {
            serverErrors[err.param || err.path] = err.msg || err.message;
          });
          setErrors(serverErrors);
          setSubmitMessage({ type: 'error', message: 'Please fix the validation errors below.' });
        } else {
          setSubmitMessage({ type: 'error', message: data.message || "Registration failed. Please try again." });
        }
        throw new Error("Failed to register patient");
      } else {
        setSubmitMessage({ type: 'success', message: "Registration successful! You can now log in to your account." });
        setFormData({
          firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "",
          gender: "", address: "", city: "", state: "", pincode: "",
          emergencyContact: "", emergencyPhone: "", bloodGroup: "", allergies: "",
          medicalHistory: "", password: "", confirmPassword: "", agreeTerms: false,
        });
        setErrors({});
      }
    } catch (error) {
      console.error("Error during registration:", error);
      if (!submitMessage) {
        setSubmitMessage({ type: 'error', message: "Network error. Please check your connection and try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{5})(\d{5})/, '$1 $2');
    }
    return numbers.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .pr-root {
          min-height: 100vh; background: #F2F4F7;
          font-family: 'DM Sans', sans-serif; color: #1A1F2E;
          display: flex; flex-direction: column;
        }

        /* ── NAV ── */
        .pr-nav {
          background: rgba(255,255,255,0.92); backdrop-filter: blur(14px);
          border-bottom: 1px solid #E2E6EE; padding: 0 2rem; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .pr-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .pr-nav-icon { width: 36px; height: 36px; background: #0B4F6C; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .pr-nav-title { font-family: 'DM Serif Display', serif; font-size: 1.25rem; color: #0B4F6C; letter-spacing: -0.02em; }
        .pr-nav-sub { font-size: 0.7rem; color: #8C96A8; margin-top: -2px; }
        .pr-nav-link { font-size: 0.875rem; font-weight: 500; color: #0B4F6C; text-decoration: none; }
        .pr-nav-link:hover { text-decoration: underline; }

        /* ── LAYOUT ── */
        .pr-container { display: flex; max-width: 1280px; margin: 0 auto; padding: 3rem 2rem 5rem; gap: 3.5rem; align-items: flex-start; }
        @media (max-width: 1024px) { .pr-container { flex-direction: column; gap: 2rem; } .pr-side { position: static !important; flex: none !important; width: 100%; } }

        /* ── SIDEBAR ── */
        .pr-side { flex: 0 0 290px; position: sticky; top: 90px; }
        .pr-badge { font-size: 0.7rem; font-weight: 700; color: #0B8A6C; background: #EDFBF7; border: 1px solid #B7EDD9; padding: 5px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 1.25rem; }
        .pr-heading { font-family: 'DM Serif Display', serif; font-size: 2.4rem; line-height: 1.1; letter-spacing: -0.03em; color: #0D1621; margin-bottom: 0.75rem; }
        .pr-heading em { font-style: italic; color: #0B4F6C; }
        .pr-sub { font-size: 0.875rem; color: #5A6478; line-height: 1.65; font-weight: 300; margin-bottom: 2rem; }
        .pr-feature { display: flex; align-items: center; gap: 12px; color: #344054; font-weight: 500; font-size: 0.875rem; background: #fff; padding: 12px 16px; border-radius: 12px; border: 1px solid #E2E6EE; margin-bottom: 0.75rem; }
        .pr-feature svg { color: #0B8A6C; flex-shrink: 0; }

        /* ── CARD ── */
        .pr-card { flex: 1; background: #fff; border: 1px solid #E2E6EE; border-radius: 24px; box-shadow: 0 8px 40px rgba(11,79,108,0.08); overflow: hidden; min-width: 0; }
        .pr-card-header { background: linear-gradient(135deg, #0B4F6C 0%, #062D40 100%); padding: 2rem 2.5rem; display: flex; align-items: center; gap: 14px; }
        .pr-card-header-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pr-card-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #fff; letter-spacing: -0.02em; margin: 0 0 3px; }
        .pr-card-desc { font-size: 0.825rem; color: rgba(255,255,255,0.5); margin: 0; }
        .pr-form-body { padding: 2.5rem; }

        /* ── ALERTS ── */
        .pr-alert { padding: 0.875rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; }
        .pr-alert-error { background: #FFF1F0; border: 1px solid #FFCCC7; color: #CF1322; }
        .pr-alert-success { background: #EDFBF7; border: 1px solid #B7EDD9; color: #0B6B50; }

        /* ── SECTION ── */
        .pr-section-title { font-size: 0.7rem; font-weight: 700; color: #0B4F6C; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #EDF0F5; padding-bottom: 10px; margin: 2.25rem 0 1.25rem; }
        .pr-section-title:first-of-type { margin-top: 0; }

        /* ── GRIDS ── */
        .pr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .pr-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 680px) { .pr-grid-2, .pr-grid-3 { grid-template-columns: 1fr; } }

        /* ── FIELDS ── */
        .pr-field { display: flex; flex-direction: column; gap: 6px; }
        .pr-field-full { display: flex; flex-direction: column; gap: 6px; margin-top: 1.25rem; }
        .pr-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6478; }
        .pr-input-wrap { position: relative; }
        .pr-input-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #B0BAC9; pointer-events: none; display: flex; }
        .pr-input-icon-top { position: absolute; left: 0.9rem; top: 0.875rem; color: #B0BAC9; pointer-events: none; display: flex; }
        .pr-input-eye { position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #B0BAC9; display: flex; padding: 2px; transition: color 0.15s; }
        .pr-input-eye:hover { color: #0B4F6C; }

        .pr-input, .pr-select, .pr-textarea {
          width: 100%; height: 48px; border: 1px solid #DDE1E9; border-radius: 10px;
          padding: 0 1rem 0 2.75rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; color: #0D1621; background: #FAFBFD; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .pr-input:focus, .pr-select:focus, .pr-textarea:focus {
          border-color: #0B4F6C; background: #fff;
          box-shadow: 0 0 0 3px rgba(11,79,108,0.1);
        }
        .pr-input.err, .pr-select.err, .pr-textarea.err { border-color: #FF4D4F; background: #FFF2F0; }
        .pr-input.err:focus, .pr-select.err:focus { box-shadow: 0 0 0 3px rgba(255,77,79,0.1); }
        .pr-input-noicon { padding-left: 1rem; }
        .pr-input-pr { padding-right: 2.75rem; }
        .pr-select { appearance: none; cursor: pointer; }
        .pr-textarea { height: auto; min-height: 90px; padding-top: 0.75rem; padding-bottom: 0.75rem; resize: vertical; line-height: 1.5; }
        .pr-error { font-size: 0.75rem; color: #FF4D4F; margin-top: 3px; }
        .pr-hint { font-size: 0.75rem; color: #8C96A8; margin-top: 3px; line-height: 1.4; }

        /* ── CHECKBOX ── */
        .pr-checkbox-group { display: flex; gap: 12px; margin-top: 1rem; background: #F8FAFC; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #E2E6EE; align-items: flex-start; }
        .pr-checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0B4F6C; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .pr-checkbox-label { font-size: 0.825rem; color: #5A6478; line-height: 1.5; }
        .pr-checkbox-label strong { color: #0B4F6C; }

        /* ── BUTTONS ── */
        .pr-btn-row { display: flex; gap: 1rem; margin-top: 2rem; }
        .pr-submit-btn { flex: 1; height: 52px; background: #0B4F6C; color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; }
        .pr-submit-btn:hover:not(:disabled) { background: #093D56; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(11,79,108,0.2); }
        .pr-submit-btn:disabled { background: #B0BAC9; cursor: not-allowed; }
        .pr-cancel-btn { flex: 1; height: 52px; background: #F2F4F7; color: #5A6478; border: 1px solid #DDE1E9; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.95rem; cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .pr-cancel-btn:hover { background: #E3E8F0; }

        /* ── FOOTER LINKS ── */
        .pr-footer-link { text-align: center; font-size: 0.825rem; color: #5A6478; margin-top: 1.5rem; }
        .pr-footer-link a { color: #0B4F6C; font-weight: 600; text-decoration: none; }
        .pr-footer-link a:hover { text-decoration: underline; }

        /* ── PAGE FOOTER ── */
        .pr-page-footer { background: #fff; border-top: 1px solid #E2E6EE; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: #8C96A8; }
      `}</style>

      <div className="pr-root">
        {/* ── Nav ── */}
        <nav className="pr-nav">
          <Link to="/" className="pr-nav-brand">
            <div className="pr-nav-icon"><Heart size={18} color="#fff" /></div>
            <div>
              <div className="pr-nav-title">HealthTrack</div>
              <div className="pr-nav-sub">Automatic Health Monitoring</div>
            </div>
          </Link>
          <Link to="/patient/login" className="pr-nav-link">
            Already have an account? <strong>Sign In</strong>
          </Link>
        </nav>

        <main className="pr-container">
          {/* ── Sidebar ── */}
          <aside className="pr-side">
            <div className="pr-badge"><ShieldCheck size={13} /> Patient Registration</div>
            <h1 className="pr-heading">Your health,<br /><em>digitised.</em></h1>
            <p className="pr-sub">Join our health monitoring system to manage your medical records, track appointments, and access your history anytime.</p>
            {[
              { icon: <CheckCircle2 size={16} />, text: "Complete Medical History" },
              { icon: <CheckCircle2 size={16} />, text: "Emergency Information Access" },
              { icon: <CheckCircle2 size={16} />, text: "Instant Report Downloads" },
              { icon: <CheckCircle2 size={16} />, text: "Appointment Tracking" },
            ].map((f, i) => (
              <div key={i} className="pr-feature">{f.icon} {f.text}</div>
            ))}
          </aside>

          {/* ── Form Card ── */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-header-icon"><User size={24} color="#fff" /></div>
              <div>
                <h2 className="pr-card-title">Create Your Health Profile</h2>
                <p className="pr-card-desc">Fill in all required information to set up your account</p>
              </div>
            </div>

            <div className="pr-form-body">
              {submitMessage && (
                <div className={`pr-alert ${submitMessage.type === 'error' ? 'pr-alert-error' : 'pr-alert-success'}`}>
                  {submitMessage.message}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* ── Personal Information ── */}
                <div className="pr-section-title"><User size={14} /> Personal Information</div>
                <div className="pr-grid-2">
                  <div className="pr-field">
                    <label className="pr-label">First Name *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><User size={15} /></span>
                      <input className={`pr-input${errors.firstName ? ' err' : ''}`} type="text" placeholder="Enter your first name" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                    </div>
                    {errors.firstName && <span className="pr-error">{errors.firstName}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Last Name *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><User size={15} /></span>
                      <input className={`pr-input${errors.lastName ? ' err' : ''}`} type="text" placeholder="Enter your last name" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                    </div>
                    {errors.lastName && <span className="pr-error">{errors.lastName}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Email Address *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><Mail size={15} /></span>
                      <input className={`pr-input${errors.email ? ' err' : ''}`} type="email" placeholder="your.email@example.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                    {errors.email && <span className="pr-error">{errors.email}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Phone Number *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><Phone size={15} /></span>
                      <input className={`pr-input${errors.phone ? ' err' : ''}`} type="tel" placeholder="98765 43210" value={formatPhoneNumber(formData.phone)} onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ''))} maxLength={11} />
                    </div>
                    {errors.phone && <span className="pr-error">{errors.phone}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Date of Birth *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><Calendar size={15} /></span>
                      <input className={`pr-input${errors.dateOfBirth ? ' err' : ''}`} type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange("dateOfBirth", e.target.value)} max={new Date().toISOString().split('T')[0]} />
                    </div>
                    {errors.dateOfBirth && <span className="pr-error">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Gender *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><User size={15} /></span>
                      <select className={`pr-select${errors.gender ? ' err' : ''}`} value={formData.gender} onChange={(e) => handleInputChange("gender", e.target.value)}>
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {errors.gender && <span className="pr-error">{errors.gender}</span>}
                  </div>
                </div>

                {/* ── Address Information ── */}
                <div className="pr-section-title"><MapPin size={14} /> Address Information</div>
                <div className="pr-field">
                  <label className="pr-label">Full Address *</label>
                  <div className="pr-input-wrap">
                    <span className="pr-input-icon-top"><MapPin size={15} /></span>
                    <textarea className={`pr-textarea${errors.address ? ' err' : ''}`} placeholder="Enter your complete address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
                  </div>
                  {errors.address && <span className="pr-error">{errors.address}</span>}
                </div>
                <div className="pr-grid-3" style={{marginTop:'1.25rem'}}>
                  <div className="pr-field">
                    <label className="pr-label">City *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><MapPin size={15} /></span>
                      <input className={`pr-input${errors.city ? ' err' : ''}`} type="text" placeholder="Your city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                    </div>
                    {errors.city && <span className="pr-error">{errors.city}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">State *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><MapPin size={15} /></span>
                      <input className={`pr-input${errors.state ? ' err' : ''}`} type="text" placeholder="Your state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} />
                    </div>
                    {errors.state && <span className="pr-error">{errors.state}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">PIN Code *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><MapPin size={15} /></span>
                      <input className={`pr-input${errors.pincode ? ' err' : ''}`} type="text" placeholder="123456" value={formData.pincode} onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    </div>
                    {errors.pincode && <span className="pr-error">{errors.pincode}</span>}
                  </div>
                </div>

                {/* ── Emergency Contact ── */}
                <div className="pr-section-title"><Phone size={14} /> Emergency Contact</div>
                <div className="pr-grid-2">
                  <div className="pr-field">
                    <label className="pr-label">Contact Name *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><User size={15} /></span>
                      <input className={`pr-input${errors.emergencyContact ? ' err' : ''}`} type="text" placeholder="Full name of emergency contact" value={formData.emergencyContact} onChange={(e) => handleInputChange("emergencyContact", e.target.value)} />
                    </div>
                    {errors.emergencyContact && <span className="pr-error">{errors.emergencyContact}</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Contact Phone *</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><Phone size={15} /></span>
                      <input className={`pr-input${errors.emergencyPhone ? ' err' : ''}`} type="tel" placeholder="98765 43210" value={formatPhoneNumber(formData.emergencyPhone)} onChange={(e) => handleInputChange("emergencyPhone", e.target.value.replace(/\D/g, ''))} maxLength={11} />
                    </div>
                    {errors.emergencyPhone && <span className="pr-error">{errors.emergencyPhone}</span>}
                  </div>
                </div>

                {/* ── Medical Information ── */}
                <div className="pr-section-title"><FileText size={14} /> Medical Information</div>
                <div className="pr-grid-2">
                  <div className="pr-field">
                    <label className="pr-label">Blood Group</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><FileText size={15} /></span>
                      <select className="pr-select" value={formData.bloodGroup} onChange={(e) => handleInputChange("bloodGroup", e.target.value)}>
                        <option value="">Select your blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Known Allergies</label>
                    <div className="pr-input-wrap">
                      <span className="pr-input-icon"><FileText size={15} /></span>
                      <input className="pr-input" type="text" placeholder="None (leave empty if no allergies)" value={formData.allergies} onChange={(e) => handleInputChange("allergies", e.target.value)} />
                    </div>
                    <span className="pr-hint">List any food or drug allergies, or leave empty.</span>
                  </div>
                </div>
                <div className="pr-field" style={{marginTop:'1.25rem'}}>
                  <label className="pr-label">Medical History</label>
                  <div className="pr-input-wrap">
                    <span className="pr-input-icon-top"><FileText size={15} /></span>
                    <textarea className="pr-textarea" placeholder="Brief medical history, chronic conditions, medications, etc." value={formData.medicalHistory} onChange={(e) => handleInputChange("medicalHistory", e.target.value)} />
                  </div>
                </div>

                {/* ── Account Security ── */}
                <div className="pr-section-title"><ShieldCheck size={14} /> Account Security</div>
                <div className="pr-grid-2">
                  <div className="pr-field">
                    <label className="pr-label">Password *</label>
                    <div className="pr-input-wrap">
                      <input className={`pr-input pr-input-noicon pr-input-pr${errors.password ? ' err' : ''}`} type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} />
                      <button type="button" className="pr-input-eye" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <span className="pr-error">{errors.password}</span>}
                    {formData.password && !errors.password && <span className="pr-hint">Must contain uppercase, lowercase, and a number</span>}
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">Confirm Password *</label>
                    <div className="pr-input-wrap">
                      <input className={`pr-input pr-input-noicon pr-input-pr${errors.confirmPassword ? ' err' : ''}`} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} />
                      <button type="button" className="pr-input-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="pr-error">{errors.confirmPassword}</span>}
                  </div>
                </div>

                {/* ── Terms ── */}
                <div className="pr-checkbox-group">
                  <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms} onChange={(e) => handleInputChange("agreeTerms", e.target.checked)} />
                  <label htmlFor="agreeTerms" className="pr-checkbox-label">
                    I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> *
                  </label>
                </div>
                {errors.agreeTerms && <span className="pr-error" style={{marginTop:6,display:'block'}}>{errors.agreeTerms}</span>}

                {/* ── Buttons ── */}
                <div className="pr-btn-row">
                  <button type="submit" className="pr-submit-btn" disabled={!formData.agreeTerms || isLoading}>
                    {isLoading ? <><Loader2 size={18} className="animate-spin" /> Creating Account…</> : "Create Account"}
                  </button>
                  <Link to="/" className="pr-cancel-btn">Cancel</Link>
                </div>
              </form>

              <div className="pr-footer-link">
                Are you a healthcare provider?{" "}
                <Link to="/doctor/register">Register as a Doctor</Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="pr-page-footer">
          <div style={{display:'flex',alignItems:'center',gap:6}}><Heart size={13} color="#0B4F6C" /> © 2026 HealthTrack Systems. All rights reserved.</div>
          <div>Secure · Encrypted · Private</div>
        </footer>
      </div>
    </>
  );
}