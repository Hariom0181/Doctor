import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart, Users, FileText, TrendingUp, Calendar, Phone, Mail,
  MapPin, Search, AlertCircle, ChevronRight, Activity as ActivityIcon,
  ShieldCheck, ArrowUpRight
} from "lucide-react";
import { dashboardApi } from "@/services/dashboardApi";

interface HealthRecord { id: string; examination_type: string; diagnosis: string; prescription: string; next_checkup_date: string; created_at: string; doctor_name: string; specialization: string; }
interface PatientData { id: number; firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; bloodGroup: string; address: string; city: string; state: string; }
interface DashboardStats { totalPatients: number; totalRecords: number; totalDoctors: number; moneySaved: number; avoidedCheckups: number; }
interface Activity { id: number; type: string; patientName: string; doctorName: string; timestamp: string; }
interface DiagnosisAnalytic { examination_type: string; count: number; percentage: number; }

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientRecords, setPatientRecords] = useState<HealthRecord[]>([]);
  const [searchResults, setSearchResults] = useState<PatientData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalPatients: 0, totalRecords: 0, totalDoctors: 0, moneySaved: 0, avoidedCheckups: 0 });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [diagnosisAnalytics, setDiagnosisAnalytics] = useState<DiagnosisAnalytic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivities();
    loadDiagnosisAnalytics();
  }, []);

  const loadDashboardStats = async () => {
    try { const response = await dashboardApi.getStats(); if (response.success) setStats(response.data); } catch (err) { console.error(err); }
  };
  const loadRecentActivities = async () => {
    try { const response = await dashboardApi.getRecentActivities(); if (response.success) setRecentActivities(response.data); } catch (err) { console.error(err); }
  };
  const loadDiagnosisAnalytics = async () => {
    try { const response = await dashboardApi.getDiagnosisAnalytics(); if (response.success) setDiagnosisAnalytics(response.data); } catch (err) { console.error(err); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setError("Please enter a search term"); return; }
    setLoading(true); setError(null);
    try {
      const response = await dashboardApi.searchPatients(searchQuery);
      if (response.success) {
        setSearchResults(response.data);
        if (response.data.length === 1) handleSelectPatient(response.data[0].id);
      }
    } catch (err) { setError("Failed to search patients."); } finally { setLoading(false); }
  };

  const handleSelectPatient = async (patientId: number) => {
    setLoading(true); setError(null);
    try {
      const response = await dashboardApi.getPatientDetails(patientId.toString());
      if (response.success) {
        setSelectedPatient(response.data.patient);
        setPatientRecords(response.data.records);
        setSearchResults([]);
      }
    } catch (err) { setError("Failed to load patient details."); } finally { setLoading(false); }
  };

  const getStatusColor = (diagnosis: string) => {
    const lower = diagnosis.toLowerCase();
    if (lower.includes("critical") || lower.includes("severe")) return "critical";
    if (lower.includes("attention") || lower.includes("elevated")) return "warning";
    return "stable";
  };

  const timeAgo = (date: string) => {
    const diffMs = new Date().getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const statusStyles: Record<string, string> = {
    critical: "bg-red-50 text-red-700 border border-red-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    stable: "bg-teal-50 text-teal-700 border border-teal-200",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ht-root {
          min-height: 100vh;
          background: #F2F4F7;
          font-family: 'DM Sans', sans-serif;
          color: #1A1F2E;
        }

        /* ── NAV ── */
        .ht-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #E2E6EE;
          padding: 0 2rem;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ht-nav-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .ht-nav-icon {
          width: 36px; height: 36px;
          background: #0B4F6C;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .ht-nav-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.25rem;
          color: #0B4F6C;
          letter-spacing: -0.02em;
        }
        .ht-nav-links {
          display: flex; align-items: center; gap: 2rem;
        }
        .ht-nav-links a {
          font-size: 0.875rem; font-weight: 500; color: #5A6478;
          text-decoration: none; transition: color 0.15s;
        }
        .ht-nav-links a.active, .ht-nav-links a:hover { color: #0B4F6C; }
        .ht-nav-actions {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .ht-btn-ghost {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          color: #5A6478; padding: 0.5rem 1rem; border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .ht-btn-ghost:hover { background: #F2F4F7; color: #0B4F6C; }
        .ht-btn-primary {
          background: #0B4F6C; color: #fff; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
          padding: 0.5rem 1.25rem; border-radius: 8px;
          transition: background 0.15s;
        }
        .ht-btn-primary:hover { background: #093D56; }

        /* ── MAIN ── */
        .ht-main { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }

        /* ── HERO HEADER ── */
        .ht-hero {
          display: grid; grid-template-columns: 1fr auto;
          align-items: end; gap: 2rem;
          margin-bottom: 2.5rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid #DDE1E9;
        }
        .ht-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: #0B8A6C;
          background: #EDFBF7; border: 1px solid #B7EDD9;
          padding: 4px 12px; border-radius: 20px;
          margin-bottom: 1rem;
        }
        .ht-hero-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 2.75rem; line-height: 1.1; letter-spacing: -0.03em;
          color: #0D1621;
          margin-bottom: 0.75rem;
        }
        .ht-hero-heading em { font-style: italic; color: #0B4F6C; }
        .ht-hero-sub {
          font-size: 1rem; color: #5A6478; line-height: 1.65;
          max-width: 540px; font-weight: 300;
        }
        .ht-hero-meta {
          display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;
          text-align: right;
        }
        .ht-hero-meta-label { font-size: 0.75rem; color: #8C96A8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
        .ht-hero-meta-val { font-family: 'DM Serif Display', serif; font-size: 2rem; color: #0B4F6C; }

        /* ── STAT CARDS ── */
        .ht-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 900px) { .ht-stats-grid { grid-template-columns: repeat(2,1fr); } }
        .ht-stat-card {
          background: #fff;
          border: 1px solid #E2E6EE;
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .ht-stat-card:hover { box-shadow: 0 8px 32px rgba(11,79,108,0.10); transform: translateY(-2px); }
        .ht-stat-label {
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.07em; color: #8C96A8; margin-bottom: 0.5rem;
        }
        .ht-stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; color: #0D1621; line-height: 1;
        }
        .ht-stat-value.accent { color: #0B4F6C; }
        .ht-stat-value.green { color: #0B8A6C; }
        .ht-stat-icon {
          position: absolute; right: 1.25rem; top: 1.25rem;
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .ht-stat-trend {
          margin-top: 0.75rem; font-size: 0.8rem; font-weight: 500;
          color: #0B8A6C; display: flex; align-items: center; gap: 4px;
        }

        /* ── TABS ── */
        .ht-tabs-bar {
          display: flex; gap: 0.25rem;
          background: #E8ECF2; border-radius: 12px; padding: 4px;
          width: fit-content; margin-bottom: 1.5rem;
        }
        .ht-tab-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          color: #5A6478; padding: 0.5rem 1.25rem; border-radius: 9px;
          transition: all 0.15s;
        }
        .ht-tab-btn.active {
          background: #fff; color: #0B4F6C; font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }

        /* ── SEARCH PANEL ── */
        .ht-search-panel {
          background: #fff; border: 1px solid #E2E6EE; border-radius: 20px;
          overflow: hidden;
        }
        .ht-search-hero {
          background: linear-gradient(135deg, #0B4F6C 0%, #093D56 60%, #062D40 100%);
          padding: 2.5rem 2.5rem 2rem;
          position: relative; overflow: hidden;
        }
        .ht-search-hero::before {
          content: '';
          position: absolute; right: -60px; bottom: -60px;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          border-radius: 50%;
        }
        .ht-search-hero-tag {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #7DD5F7; margin-bottom: 0.5rem;
        }
        .ht-search-hero h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.75rem; color: #fff; margin-bottom: 0.35rem; letter-spacing: -0.02em;
        }
        .ht-search-hero p { font-size: 0.875rem; color: rgba(255,255,255,0.5); margin-bottom: 1.5rem; }
        .ht-search-row { display: flex; gap: 0.75rem; position: relative; z-index: 1; }
        .ht-search-input-wrap { flex: 1; position: relative; }
        .ht-search-input-wrap svg {
          position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.4); pointer-events: none;
        }
        .ht-search-input {
          width: 100%; height: 48px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px; padding: 0 1rem 0 2.75rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: #fff;
          outline: none; transition: border-color 0.15s, background 0.15s;
        }
        .ht-search-input::placeholder { color: rgba(255,255,255,0.38); }
        .ht-search-input:focus { border-color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.15); }
        .ht-search-btn {
          height: 48px; padding: 0 1.75rem;
          background: #0EB07A; color: #fff; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
          border-radius: 10px; white-space: nowrap;
          transition: background 0.15s;
        }
        .ht-search-btn:hover { background: #0C9A6A; }
        .ht-search-btn:disabled { opacity: 0.6; }

        /* ── ERROR ── */
        .ht-error {
          margin: 1.5rem 2rem; padding: 0.875rem 1.25rem;
          background: #FFF1F0; border: 1px solid #FFCCC7;
          border-radius: 10px; color: #CF1322;
          font-size: 0.875rem; display: flex; align-items: center; gap: 8px;
        }

        /* ── SEARCH RESULTS ── */
        .ht-results { padding: 1.5rem 2rem; }
        .ht-results-label {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #8C96A8; margin-bottom: 1rem;
        }
        .ht-result-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem; border: 1px solid #EDF0F5; border-radius: 12px;
          cursor: pointer; transition: all 0.15s; margin-bottom: 0.5rem;
          background: #FAFBFC;
        }
        .ht-result-row:hover { background: #fff; border-color: #0B4F6C; box-shadow: 0 0 0 3px rgba(11,79,108,0.07); }
        .ht-result-avatar {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #D6E8F0, #B8D4E3);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 700; color: #0B4F6C; flex-shrink: 0;
        }
        .ht-result-name { font-weight: 600; font-size: 0.95rem; color: #0D1621; }
        .ht-result-meta { font-size: 0.8rem; color: #8C96A8; margin-top: 2px; }

        /* ── PATIENT DETAIL ── */
        .ht-patient-detail { padding: 2rem 2.5rem; }
        .ht-patient-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1.5rem; padding-bottom: 1.75rem;
          border-bottom: 1px solid #EDF0F5; margin-bottom: 2rem;
        }
        .ht-patient-name-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .ht-patient-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.875rem; color: #0D1621; letter-spacing: -0.02em;
        }
        .ht-blood-badge {
          background: #FFF7E6; color: #D46B08; border: 1px solid #FFD591;
          font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 6px;
        }
        .ht-contact-strip {
          display: flex; flex-wrap: wrap; gap: 1.25rem;
          font-size: 0.825rem; color: #5A6478;
        }
        .ht-contact-strip span { display: flex; align-items: center; gap: 6px; }
        .ht-contact-strip svg { color: #0B4F6C; flex-shrink: 0; }
        .ht-download-btn {
          background: #F2F4F7; color: #0B4F6C; border: 1px solid #DDE1E9;
          font-family: 'DM Sans', sans-serif; font-size: 0.825rem; font-weight: 600;
          padding: 0.5rem 1.25rem; border-radius: 8px; cursor: pointer;
          white-space: nowrap; flex-shrink: 0;
          transition: all 0.15s;
        }
        .ht-download-btn:hover { background: #E3E8F0; }

        /* ── RECORDS ── */
        .ht-records-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: #5A6478; margin-bottom: 1rem;
        }
        .ht-records-header svg { color: #0B4F6C; }
        .ht-records-grid { display: grid; gap: 1rem; }
        .ht-record-card {
          border: 1px solid #E8ECF2; border-radius: 14px;
          background: #FAFBFD; overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .ht-record-card:hover { box-shadow: 0 4px 20px rgba(11,79,108,0.09); }
        .ht-record-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.25rem 1.5rem 0;
        }
        .ht-record-type { font-size: 1rem; font-weight: 700; color: #0D1621; }
        .ht-record-doctor { font-size: 0.775rem; color: #8C96A8; margin-top: 2px; }
        .ht-status-pill {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; padding: 4px 10px; border-radius: 20px;
          flex-shrink: 0;
        }
        .ht-diagnosis-box {
          margin: 1rem 1.5rem;
          background: #fff; border: 1px solid #EDF0F5; border-radius: 10px;
          padding: 0.875rem 1rem;
          font-size: 0.875rem; color: #3A4255; line-height: 1.6;
        }
        .ht-diagnosis-box strong { 
          display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: #0B4F6C; margin-bottom: 4px;
        }
        .ht-record-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1.5rem;
          border-top: 1px solid #EDF0F5;
          font-size: 0.775rem; color: #8C96A8;
        }
        .ht-checkup-badge {
          background: #EDF7FF; color: #0B4F6C; border: 1px solid #C2DFF0;
          font-weight: 600; padding: 3px 10px; border-radius: 6px;
        }

        /* ── SYSTEM PULSE ── */
        .ht-pulse-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        @media (max-width: 900px) { .ht-pulse-grid { grid-template-columns: 1fr; } }
        .ht-card {
          background: #fff; border: 1px solid #E2E6EE; border-radius: 20px;
          overflow: hidden;
        }
        .ht-card-header {
          padding: 1.5rem 1.75rem 1.25rem;
          border-bottom: 1px solid #F0F2F7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ht-card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem; color: #0D1621; letter-spacing: -0.01em;
        }
        .ht-card-sub { font-size: 0.8rem; color: #8C96A8; margin-top: 2px; }
        .ht-card-body { padding: 1.5rem 1.75rem; }

        /* ── ACTIVITY FEED ── */
        .ht-activity-item {
          display: flex; gap: 1rem;
          padding: 0.875rem 0;
          border-bottom: 1px solid #F4F5F8;
        }
        .ht-activity-item:last-child { border-bottom: none; }
        .ht-activity-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .ht-activity-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #0B4F6C; border: 2px solid #D6E8F0; flex-shrink: 0;
          margin-top: 4px;
        }
        .ht-activity-type { font-size: 0.875rem; font-weight: 600; color: #0D1621; }
        .ht-activity-patient { color: #0B4F6C; }
        .ht-activity-meta { font-size: 0.775rem; color: #8C96A8; margin-top: 2px; }
        .ht-activity-time {
          margin-left: auto; font-size: 0.75rem; color: #B0BAC9;
          white-space: nowrap; padding-top: 2px;
        }

        /* ── NETWORK CARD ── */
        .ht-network-card {
          background: linear-gradient(160deg, #0B4F6C 0%, #062D40 100%);
          border-radius: 20px; padding: 2rem; color: #fff; height: 100%;
        }
        .ht-network-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem; margin-bottom: 4px; letter-spacing: -0.01em;
        }
        .ht-network-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 2rem; }
        .ht-network-count {
          font-family: 'DM Serif Display', serif;
          font-size: 4rem; line-height: 1; margin-bottom: 0.35rem;
        }
        .ht-network-label { font-size: 0.8rem; color: rgba(255,255,255,0.55); margin-bottom: 2rem; }
        .ht-uptime-row {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px; padding: 1rem 1.25rem;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ht-uptime-label { font-size: 0.8rem; color: rgba(255,255,255,0.55); }
        .ht-uptime-badge {
          background: rgba(14,176,122,0.2); color: #5EEAC5;
          border: 1px solid rgba(14,176,122,0.3);
          font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 20px;
        }

        /* ── ANALYTICS ── */
        .ht-analytics-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 2rem; }
        @media (max-width: 900px) { .ht-analytics-grid { grid-template-columns: 1fr; } }
        .ht-progress-label {
          display: flex; justify-content: space-between;
          font-size: 0.875rem; margin-bottom: 0.5rem;
        }
        .ht-progress-name { font-weight: 500; color: #2D3648; }
        .ht-progress-pct { color: #8C96A8; font-weight: 500; font-variant-numeric: tabular-nums; }
        .ht-progress-bar {
          height: 8px; background: #EDF0F5; border-radius: 4px; overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .ht-progress-fill {
          height: 100%; background: linear-gradient(90deg, #0B4F6C, #0EB07A);
          border-radius: 4px; transition: width 0.6s ease;
        }
        .ht-impact-card {
          background: #F8FAFF; border: 1px solid #E2E6EE; border-radius: 18px;
          padding: 2.25rem; text-align: center; display: flex; flex-direction: column;
          justify-content: center; align-items: center;
        }
        .ht-impact-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8C96A8; margin-bottom: 0.5rem; }
        .ht-impact-value {
          font-family: 'DM Serif Display', serif;
          font-size: 2.75rem; color: #0B4F6C; line-height: 1;
          margin-bottom: 1.25rem;
        }
        .ht-growth-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #EDFBF7; color: #0B8A6C; border: 1px solid #B7EDD9;
          font-size: 0.8rem; font-weight: 700; padding: 6px 14px; border-radius: 20px;
        }

        /* ── FOOTER ── */
        .ht-footer {
          background: #fff; border-top: 1px solid #E2E6EE;
          padding: 1.75rem 2rem;
          display: flex; justify-content: space-between; align-items: center;
          gap: 1.5rem; flex-wrap: wrap;
        }
        .ht-footer-brand { display: flex; align-items: center; gap: 8px; color: #8C96A8; font-size: 0.825rem; }
        .ht-footer-contacts { display: flex; gap: 2rem; }
        .ht-footer-contact { display: flex; align-items: center; gap: 8px; font-size: 0.825rem; color: #5A6478; }
        .ht-footer-contact svg { color: #0B4F6C; }
      `}</style>

      <div className="ht-root">
        {/* ── Navigation ── */}
        <nav className="ht-nav">
          <div className="ht-nav-brand">
            <div className="ht-nav-icon">
              <Heart size={18} color="#fff" />
            </div>
            <span className="ht-nav-title">HealthTrack</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Doctor Portal - Highlighted with a Soft Glass/Tint effect */}
            <Link to="/doctor/login">
              <button className="
      px-5 py-2.5 text-sm font-bold text-indigo-700 
      bg-indigo-50 hover:bg-indigo-100 
      border border-indigo-200/50 rounded-xl 
      shadow-sm hover:shadow-md hover:-translate-y-0.5
      transition-all duration-200 active:scale-95
    ">
                Doctor Portal
              </button>
            </Link>

            {/* Subtle Divider */}
            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />

            {/* Sign In - Sophisticated Dark Highlight */}
            <Link to="/patient/login">
              <button className="
      px-6 py-2.5 text-sm font-bold text-white 
      bg-slate-900 hover:bg-slate-800 
      rounded-xl shadow-lg shadow-slate-200 
      hover:shadow-xl hover:-translate-y-0.5
      active:scale-95 transition-all duration-200
    ">
                Sign In
              </button>
            </Link>

            {/* Nurse Register - Vibrant Brand Highlight */}
            <Link to="/nurse-register">
              <Button className="
      px-6 py-2.5 text-sm font-bold text-white 
      bg-indigo-600 hover:bg-indigo-500 
      rounded-xl shadow-lg shadow-indigo-100 
      hover:shadow-xl hover:-translate-y-0.5
      active:scale-95 transition-all duration-200 border-none
    ">
                Nurse Register
              </Button>
            </Link>
          </div>
        </nav>

        <main className="ht-main">
          {/* ── Hero Header ── */}
          <div className="ht-hero">
            <div>
              <div className="ht-hero-eyebrow">
                <ShieldCheck size={13} />
                Secure Health Information System
              </div>
              <h1 className="ht-hero-heading">
                Rural Healthcare,<br /><em>Centralised.</em>
              </h1>
              <p className="ht-hero-sub">
                Track diagnostics, eliminate redundant testing, and give every patient a complete, portable health record — wherever they go.
              </p>
            </div>
            <div className="ht-hero-meta">
              <span className="ht-hero-meta-label">Serving Since</span>
              <span className="ht-hero-meta-val">2022</span>
              <span style={{ fontSize: '0.75rem', color: '#8C96A8' }}>Across {stats.totalDoctors}+ providers</span>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="ht-stats-grid">
            <div className="ht-stat-card">
              <div className="ht-stat-icon" style={{ background: '#EDF4FF' }}>
                <Users size={18} color="#0B4F6C" />
              </div>
              <div className="ht-stat-label">Total Patients</div>
              <div className="ht-stat-value accent">{stats.totalPatients.toLocaleString('en-IN')}</div>
              <div className="ht-stat-trend"><ArrowUpRight size={14} /> Active registrations</div>
            </div>
            <div className="ht-stat-card">
              <div className="ht-stat-icon" style={{ background: '#F4F0FF' }}>
                <FileText size={18} color="#6B3FA0" />
              </div>
              <div className="ht-stat-label">Health Records</div>
              <div className="ht-stat-value" style={{ color: '#6B3FA0' }}>{stats.totalRecords.toLocaleString('en-IN')}</div>
              <div className="ht-stat-trend" style={{ color: '#6B3FA0' }}><ArrowUpRight size={14} /> Documented cases</div>
            </div>
            <div className="ht-stat-card">
              <div className="ht-stat-icon" style={{ background: '#EDFBF7' }}>
                <TrendingUp size={18} color="#0B8A6C" />
              </div>
              <div className="ht-stat-label">Financial Relief</div>
              <div className="ht-stat-value green">₹{(stats.moneySaved / 1000).toFixed(1)}K</div>
              <div className="ht-stat-trend"><ArrowUpRight size={14} /> Saved by patients</div>
            </div>
            <div className="ht-stat-card">
              <div className="ht-stat-icon" style={{ background: '#FFF7E6' }}>
                <Calendar size={18} color="#D46B08" />
              </div>
              <div className="ht-stat-label">Tests Avoided</div>
              <div className="ht-stat-value" style={{ color: '#D46B08' }}>{stats.avoidedCheckups.toLocaleString('en-IN')}</div>
              <div className="ht-stat-trend" style={{ color: '#D46B08' }}><ArrowUpRight size={14} /> Redundant checkups</div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="ht-tabs-bar" style={{ background: '#E8ECF2', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px', width: 'fit-content', marginBottom: '1.5rem' }}>
              <TabsTrigger value="search" style={{ fontFamily: "'DM Sans',sans-serif" }}>Patient Search</TabsTrigger>
              <TabsTrigger value="dashboard" style={{ fontFamily: "'DM Sans',sans-serif" }}>System Pulse</TabsTrigger>
              <TabsTrigger value="reports" style={{ fontFamily: "'DM Sans',sans-serif" }}>Analytics</TabsTrigger>
            </TabsList>

            {/* ── Search Tab ── */}
            <TabsContent value="search">
              <div className="ht-search-panel">
                <div className="ht-search-hero">
                  <div className="ht-search-hero-tag">Patient Record Retrieval</div>
                  <h2>Search Clinical Database</h2>
                  <p>Enter name, phone number, or patient ID to pull complete history</p>
                  <div className="ht-search-row">
                    <div className="ht-search-input-wrap">
                      <Search size={16} />
                      <input
                        className="ht-search-input"
                        placeholder="Name, phone, or patient ID…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <button className="ht-search-btn" onClick={handleSearch} disabled={loading}>
                      {loading ? "Searching…" : "Search Database"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="ht-error">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="ht-results">
                    <div className="ht-results-label">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</div>
                    {searchResults.map((patient) => (
                      <div key={patient.id} className="ht-result-row" onClick={() => handleSelectPatient(patient.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div className="ht-result-avatar">{patient.firstName[0]}{patient.lastName[0]}</div>
                          <div>
                            <div className="ht-result-name">{patient.firstName} {patient.lastName}</div>
                            <div className="ht-result-meta">{patient.phone} &nbsp;·&nbsp; {patient.city}, {patient.state}</div>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#B0BAC9" />
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div className="ht-patient-detail">
                    <div className="ht-patient-header">
                      <div>
                        <div className="ht-patient-name-row">
                          <h3 className="ht-patient-name">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                          <span className="ht-blood-badge">{selectedPatient.bloodGroup || "O+"}</span>
                        </div>
                        <div className="ht-contact-strip">
                          <span><Phone size={13} /> {selectedPatient.phone}</span>
                          <span><Mail size={13} /> {selectedPatient.email}</span>
                          <span><MapPin size={13} /> {selectedPatient.city}, {selectedPatient.state}</span>
                        </div>
                      </div>
                      {/* <button className="ht-download-btn">Download All Records</button> */}
                    </div>

                    <div className="ht-records-header">
                      <FileText size={15} /> Clinical History
                      <span style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#B0BAC9' }}>
                        {patientRecords.length} record{patientRecords.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div>
                      <div className="ht-records-grid">
                        {/* Logic: If showAllRecords is true, show all. Otherwise, slice first 3 */}
                        {(showAllRecords ? patientRecords : patientRecords.slice(0, 3)).map((record) => {
                          const status = getStatusColor(record.diagnosis);
                          return (
                            <div key={record.id} className="ht-record-card">
                              <div className="ht-record-top">
                                <div>
                                  <div className="ht-record-type">{record.examination_type}</div>
                                  <div className="ht-record-doctor">
                                    Dr. {record.doctor_name} &nbsp;·&nbsp; {record.specialization}
                                  </div>
                                </div>
                                <span className={`ht-status-pill ${statusStyles[status]}`}>
                                  {status === 'critical' ? '⚠ Critical' : status === 'warning' ? '• Needs Attention' : '✓ Stable'}
                                </span>
                              </div>
                              <div className="ht-diagnosis-box">
                                <strong>Diagnosis</strong>
                                {record.diagnosis}
                              </div>
                              <div className="ht-record-footer">
                                <span>
                                  Recorded {new Date(record.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Professional "View All" Button */}
                      {patientRecords.length > 3 && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => setShowAllRecords(!showAllRecords)}
                            className="
          flex items-center gap-2 px-6 py-2.5 
          bg-white border border-slate-200 rounded-xl
          text-sm font-semibold text-slate-600
          hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100
          transition-all duration-200 shadow-sm
        "
                          >
                            {showAllRecords ? (
                              <>Show Less</>
                            ) : (
                              <>View All {patientRecords.length} Records</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── System Pulse Tab ── */}
            <TabsContent value="dashboard">
              <div className="ht-pulse-grid">
                <div className="ht-card">
                  <div className="ht-card-header">
                    <div>
                      <div className="ht-card-title">Real-time Activity</div>
                      <div className="ht-card-sub">Live stream of clinical updates</div>
                    </div>
                    <ActivityIcon size={18} color="#DDE1E9" />
                  </div>
                  <div className="ht-card-body">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="ht-activity-item">
                        <div className="ht-activity-dot-wrap">
                          <div className="ht-activity-dot" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="ht-activity-type">
                            {activity.type} — <span className="ht-activity-patient">{activity.patientName}</span>
                          </div>
                          <div className="ht-activity-meta">Dr. {activity.doctorName}</div>
                        </div>
                        <div className="ht-activity-time">{timeAgo(activity.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ht-network-card">
                  <div className="ht-network-title">Provider Network</div>
                  <div className="ht-network-sub">Active medical practitioners</div>
                  <div className="ht-network-count">{stats.totalDoctors}</div>
                  <div className="ht-network-label">Licensed Providers Online</div>
                  <div className="ht-uptime-row">
                    <span className="ht-uptime-label">System Uptime</span>
                    <span className="ht-uptime-badge">99.9% Operational</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Analytics Tab ── */}
            <TabsContent value="reports">
              <div className="ht-card">
                <div className="ht-card-header">
                  <div>
                    <div className="ht-card-title">Impact Metrics</div>
                    <div className="ht-card-sub">System-wide health & financial outcomes</div>
                  </div>
                </div>
                <div className="ht-card-body">
                  <div className="ht-analytics-grid">
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C96A8', marginBottom: '1.5rem' }}>
                        Common Pathologies by Volume
                      </div>
                      {diagnosisAnalytics.map((item, i) => (
                        <div key={i}>
                          <div className="ht-progress-label">
                            <span className="ht-progress-name">{item.examination_type}</span>
                            <span className="ht-progress-pct">{Number(item.percentage).toFixed(1)}%</span>
                          </div>
                          <div className="ht-progress-bar">
                            <div className="ht-progress-fill" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="ht-impact-card">
                      <div className="ht-impact-label">Total Financial Relief</div>
                      <div className="ht-impact-value">₹{Number(stats.moneySaved || 0).toLocaleString('en-IN')}</div>
                      <div className="ht-growth-pill">
                        <ArrowUpRight size={14} /> +12.4% vs last month
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* ── Footer ── */}
        <footer className="ht-footer">
          <div className="ht-footer-brand">
            <Heart size={14} /> © 2026 HealthTrack Systems. All rights reserved.
          </div>
          <div className="ht-footer-contacts">
            <div className="ht-footer-contact"><Phone size={13} /> +91 1800-123-4567</div>
            <div className="ht-footer-contact"><Mail size={13} /> support@healthtrack.in</div>
          </div>
        </footer>
      </div>
    </>
  );
}