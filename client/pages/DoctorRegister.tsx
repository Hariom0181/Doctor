import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Stethoscope, Phone, Mail, Calendar, MapPin, FileText, GraduationCap, Building2, Loader2, ShieldCheck, CheckCircle2, User } from "lucide-react";

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
    if (error) setError("");
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'address', 'city', 'state', 'pincode', 'medicalLicenseNumber',
      'specialization', 'yearsOfExperience', 'qualifications', 'consultationFee',
      'currentHospital', 'hospitalAddress', 'password', 'confirmPassword'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        return `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Please enter a valid email address";

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) return "Please enter a valid phone number";

    if (!/^\d{6}$/.test(formData.pincode)) return "Pincode must be exactly 6 digits";

    const fee = parseFloat(formData.consultationFee);
    if (isNaN(fee) || fee < 0 || fee > 99999.99) return "Invalid consultation fee";

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) return "Password is too weak";

    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (!formData.agreeTerms) return "You must agree to the terms";
    if (!formData.verifyIdentity) return "You must agree to identity verification";

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
      const submitData = {
        ...formData,
        agreeTerms: formData.agreeTerms.toString(),
        verifyIdentity: formData.verifyIdentity.toString(),
        phone: formData.phone.replace(/\s/g, ''),
        emergencyPhone: formData.emergencyPhone ? formData.emergencyPhone.replace(/\s/g, '') : "",
        consultationFee: parseFloat(formData.consultationFee)
      };

      const response = await fetch('http://localhost:5000/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => navigate('/doctor/login'), 3000);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
          setError(errorMessages);
          alert("Validation Errors:\n" + data.errors.map((err: any) => "• " + err.msg).join("\n"));
        } else {
          setError(data.message || 'Registration failed.');
          alert("❌ " + (data.message || 'Registration failed.'));
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        
        .dr-root { min-height: 100vh; background: #F2F4F7; font-family: 'DM Sans', sans-serif; color: #1A1F2E; }
        
        /* Nav */
        .dr-nav { background: rgba(255,255,255,0.92); backdrop-filter: blur(14px); border-bottom: 1px solid #E2E6EE; padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .dr-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .dr-nav-icon { width: 36px; height: 36px; background: #0B4F6C; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .dr-nav-title { font-family: 'DM Serif Display', serif; font-size: 1.25rem; color: #0B4F6C; letter-spacing: -0.02em; }
        .dr-nav-sub { font-size: 0.7rem; color: #8C96A8; margin-top: -2px; }
        .dr-nav-link { font-size: 0.875rem; font-weight: 500; color: #0B4F6C; text-decoration: none; }
        .dr-nav-link:hover { text-decoration: underline; }

        /* Layout */
        .dr-container { display: flex; max-width: 1280px; margin: 0 auto; padding: 3rem 2rem 5rem; gap: 3.5rem; align-items: flex-start; }
        
        /* Sidebar */
        .dr-side { flex: 0 0 300px; position: sticky; top: 90px; }
        .dr-badge { font-size: 0.7rem; font-weight: 700; color: #0B8A6C; background: #EDFBF7; border: 1px solid #B7EDD9; padding: 5px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 1.25rem; }
        .dr-heading { font-family: 'DM Serif Display', serif; font-size: 2.5rem; line-height: 1.1; letter-spacing: -0.03em; color: #0D1621; margin-bottom: 0.75rem; }
        .dr-heading em { font-style: italic; color: #0B4F6C; }
        .dr-sub { font-size: 0.9rem; color: #5A6478; line-height: 1.65; font-weight: 300; margin-bottom: 2rem; }
        .dr-feature { display: flex; align-items: center; gap: 12px; color: #344054; font-weight: 500; font-size: 0.875rem; background: #fff; padding: 12px 16px; border-radius: 12px; border: 1px solid #E2E6EE; margin-bottom: 0.75rem; }
        .dr-feature svg { color: #0B8A6C; flex-shrink: 0; }

        /* Card */
        .dr-card { flex: 1; background: #fff; border: 1px solid #E2E6EE; border-radius: 24px; box-shadow: 0 8px 40px rgba(11,79,108,0.08); overflow: hidden; min-width: 0; }
        .dr-card-header { background: linear-gradient(135deg, #0B4F6C 0%, #062D40 100%); padding: 2rem 2.5rem; display: flex; align-items: center; gap: 14px; }
        .dr-card-header-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dr-card-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #fff; letter-spacing: -0.02em; margin: 0 0 3px; }
        .dr-card-desc { font-size: 0.825rem; color: rgba(255,255,255,0.5); margin: 0; }

        /* Form body */
        .dr-form-body { padding: 2.5rem; }

        /* Alerts */
        .dr-alert { padding: 0.875rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; }
        .dr-alert-error { background: #FFF1F0; border: 1px solid #FFCCC7; color: #CF1322; }
        .dr-alert-success { background: #EDFBF7; border: 1px solid #B7EDD9; color: #0B6B50; }

        /* Section titles */
        .dr-section-title { font-size: 0.7rem; font-weight: 700; color: #0B4F6C; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #EDF0F5; padding-bottom: 10px; margin: 2.25rem 0 1.25rem; }
        .dr-section-title:first-of-type { margin-top: 0; }

        /* Grid */
        .dr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .dr-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 700px) { .dr-grid-2, .dr-grid-3 { grid-template-columns: 1fr; } }

        /* Fields */
        .dr-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0; }
        .dr-field-full { display: flex; flex-direction: column; gap: 6px; margin-top: 1.25rem; }
        .dr-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6478; }
        .dr-input-wrap { position: relative; }
        .dr-input-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #B0BAC9; pointer-events: none; display: flex; }
        .dr-input-icon-top { position: absolute; left: 0.9rem; top: 0.875rem; color: #B0BAC9; pointer-events: none; display: flex; }
        
        .dr-input, .dr-select, .dr-textarea {
          width: 100%; height: 48px; border: 1px solid #DDE1E9; border-radius: 10px;
          padding: 0 1rem 0 2.75rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; color: #0D1621; background: #FAFBFD;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; outline: none;
        }
        .dr-input:focus, .dr-select:focus, .dr-textarea:focus {
          border-color: #0B4F6C; background: #fff;
          box-shadow: 0 0 0 3px rgba(11,79,108,0.1);
        }
        .dr-input-noicon { padding-left: 1rem; }
        .dr-select { appearance: none; cursor: pointer; }
        .dr-textarea { height: auto; min-height: 100px; padding-top: 0.75rem; padding-bottom: 0.75rem; resize: vertical; line-height: 1.5; }
        .dr-hint { font-size: 0.75rem; color: #8C96A8; margin-top: 3px; }

        /* Checkboxes */
        .dr-checkbox-group { display: flex; gap: 12px; margin-top: 1rem; background: #F8FAFC; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #E2E6EE; align-items: flex-start; }
        .dr-checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0B4F6C; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .dr-checkbox-label { font-size: 0.825rem; color: #5A6478; line-height: 1.5; }
        .dr-checkbox-label strong { color: #0B4F6C; }

        /* Submit */
        .dr-submit-btn { width: 100%; height: 52px; background: #0B4F6C; color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 2rem; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; }
        .dr-submit-btn:hover:not(:disabled) { background: #093D56; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(11,79,108,0.2); }
        .dr-submit-btn:disabled { background: #B0BAC9; cursor: not-allowed; }

        /* Info note */
        .dr-info-note { background: #EDF4FF; border: 1px solid #C2DFF0; border-radius: 12px; padding: 1rem 1.25rem; margin-top: 1.25rem; font-size: 0.8rem; color: #026AA2; line-height: 1.55; }
        .dr-info-note strong { display: block; margin-bottom: 3px; }

        /* Footer links */
        .dr-footer-link { text-align: center; font-size: 0.825rem; color: #5A6478; margin-top: 1.5rem; }
        .dr-footer-link a { color: #0B4F6C; font-weight: 600; text-decoration: none; }
        .dr-footer-link a:hover { text-decoration: underline; }

        /* Page footer */
        .dr-page-footer { background: #fff; border-top: 1px solid #E2E6EE; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: #8C96A8; }

        @media (max-width: 1024px) {
          .dr-container { flex-direction: column; gap: 2rem; }
          .dr-side { position: static; flex: none; width: 100%; }
        }
      `}</style>

      <div className="dr-root">
        {/* Nav */}
        <nav className="dr-nav">
          <Link to="/" className="dr-nav-brand">
            <div className="dr-nav-icon"><Heart size={18} color="#fff" /></div>
            <div>
              <div className="dr-nav-title">HealthTrack</div>
              <div className="dr-nav-sub">Automatic Health Monitoring</div>
            </div>
          </Link>
          <Link to="/doctor/login" className="dr-nav-link">
            Already have an account? <strong>Sign In</strong>
          </Link>
        </nav>

        <main className="dr-container">
          {/* Sidebar */}
          <aside className="dr-side">
            <div className="dr-badge"><ShieldCheck size={13} /> Secure Provider Registration</div>
            <h1 className="dr-heading">Join our network of <em>Elite Care</em> providers.</h1>
            <p className="dr-sub">Register today to offer digital consultations, track patient vitals, and manage your clinical workflow seamlessly.</p>
            {[
              { icon: <CheckCircle2 size={16} />, text: "HIPAA Compliant Data Handling" },
              { icon: <CheckCircle2 size={16} />, text: "Automated Patient Vitals Tracking" },
              { icon: <CheckCircle2 size={16} />, text: "Advanced Clinical Dashboard" },
            ].map((f, i) => (
              <div key={i} className="dr-feature">{f.icon} {f.text}</div>
            ))}
          </aside>

          {/* Form Card */}
          <div className="dr-card">
            <div className="dr-card-header">
              <div className="dr-card-header-icon"><Stethoscope size={24} color="#fff" /></div>
              <div>
                <h2 className="dr-card-title">Medical Profile</h2>
                <p className="dr-card-desc">Professional Provider Enrollment</p>
              </div>
            </div>

            <div className="dr-form-body">
              {error && <div className="dr-alert dr-alert-error">{error}</div>}
              {success && <div className="dr-alert dr-alert-success">{success} Redirecting to login...</div>}

              <form onSubmit={handleSubmit}>

                {/* ── Personal Information ── */}
                <div className="dr-section-title"><User size={14} /> Personal Information</div>
                <div className="dr-grid-2">
                  <div className="dr-field">
                    <label className="dr-label">First Name *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><User size={15} /></span>
                      <input className="dr-input" type="text" placeholder="John" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Last Name *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><User size={15} /></span>
                      <input className="dr-input" type="text" placeholder="Doe" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Email Address *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Mail size={15} /></span>
                      <input className="dr-input" type="email" placeholder="dr.john@health.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Phone Number *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Phone size={15} /></span>
                      <input className="dr-input" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Date of Birth *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Calendar size={15} /></span>
                      <input className="dr-input" type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange("dateOfBirth", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Gender *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><User size={15} /></span>
                      <select className="dr-select" value={formData.gender} onChange={(e) => handleInputChange("gender", e.target.value)}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Contact Information ── */}
                <div className="dr-section-title"><MapPin size={14} /> Contact Information</div>
                <div className="dr-field-full">
                  <label className="dr-label">Personal Address *</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon-top"><MapPin size={15} /></span>
                    <textarea className="dr-textarea" placeholder="Your residential address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
                  </div>
                </div>
                <div className="dr-grid-3" style={{marginTop:'1.25rem'}}>
                  <div className="dr-field">
                    <label className="dr-label">City *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><MapPin size={15} /></span>
                      <input className="dr-input" type="text" placeholder="Your city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">State *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><MapPin size={15} /></span>
                      <input className="dr-input" type="text" placeholder="Your state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">PIN Code *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><MapPin size={15} /></span>
                      <input className="dr-input" type="text" placeholder="123456" maxLength={6} value={formData.pincode} onChange={(e) => handleInputChange("pincode", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="dr-grid-2" style={{marginTop:'1.25rem'}}>
                  <div className="dr-field">
                    <label className="dr-label">Emergency Contact Name</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><User size={15} /></span>
                      <input className="dr-input" type="text" placeholder="Emergency contact person" value={formData.emergencyContact} onChange={(e) => handleInputChange("emergencyContact", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Emergency Contact Phone</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Phone size={15} /></span>
                      <input className="dr-input" type="tel" placeholder="+91 98765 43210" value={formData.emergencyPhone} onChange={(e) => handleInputChange("emergencyPhone", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ── Professional Credentials ── */}
                <div className="dr-section-title"><GraduationCap size={14} /> Professional Credentials</div>
                <div className="dr-grid-2">
                  <div className="dr-field">
                    <label className="dr-label">Medical License No. *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><ShieldCheck size={15} /></span>
                      <input className="dr-input" type="text" placeholder="e.g. DL-12345-2023" value={formData.medicalLicenseNumber} onChange={(e) => handleInputChange("medicalLicenseNumber", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Specialization *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Stethoscope size={15} /></span>
                      <select className="dr-select" value={formData.specialization} onChange={(e) => handleInputChange("specialization", e.target.value)}>
                        <option value="">Select Specialty</option>
                        <option value="general">General Medicine</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="dermatology">Dermatology</option>
                        <option value="endocrinology">Endocrinology</option>
                        <option value="gastroenterology">Gastroenterology</option>
                        <option value="neurology">Neurology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="psychiatry">Psychiatry</option>
                        <option value="gynecology">Gynecology</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Years of Experience *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Calendar size={15} /></span>
                      <select className="dr-select" value={formData.yearsOfExperience} onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}>
                        <option value="">Select Experience Range</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="11-20">11-20 years</option>
                        <option value="20+">20+ years</option>
                      </select>
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Consultation Fee (₹) *</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon" style={{fontWeight:700,fontSize:'0.85rem',color:'#B0BAC9'}}>₹</span>
                      <input className="dr-input" type="number" placeholder="500" min="0" max="99999.99" step="0.01" value={formData.consultationFee} onChange={(e) => handleInputChange("consultationFee", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="dr-field-full">
                  <label className="dr-label">Qualifications *</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon-top"><GraduationCap size={15} /></span>
                    <textarea className="dr-textarea" placeholder="MBBS, MD Cardiology... (list all relevant qualifications)" value={formData.qualifications} onChange={(e) => handleInputChange("qualifications", e.target.value)} />
                  </div>
                </div>

                {/* ── Practice Information ── */}
                <div className="dr-section-title"><Building2 size={14} /> Practice Information</div>
                <div className="dr-field">
                  <label className="dr-label">Current Hospital / Clinic *</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon"><Building2 size={15} /></span>
                    <input className="dr-input" type="text" placeholder="St. Mary's General Hospital" value={formData.currentHospital} onChange={(e) => handleInputChange("currentHospital", e.target.value)} />
                  </div>
                </div>
                <div className="dr-field-full">
                  <label className="dr-label">Hospital / Clinic Address *</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon-top"><MapPin size={15} /></span>
                    <textarea className="dr-textarea" placeholder="Complete address of your practice" value={formData.hospitalAddress} onChange={(e) => handleInputChange("hospitalAddress", e.target.value)} />
                  </div>
                </div>
                <div className="dr-grid-2" style={{marginTop:'1.25rem'}}>
                  <div className="dr-field">
                    <label className="dr-label">Available Hours</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><Calendar size={15} /></span>
                      <input className="dr-input" type="text" placeholder="Mon-Fri 9AM-6PM" value={formData.availableHours} onChange={(e) => handleInputChange("availableHours", e.target.value)} />
                    </div>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Languages Spoken</label>
                    <div className="dr-input-wrap">
                      <span className="dr-input-icon"><FileText size={15} /></span>
                      <input className="dr-input" type="text" placeholder="English, Hindi, Bengali" value={formData.languages} onChange={(e) => handleInputChange("languages", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ── Professional Bio ── */}
                <div className="dr-section-title"><FileText size={14} /> Professional Bio</div>
                <div className="dr-field">
                  <label className="dr-label">Brief Professional Biography</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon-top"><FileText size={15} /></span>
                    <textarea className="dr-textarea" style={{minHeight:'120px'}} placeholder="Tell patients about your experience, approach to healthcare, and what makes your practice special..." value={formData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} />
                  </div>
                </div>

                {/* ── Account Security ── */}
                <div className="dr-section-title"><ShieldCheck size={14} /> Account Security</div>
                <div className="dr-grid-2">
                  <div className="dr-field">
                    <label className="dr-label">Create Password *</label>
                    <input className="dr-input dr-input-noicon" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} />
                    <span className="dr-hint">Min 8 chars · uppercase · lowercase · number · symbol</span>
                  </div>
                  <div className="dr-field">
                    <label className="dr-label">Confirm Password *</label>
                    <input className="dr-input dr-input-noicon" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} />
                  </div>
                </div>

                {/* ── Checkboxes ── */}
                <div className="dr-checkbox-group">
                  <input type="checkbox" id="verifyIdentity" checked={formData.verifyIdentity} onChange={(e) => handleInputChange("verifyIdentity", e.target.checked)} />
                  <label htmlFor="verifyIdentity" className="dr-checkbox-label">
                    I confirm that my medical credentials provided are accurate and understand they will be verified manually before account activation.
                  </label>
                </div>
                <div className="dr-checkbox-group">
                  <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms} onChange={(e) => handleInputChange("agreeTerms", e.target.checked)} />
                  <label htmlFor="agreeTerms" className="dr-checkbox-label">
                    I agree to the <strong>Medical Practice Terms</strong>, <strong>Privacy Policy</strong>, and the <strong>Professional Code of Conduct</strong>.
                  </label>
                </div>

                {/* Submit */}
                <button type="submit" className="dr-submit-btn" disabled={!formData.agreeTerms || !formData.verifyIdentity || isLoading}>
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Submit Application"}
                </button>

                <div className="dr-info-note">
                  <strong>Note:</strong> Approvals typically take 24–48 business hours. You will be notified via email once your portal access is granted.
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="dr-page-footer">
          <div style={{display:'flex',alignItems:'center',gap:6}}><Heart size={13} color="#0B4F6C" /> © 2026 HealthTrack Systems. All rights reserved.</div>
          <div>Secure · Encrypted · Private</div>
        </footer>
      </div>
    </>
  );
}