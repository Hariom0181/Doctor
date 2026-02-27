import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function PatientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (submitMessage) {
      setSubmitMessage(null);
    }
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
      await login(formData.email, formData.password, 'patient');
      setSubmitMessage({ type: 'success', message: "Login successful! Redirecting..." });
      setTimeout(() => navigate("/patient/dashboard"), 1000);
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

        .pl-root {
          min-height: 100vh;
          background: #F2F4F7;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── NAV ── */
        .pl-nav {
          background: #fff;
          border-bottom: 1px solid #E2E6EE;
          padding: 0 5%;
          height: 70px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .pl-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .pl-nav-icon {
          width: 40px; height: 40px; background: #0B4F6C;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .pl-nav-title { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: #0B4F6C; margin-bottom: -2px; }
        .pl-nav-sub { font-size: 0.75rem; color: #8C96A8; }
        .pl-nav-link { font-size: 0.9rem; color: #5A6478; text-decoration: none; }
        .pl-nav-link strong { color: #0B4F6C; margin-left: 4px; }

        /* ── MAIN LAYOUT ── */
        .pl-container {
          flex: 1;
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 2rem;
          gap: 4rem;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .pl-container { flex-direction: column; justify-content: center; gap: 2rem; padding: 2rem 1rem; }
          .pl-side { text-align: center; align-items: center !important; }
        }

        /* ── LEFT SIDE ── */
        .pl-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .pl-side-eyebrow {
          font-size: 0.75rem; font-weight: 700; color: #0B8A6C;
          background: #EDFBF7; border: 1px solid #B7EDD9;
          padding: 6px 14px; border-radius: 20px;
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;
        }
        .pl-side-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 3rem; line-height: 1.1; color: #0D1621; margin-bottom: 1.5rem;
        }
        .pl-side-heading em { font-style: italic; color: #0B4F6C; }
        .pl-side-sub { font-size: 1.1rem; color: #5A6478; line-height: 1.6; margin-bottom: 2.5rem; max-width: 500px; }
        
        .pl-features-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%;
        }
        .pl-feature {
          background: #fff; border: 1px solid #E2E6EE; padding: 1rem; border-radius: 16px;
          display: flex; gap: 12px; align-items: center;
        }
        .pl-feature-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── RIGHT SIDE (FORM) ── */
        .pl-form-section {
          flex: 1;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .pl-card {
          background: #fff;
          border: 1px solid #E2E6EE;
          border-radius: 24px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .pl-card-header {
          background: linear-gradient(135deg, #0B4F6C 0%, #062D40 100%);
          padding: 2.5rem 2rem;
          text-align: center;
          color: #fff;
        }
        .pl-card-title { font-family: 'DM Serif Display', serif; font-size: 1.75rem; margin-top: 0.75rem; }
        .pl-card-desc { font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem; }

        .pl-form-body { padding: 2.5rem 2rem; }

        /* ── INPUTS ── */
        .pl-field { margin-bottom: 1.25rem; }
        .pl-label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #5A6478; margin-bottom: 0.5rem; }
        .pl-input-wrap { position: relative; }
        .pl-input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #B0BAC9; }
        .pl-input {
          width: 100%; height: 52px; border: 1px solid #DDE1E9; border-radius: 12px;
          padding: 0 1rem 0 3rem; font-size: 0.95rem; background: #FAFBFD; transition: all 0.2s;
        }
        .pl-input:focus { border-color: #0B4F6C; background: #fff; box-shadow: 0 0 0 4px rgba(11,79,108,0.08); outline: none; }
        .pl-input.has-error { border-color: #FF4D4F; background: #FFF2F0; }
        
        .pl-submit-btn {
          width: 100%; height: 52px; background: #0B4F6C; color: #fff; border: none;
          border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 1rem;
        }
        .pl-submit-btn:hover { background: #093D56; transform: translateY(-1px); }

        .pl-alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.85rem; }
        .pl-alert-error { background: #FFF1F0; border: 1px solid #FFCCC7; color: #CF1322; }
        .pl-alert-success { background: #EDFBF7; border: 1px solid #B7EDD9; color: #0B6B50; }

        /* ── FOOTER ── */
        .pl-page-footer {
          background: #fff; border-top: 1px solid #E2E6EE;
          padding: 1.5rem 5%;
          display: flex; justify-content: space-between;
          font-size: 0.8rem; color: #8C96A8;
        }
      `}</style>

      <div className="pl-root">
        <nav className="pl-nav">
          <Link to="/" className="pl-nav-brand">
            <div className="pl-nav-icon"><Heart size={20} color="#fff" fill="#fff" /></div>
            <div>
              <div className="pl-nav-title">HealthTrack</div>
              <div className="pl-nav-sub">Patient Management System</div>
            </div>
          </Link>
          <Link to="/patient/register" className="pl-nav-link">
            New here? <strong>Create account</strong>
          </Link>
        </nav>

        <main className="pl-container">
          {/* Left: Branding & Info */}
          <section className="pl-side">
            <div className="pl-side-eyebrow">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0B8A6C' }} />
              SECURE PATIENT PORTAL
            </div>
            <h1 className="pl-side-heading">
              Your health journey,<br /><em>simplified.</em>
            </h1>
            <p className="pl-side-sub">
              Access your medical records, coordinate with doctors, and manage your wellness from a single, secure dashboard.
            </p>
            
            <div className="pl-features-grid">
              {[
                { icon: "📋", bg: "#EDF4FF", text: "Medical History" },
                { icon: "📥", bg: "#EDFBF7", text: "Instant Reports" },
                { icon: "📅", bg: "#FFF7E6", text: "Appointments" },
                { icon: "🚨", bg: "#FFF1F0", text: "Emergency Info" },
              ].map((f, i) => (
                <div key={i} className="pl-feature">
                  <div className="pl-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Login Form */}
          <section className="pl-form-section">
            <div className="pl-card">
              <div className="pl-card-header">
                <Heart size={32} color="#fff" style={{ margin: '0 auto' }} />
                <h2 className="pl-card-title">Welcome Back</h2>
                <p className="pl-card-desc">Sign in to your patient account</p>
              </div>

              <div className="pl-form-body">
                {submitMessage && (
                  <div className={`pl-alert ${submitMessage.type === 'error' ? 'pl-alert-error' : 'pl-alert-success'}`}>
                    {submitMessage.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="pl-field">
                    <label className="pl-label">Email Address</label>
                    <div className="pl-input-wrap">
                      <Mail className="pl-input-icon" size={18} />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        className={`pl-input ${errors.email ? 'has-error' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <div style={{color: '#FF4D4F', fontSize: '0.75rem', marginTop: '4px'}}>{errors.email}</div>}
                  </div>

                  <div className="pl-field">
                    <label className="pl-label">Password</label>
                    <div className="pl-input-wrap">
                      <Lock className="pl-input-icon" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-input ${errors.password ? 'has-error' : ''}`}
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

                  <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                    <Link to="/patient/forgot-password" style={{ fontSize: '0.8rem', color: '#0B4F6C', textDecoration: 'none', fontWeight: 500 }}>
                      Forgot password?
                    </Link>
                  </div>

                  <button type="submit" className="pl-submit-btn" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In to Portal"}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2rem 0', color: '#B0BAC9', fontSize: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EDF0F5' }} />
                  OR
                  <div style={{ flex: 1, height: '1px', background: '#EDF0F5' }} />
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#5A6478' }}>
                  <p>Are you a healthcare provider? <Link to="/doctor/login" style={{ color: '#0B4F6C', fontWeight: 600, textDecoration: 'none' }}>Doctor Login</Link></p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="pl-page-footer">
          <div>© 2026 HealthTrack Systems. All data encrypted.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </footer>
      </div>
    </>
  );
}