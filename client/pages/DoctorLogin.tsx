import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (submitMessage) setSubmitMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password, 'doctor');
      setSubmitMessage({ type: 'success', message: "Login successful! Redirecting..." });
      setTimeout(() => navigate("/doctor/dashboard"), 1000);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || "Login failed. Please check your credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap');

        .dl-root {
          min-height: 100vh;
          background: #F2F4F7;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── NAV ── */
        .dl-nav {
          background: #fff;
          border-bottom: 1px solid #E2E6EE;
          padding: 0 5%;
          height: 70px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .dl-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .dl-nav-icon {
          width: 40px; height: 40px; background: #0B4F6C;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .dl-nav-title { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: #0B4F6C; margin-bottom: -2px; }
        .dl-nav-sub { font-size: 0.75rem; color: #8C96A8; }
        .dl-nav-link { font-size: 0.9rem; color: #5A6478; text-decoration: none; }
        .dl-nav-link strong { color: #0B4F6C; margin-left: 4px; }

        /* ── MAIN LAYOUT ── */
        .dl-container {
          flex: 1;
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 2.5rem 2rem;
          gap: 4rem;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .dl-container { flex-direction: column; gap: 2.5rem; padding: 2rem 1rem; }
          .dl-side { text-align: center; align-items: center !important; }
        }

        /* ── LEFT SIDE ── */
        .dl-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .dl-side-eyebrow {
          font-size: 0.75rem; font-weight: 700; color: #0B8A6C;
          background: #EDFBF7; border: 1px solid #B7EDD9;
          padding: 6px 14px; border-radius: 20px;
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;
        }
        .dl-side-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 3rem; line-height: 1.1; color: #0D1621; margin-bottom: 1.5rem;
        }
        .dl-side-heading em { font-style: italic; color: #0B4F6C; }
        .dl-side-sub { font-size: 1.05rem; color: #5A6478; line-height: 1.6; margin-bottom: 2rem; max-width: 500px; }
        
        .dl-feature-list {
          display: grid; grid-template-columns: 1fr; gap: 0.75rem; width: 100%; max-width: 480px;
        }
        .dl-feature-item {
          background: #fff; border: 1px solid #E2E6EE; padding: 0.85rem 1rem; border-radius: 12px;
          display: flex; gap: 12px; align-items: center; font-size: 0.85rem; font-weight: 500; color: #344054;
        }

        /* ── RIGHT SIDE (FORM) ── */
        .dl-form-section {
          flex: 1;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .dl-card {
          background: #fff;
          border: 1px solid #E2E6EE;
          border-radius: 24px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .dl-card-header {
          background: linear-gradient(135deg, #0B4F6C 0%, #062D40 100%);
          padding: 2.25rem 2rem;
          text-align: center;
          color: #fff;
        }
        .dl-card-title { font-family: 'DM Serif Display', serif; font-size: 1.75rem; margin-top: 0.75rem; }
        .dl-card-desc { font-size: 0.85rem; opacity: 0.7; margin-top: 0.4rem; }

        .dl-form-body { padding: 2.25rem 2rem; }

        /* ── INPUTS ── */
        .dl-field { margin-bottom: 1.25rem; }
        .dl-label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #5A6478; margin-bottom: 0.5rem; }
        .dl-input-wrap { position: relative; }
        .dl-input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #B0BAC9; }
        .dl-input {
          width: 100%; height: 50px; border: 1px solid #DDE1E9; border-radius: 12px;
          padding: 0 1rem 0 3rem; font-size: 0.95rem; background: #FAFBFD; transition: all 0.2s;
        }
        .dl-input:focus { border-color: #0B4F6C; background: #fff; box-shadow: 0 0 0 4px rgba(11,79,108,0.08); outline: none; }
        
        .dl-submit-btn {
          width: 100%; height: 50px; background: #0B4F6C; color: #fff; border: none;
          border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 1rem;
        }
        .dl-submit-btn:hover { background: #093D56; transform: translateY(-1px); }

        .dl-alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .dl-alert-error { background: #FFF1F0; border: 1px solid #FFCCC7; color: #CF1322; }
        .dl-alert-success { background: #EDFBF7; border: 1px solid #B7EDD9; color: #0B6B50; }

        /* ── FOOTER ── */
        .dl-page-footer {
          background: #fff; border-top: 1px solid #E2E6EE;
          padding: 1.5rem 5%;
          display: flex; justify-content: space-between;
          font-size: 0.8rem; color: #8C96A8;
        }
      `}</style>

      <div className="dl-root">
        <nav className="dl-nav">
          <Link to="/" className="dl-nav-brand">
            <div className="dl-nav-icon"><Heart size={20} color="#fff" fill="#fff" /></div>
            <div>
              <div className="dl-nav-title">HealthTrack</div>
              <div className="dl-nav-sub">Practice Management</div>
            </div>
          </Link>
          <Link to="/doctor/register" className="dl-nav-link">
            Need an account? <strong>Register here</strong>
          </Link>
        </nav>

        <main className="dl-container">
          {/* Left Side: Context & Info */}
          <section className="dl-side">
            <div className="dl-side-eyebrow">
              <Shield size={14} />
              AUTHORIZED MEDICAL PERSONNEL ONLY
            </div>
            <h1 className="dl-side-heading">
              Manage your practice<br /><em>with precision.</em>
            </h1>
            <p className="dl-side-sub">
              Access clinical tools, patient longitudinal records, and health analytics in a HIPAA-compliant environment.
            </p>
            
            <div className="dl-feature-list">
              {[
                "Comprehensive Patient Dashboards",
                "Automated Health Analytics & Alerts",
                "Telemedicine & Secure Messaging",
                "Lab Integration & E-Prescriptions",
                "End-to-end HIPAA Data Encryption"
              ].map((text, i) => (
                <div key={i} className="dl-feature-item">
                  <div style={{ color: '#0B8A6C' }}><Loader2 size={16} /></div>
                  {text}
                </div>
              ))}
            </div>
          </section>

          {/* Right Side: Login Form */}
          <section className="dl-form-section">
            <div className="dl-card">
              <div className="dl-card-header">
                <Stethoscope size={36} color="#fff" style={{ margin: '0 auto' }} />
                <h2 className="dl-card-title">Doctor Portal</h2>
                <p className="dl-card-desc">Enter your medical credentials to continue</p>
              </div>

              <div className="dl-form-body">
                {submitMessage && (
                  <div className={`dl-alert ${submitMessage.type === 'error' ? 'dl-alert-error' : 'dl-alert-success'}`}>
                    {submitMessage.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="dl-field">
                    <label className="dl-label">Medical Email</label>
                    <div className="dl-input-wrap">
                      <Mail className="dl-input-icon" size={18} />
                      <input
                        type="email"
                        placeholder="dr.name@hospital.com"
                        className={`dl-input ${errors.email ? 'border-red-500' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <div style={{color: '#FF4D4F', fontSize: '0.75rem', marginTop: '4px'}}>{errors.email}</div>}
                  </div>

                  <div className="dl-field">
                    <label className="dl-label">Password</label>
                    <div className="dl-input-wrap">
                      <Lock className="dl-input-icon" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`dl-input ${errors.password ? 'border-red-500' : ''}`}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#B0BAC9' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#5A6478', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.rememberMe}
                        onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                        style={{ accentColor: '#0B4F6C' }}
                      />
                      Remember Me
                    </label>
                    <Link to="/doctor/forgot-password" style={{ fontSize: '0.8rem', color: '#0B4F6C', textDecoration: 'none', fontWeight: 600 }}>
                      Forgot password?
                    </Link>
                  </div>

                  <button type="submit" className="dl-submit-btn" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Access Medical Portal"}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2rem 0', color: '#B0BAC9', fontSize: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EDF0F5' }} />
                  OR
                  <div style={{ flex: 1, height: '1px', background: '#EDF0F5' }} />
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#5A6478' }}>
                  <p>Are you a patient? <Link to="/patient/login" style={{ color: '#0B4F6C', fontWeight: 600, textDecoration: 'none' }}>Patient Login</Link></p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="dl-page-footer">
          <div>© 2026 HealthTrack Systems. Secure Medical Access Port.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>HIPAA Compliant</span>
            <span>Privacy Guard</span>
          </div>
        </footer>
      </div>
    </>
  );
}