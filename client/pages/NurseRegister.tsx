import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Stethoscope, Phone, Mail, GraduationCap, Building2, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
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
    if (!emailRegex.test(formData.email)) return "Please enter a valid email address";

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) return "Please enter a valid phone number";

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) return "Password must be at least 8 characters with uppercase, lowercase, number, and special character";

    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (!formData.agreeTerms) return "You must agree to the terms and conditions";

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
      setTimeout(() => { navigate('/'); }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .nr-root {
          min-height: 100vh; background: #F2F4F7;
          font-family: 'DM Sans', sans-serif; color: #1A1F2E;
          display: flex; flex-direction: column;
        }

        /* ── NAV ── */
        .nr-nav {
          background: rgba(255,255,255,0.92); backdrop-filter: blur(14px);
          border-bottom: 1px solid #E2E6EE; padding: 0 2rem; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .nr-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nr-nav-icon { width: 36px; height: 36px; background: #0B4F6C; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .nr-nav-title { font-family: 'DM Serif Display', serif; font-size: 1.25rem; color: #0B4F6C; letter-spacing: -0.02em; }
        .nr-nav-sub { font-size: 0.7rem; color: #8C96A8; margin-top: -2px; }
        .nr-nav-note { font-size: 0.8rem; color: #8C96A8; font-style: italic; }

        /* ── LAYOUT ── */
        .nr-container { display: flex; max-width: 1280px; margin: 0 auto; padding: 3rem 2rem 5rem; gap: 3.5rem; align-items: flex-start; }
        @media (max-width: 1024px) { .nr-container { flex-direction: column; gap: 2rem; } .nr-side { position: static !important; flex: none !important; width: 100%; } }

        /* ── SIDEBAR ── */
        .nr-side { flex: 0 0 290px; position: sticky; top: 90px; }
        .nr-badge { font-size: 0.7rem; font-weight: 700; color: #0B8A6C; background: #EDFBF7; border: 1px solid #B7EDD9; padding: 5px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 1.25rem; }
        .nr-heading { font-family: 'DM Serif Display', serif; font-size: 2.4rem; line-height: 1.1; letter-spacing: -0.03em; color: #0D1621; margin-bottom: 0.75rem; }
        .nr-heading em { font-style: italic; color: #0B4F6C; }
        .nr-sub { font-size: 0.875rem; color: #5A6478; line-height: 1.65; font-weight: 300; margin-bottom: 2rem; }
        .nr-feature { display: flex; align-items: center; gap: 12px; color: #344054; font-weight: 500; font-size: 0.875rem; background: #fff; padding: 12px 16px; border-radius: 12px; border: 1px solid #E2E6EE; margin-bottom: 0.75rem; }
        .nr-feature svg { color: #0B8A6C; flex-shrink: 0; }

        /* ── CARD ── */
        .nr-card { flex: 1; background: #fff; border: 1px solid #E2E6EE; border-radius: 24px; box-shadow: 0 8px 40px rgba(11,79,108,0.08); overflow: hidden; min-width: 0; }
        .nr-card-header { background: linear-gradient(135deg, #0B4F6C 0%, #062D40 100%); padding: 2rem 2.5rem; display: flex; align-items: center; gap: 14px; }
        .nr-card-header-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nr-card-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #fff; letter-spacing: -0.02em; margin: 0 0 3px; }
        .nr-card-desc { font-size: 0.825rem; color: rgba(255,255,255,0.5); margin: 0; }
        .nr-form-body { padding: 2.5rem; }

        /* ── ALERTS ── */
        .nr-alert { padding: 0.875rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; }
        .nr-alert-error { background: #FFF1F0; border: 1px solid #FFCCC7; color: #CF1322; }
        .nr-alert-success { background: #EDFBF7; border: 1px solid #B7EDD9; color: #0B6B50; }

        /* ── SECTIONS ── */
        .nr-section-title { font-size: 0.7rem; font-weight: 700; color: #0B4F6C; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #EDF0F5; padding-bottom: 10px; margin: 2.25rem 0 1.25rem; }
        .nr-section-title:first-of-type { margin-top: 0; }

        /* ── GRIDS ── */
        .nr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 680px) { .nr-grid-2 { grid-template-columns: 1fr; } }

        /* ── FIELDS ── */
        .nr-field { display: flex; flex-direction: column; gap: 6px; }
        .nr-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6478; }
        .nr-input-wrap { position: relative; }
        .nr-input-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #B0BAC9; pointer-events: none; display: flex; }

        .nr-input, .nr-select {
          width: 100%; height: 48px; border: 1px solid #DDE1E9; border-radius: 10px;
          padding: 0 1rem 0 2.75rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; color: #0D1621; background: #FAFBFD; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .nr-input:focus, .nr-select:focus {
          border-color: #0B4F6C; background: #fff;
          box-shadow: 0 0 0 3px rgba(11,79,108,0.1);
        }
        .nr-input-noicon { padding-left: 1rem; }
        .nr-hint { font-size: 0.75rem; color: #8C96A8; margin-top: 3px; }

        /* ── CHECKBOX ── */
        .nr-checkbox-group { display: flex; gap: 12px; margin-top: 1rem; background: #F8FAFC; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #E2E6EE; align-items: flex-start; }
        .nr-checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0B4F6C; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .nr-checkbox-label { font-size: 0.825rem; color: #5A6478; line-height: 1.5; }
        .nr-checkbox-label strong { color: #0B4F6C; }

        /* ── BUTTONS ── */
        .nr-btn-row { display: flex; gap: 1rem; margin-top: 2rem; }
        .nr-submit-btn { flex: 1; height: 52px; background: #0B4F6C; color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; }
        .nr-submit-btn:hover:not(:disabled) { background: #093D56; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(11,79,108,0.2); }
        .nr-submit-btn:disabled { background: #B0BAC9; cursor: not-allowed; }
        .nr-cancel-btn { flex: 1; height: 52px; background: #F2F4F7; color: #5A6478; border: 1px solid #DDE1E9; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.95rem; cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .nr-cancel-btn:hover { background: #E3E8F0; }

        /* ── INFO NOTE ── */
        .nr-info-note { background: #EDF4FF; border: 1px solid #C2DFF0; border-radius: 12px; padding: 1rem 1.25rem; margin-top: 1.25rem; font-size: 0.8rem; color: #026AA2; line-height: 1.55; }
        .nr-info-note strong { display: block; margin-bottom: 3px; color: #026AA2; }

        /* ── FOOTER LINKS ── */
        .nr-footer-links { text-align: center; margin-top: 1.5rem; }
        .nr-footer-link-row { font-size: 0.825rem; color: #5A6478; margin-bottom: 0.5rem; }
        .nr-footer-link-row a { color: #0B4F6C; font-weight: 600; text-decoration: none; }
        .nr-footer-link-row a:hover { text-decoration: underline; }

        /* ── PAGE FOOTER ── */
        .nr-page-footer { background: #fff; border-top: 1px solid #E2E6EE; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: #8C96A8; }
      `}</style>

      <div className="nr-root">
        {/* ── Nav ── */}
        <nav className="nr-nav">
          <Link to="/" className="nr-nav-brand">
            <div className="nr-nav-icon"><Heart size={18} color="#fff" /></div>
            <div>
              <div className="nr-nav-title">HealthTrack</div>
              <div className="nr-nav-sub">Automatic Health Monitoring</div>
            </div>
          </Link>
          <span className="nr-nav-note">Login available in the HealthTrack mobile app</span>
        </nav>

        <main className="nr-container">
          {/* ── Sidebar ── */}
          <aside className="nr-side">
            <div className="nr-badge"><ShieldCheck size={13} /> Nurse Registration</div>
            <h1 className="nr-heading">Care starts<br />with <em>you.</em></h1>
            <p className="nr-sub">Join HealthTrack as a nursing professional and help deliver better patient outcomes across rural and suburban communities.</p>
            {[
              { icon: <CheckCircle2 size={16} />, text: "Verified Credential System" },
              { icon: <CheckCircle2 size={16} />, text: "Digital Patient Records Access" },
              { icon: <CheckCircle2 size={16} />, text: "Real-time Health Monitoring" },
              { icon: <CheckCircle2 size={16} />, text: "24–48hr Approval Process" },
            ].map((f, i) => (
              <div key={i} className="nr-feature">{f.icon} {f.text}</div>
            ))}
          </aside>

          {/* ── Form Card ── */}
          <div className="nr-card">
            <div className="nr-card-header">
              <div className="nr-card-header-icon"><Stethoscope size={24} color="#fff" /></div>
              <div>
                <h2 className="nr-card-title">Professional Profile</h2>
                <p className="nr-card-desc">Nursing Credentials Enrollment</p>
              </div>
            </div>

            <div className="nr-form-body">
              {error && <div className="nr-alert nr-alert-error">{error}</div>}
              {success && <div className="nr-alert nr-alert-success">{success} Redirecting to home page...</div>}

              <form onSubmit={handleSubmit}>

                {/* ── Personal Information ── */}
                <div className="nr-section-title"><span style={{display:'flex',alignItems:'center',gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span> Personal Information</div>
                <div className="nr-grid-2">
                  <div className="nr-field">
                    <label className="nr-label">First Name *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
                      <input className="nr-input" type="text" placeholder="Enter your first name" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required />
                    </div>
                  </div>
                  <div className="nr-field">
                    <label className="nr-label">Last Name *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
                      <input className="nr-input" type="text" placeholder="Enter your last name" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required />
                    </div>
                  </div>
                  <div className="nr-field">
                    <label className="nr-label">Email Address *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><Mail size={15} /></span>
                      <input className="nr-input" type="email" placeholder="your.email@example.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
                    </div>
                  </div>
                  <div className="nr-field">
                    <label className="nr-label">Phone Number *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><Phone size={15} /></span>
                      <input className="nr-input" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} required />
                    </div>
                  </div>
                </div>

                {/* ── Professional Credentials ── */}
                <div className="nr-section-title"><GraduationCap size={14} /> Professional Credentials</div>
                <div className="nr-grid-2">
                  <div className="nr-field">
                    <label className="nr-label">Qualification *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><GraduationCap size={15} /></span>
                      <input className="nr-input" type="text" placeholder="e.g., BSc Nursing, RN, GNM" value={formData.qualification} onChange={(e) => handleInputChange("qualification", e.target.value)} required />
                    </div>
                  </div>
                  <div className="nr-field">
                    <label className="nr-label">License Number *</label>
                    <div className="nr-input-wrap">
                      <span className="nr-input-icon"><ShieldCheck size={15} /></span>
                      <input className="nr-input" type="text" placeholder="Your nursing license number" value={formData.licenseNumber} onChange={(e) => handleInputChange("licenseNumber", e.target.value)} required />
                    </div>
                  </div>
                </div>

                {/* ── Practice Information ── */}
                <div className="nr-section-title"><Building2 size={14} /> Practice Information</div>
                <div className="nr-field">
                  <label className="nr-label">Current Hospital / Clinic *</label>
                  <div className="nr-input-wrap">
                    <span className="nr-input-icon"><Building2 size={15} /></span>
                    <input className="nr-input" type="text" placeholder="Name of your current workplace" value={formData.currentHospital} onChange={(e) => handleInputChange("currentHospital", e.target.value)} required />
                  </div>
                </div>

                {/* ── Account Security ── */}
                <div className="nr-section-title"><ShieldCheck size={14} /> Account Security</div>
                <div className="nr-grid-2">
                  <div className="nr-field">
                    <label className="nr-label">Create Password *</label>
                    <input className="nr-input nr-input-noicon" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
                    <span className="nr-hint">Min 8 chars · uppercase · lowercase · number · symbol</span>
                  </div>
                  <div className="nr-field">
                    <label className="nr-label">Confirm Password *</label>
                    <input className="nr-input nr-input-noicon" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required />
                  </div>
                </div>

                {/* ── Terms ── */}
                <div className="nr-checkbox-group">
                  <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms} onChange={(e) => handleInputChange("agreeTerms", Boolean(e.target.checked))} />
                  <label htmlFor="agreeTerms" className="nr-checkbox-label">
                    I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> *
                  </label>
                </div>

                {/* ── Buttons ── */}
                <div className="nr-btn-row">
                  <button type="submit" className="nr-submit-btn" disabled={!formData.agreeTerms || isLoading}>
                    {isLoading ? <><Loader2 size={18} className="animate-spin" /> Registering…</> : "Register as Nurse"}
                  </button>
                  <Link to="/" className="nr-cancel-btn">Cancel</Link>
                </div>

                <div className="nr-info-note">
                  <strong>Verification Process</strong>
                  Your account will be reviewed and activated within 24–48 hours after verification of your nursing credentials. You'll receive an email confirmation once approved.
                </div>
              </form>

              <div className="nr-footer-links">
                <div className="nr-footer-link-row">Are you a patient? <Link to="/patient/register">Register as Patient</Link></div>
                <div className="nr-footer-link-row">Are you a doctor? <Link to="/doctor/register">Register as Doctor</Link></div>
              </div>
            </div>
          </div>
        </main>

        <footer className="nr-page-footer">
          <div style={{display:'flex',alignItems:'center',gap:6}}><Heart size={13} color="#0B4F6C" /> © 2026 HealthTrack Systems. All rights reserved.</div>
          <div>Secure · Encrypted · Private</div>
        </footer>
      </div>
    </>
  );
}