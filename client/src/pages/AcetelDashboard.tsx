// @ts-nocheck
import { useState, useEffect, useRef, Fragment } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosInstance";
import {
  ACETEL_COHORTS,
  ACETEL_PROGRAMMES,
  SEMESTER_LABELS,
  parseSemesterValue,
  sortByCohortThenProgramme,
  NON_ADMISSION_REASONS,
  groupItemsByCohortThenProgramme,
  groupCoursesByProgrammeThenSemester,
  progRank,
} from "../constants/institution";
import { useNavigate } from "react-router-dom";
import './AcetelDashboard.css';
import CrossfadeLogo from "../components/CrossfadeLogo";
import LoginModal from "../components/LoginModal";
import { exportGlobalInstitutionalReport } from "../lib/exportService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  RefreshCcw,
  Download,
  Filter,
  Plus,
  MoreVertical,
  LogOut,
  User,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Users as UsersIcon,
  GraduationCap,
  BookOpen,
  Settings as SettingsIcon,
  Shield,
  Activity,
  FileText,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, FunnelChart, Funnel, LabelList
} from "recharts";
import ExportButton from "../components/ExportButton";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
// (Inherited from axiosInstance)

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────

const InstitutionalChartCard = ({ title, children, onExport, lastRefresh, gradient }) => (
  <div style={{ 
    background: gradient ? GRADIENTS[gradient] || '#ffffff' : '#ffffff', 
    border: '1px solid rgba(0,0,0,0.06)', 
    borderRadius: 24, 
    padding: 28, 
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)', 
    position: 'relative',
    overflow: 'hidden'
  }}>
    {gradient && <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative', zIndex: 1 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: gradient ? '#ffffff' : '#1e3a8a', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
        {lastRefresh && <div style={{ fontSize: 10, color: gradient ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 4, fontWeight: 600 }}>Sync: {new Date(lastRefresh).toLocaleTimeString()}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onExport?.('pdf')} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: `1px solid ${gradient ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: gradient ? '#ffffff' : '#64748b', fontWeight: 800, cursor: 'pointer' }}>📄 PDF</button>
        <button onClick={() => onExport?.('png')} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: `1px solid ${gradient ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: gradient ? '#ffffff' : '#64748b', fontWeight: 800, cursor: 'pointer' }}>🖼️ PNG</button>
      </div>
    </div>
    <div style={{ height: 300, position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
);

const KPIItem = ({ label, val, icon, color }) => (
  <div style={{ background: '#fff', padding: 24, borderRadius: 14, border: '1px solid #E5E0D5', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color || '#0B3D2E' }} />
    <div style={{ width: 38, height: 38, borderRadius: 10, background: color === '#C9A227' ? '#FBF3DC' : '#E8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: '#0B3D2E', fontFamily: "'Playfair Display', serif" }}>{val}</div>
  </div>
);

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const initialNationalities = [
  { country: "Ghana", count: 0, lat: 7.9, lng: -1.0 },
  { country: "Nigeria", count: 0, lat: 9.1, lng: 8.7 },
  { country: "Kenya", count: 0, lat: -0.02, lng: 37.9 },
  { country: "Senegal", count: 0, lat: 14.5, lng: -14.5 },
  { country: "Ethiopia", count: 0, lat: 9.1, lng: 40.5 },
  { country: "Côte d'Ivoire", count: 0, lat: 7.5, lng: -5.5 },
  { country: "Tanzania", count: 0, lat: -6.4, lng: 35.0 },
  { country: "Cameroon", count: 0, lat: 3.9, lng: 11.5 },
  { country: "Rwanda", count: 0, lat: -1.9, lng: 29.9 },
  { country: "Uganda", count: 0, lat: 1.4, lng: 32.3 },
];

const initialSemesterDistribution = [
  { semester: "Sem 1", count: 0 },
  { semester: "Sem 2", count: 0 },
  { semester: "Sem 3", count: 0 },
  { semester: "Sem 4", count: 0 },
  { semester: "Sem 5", count: 0 },
  { semester: "Sem 6", count: 0 },
  { semester: "Sem 7", count: 0 },
  { semester: "Sem 8", count: 0 },
  { semester: "Sem 9", count: 0 },
  { semester: "Sem 10", count: 0 },
  { semester: "Sem 11", count: 0 },
  { semester: "Sem 12", count: 0 },
];

const ACETEL_SESSIONS = ["2021_1", "2021_2", "2022_1", "2022_2", "2023_1", "2023_2", "2024_1", "2024_2", "2025_2", "2026_1"];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#f43f5e"];
const GRADIENTS = {
  blue: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  purple: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  pink: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  emerald: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  amber: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
};

const pieData = [];

const graduationPredictions = [
  { year: "2021", predicted: 45, actual: 42 },
  { year: "2022", predicted: 52, actual: 48 },
  { year: "2023", predicted: 65, actual: 61 },
  { year: "2024", predicted: 80, actual: 74 },
  { year: "2025", predicted: 95, actual: 0 }
];

const aiModelAccuracy = [
  { metric: "Graduation Prediction", score: 88 },
  { metric: "At-Risk Detection", score: 92 },
  { metric: "Course Recommendation", score: 85 }
];

const recentStudents = [];

const mockApplications = [];

const mockAlumni = [];

// ─── ROLE DEFINITIONS ────────────────────────────────────────────────────────

const ROLES = {
  admin: {
    label: "System Administrator",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    icon: "🛡️",
    description: "Full system access. Manage users, configure system, view all data.",
    permissions: ["all"],
  },
  coordinator: {
    label: "Programme Coordinator",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.3)",
    icon: "📋",
    description: "Manage programme records, student progress, graduation tracking, course allocation.",
    permissions: ["view_dashboard", "manage_students", "manage_supervisors", "view_admissions", "view_ai", "view_recruitment"],
  },
  faculty: {
    label: "Faculty Officer",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    icon: "🎓",
    description: "Manage student registry, academic status, and departmental records.",
    permissions: ["view_dashboard", "manage_students", "view_admissions", "view_graduation"],
  },
  admissions: {
    label: "Admissions Officer",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    icon: "📥",
    description: "Manage new applications, admission processing, and matriculation.",
    permissions: ["view_dashboard", "manage_admissions", "view_students"],
  },
  technical: {
    label: "Technical Support",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.3)",
    icon: "🛠️",
    description: "System maintenance, user management, and technical troubleshooting.",
    permissions: ["view_dashboard", "manage_users", "view_logs", "view_settings"],
  },
  student: {
    label: "Postgraduate Student",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.3)",
    icon: "👤",
    description: "View enrolment status, registered courses, and academic progress.",
    permissions: ["view_personal_info", "view_courses"],
  }
};

const initialUsers = [
  { id: 1, name: "Dr. Admin", email: "admin@acetel.edu", phone: "+234 800 123 4567", role: "admin", dept: "ICT Support", status: "Active", lastLogin: "Today, 08:30 AM", created: "2023-01-15" },
  { id: 2, name: "Prof. AI", email: "ai_coord@acetel.edu", phone: "+234 800 987 6543", role: "coordinator", dept: "Artificial Intelligence", status: "Active", lastLogin: "2 hours ago", created: "2023-02-10" }
];

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const KPICard = ({ title, value, sub, icon, trend, color, data = [4, 7, 5, 9, 6, 8, 10] }) => (
  <div className="premium-card" style={{
    borderRadius: 20,
    padding: "24px",
    position: "relative",
    cursor: "default",
    display: "flex",
    flexDirection: "column",
    gap: 12
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `1px solid ${color}30`, boxShadow: `0 4px 10px ${color}20` }}>
        {icon}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: trend?.startsWith("+") ? "#059669" : "#dc2626", background: trend?.startsWith("+") ? "#ecfdf5" : "#fef2f2", padding: "4px 8px", borderRadius: 8, display: "inline-block", border: `1px solid ${trend?.startsWith("+") ? "#bbf7d0" : "#fecaca"}` }}>
          {trend}
        </div>
        <div style={{ fontSize: 10, color: "var(--slate-500)", marginTop: 4, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>vs last month</div>
      </div>
    </div>
    
    <div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--slate-900)", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--slate-500)", fontWeight: 600, marginTop: 2 }}>{title}</div>
    </div>

    {/* Sparkline Mock */}
    <div style={{ marginTop: 8, height: 32, width: "100%" }}>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <path 
          d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 100} ${30 - (v * 2.5)}`).join(" L ")}`}
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: `drop-shadow(0 4px 4px ${color}30)` }}
        />
      </svg>
    </div>
  </div>
);

const SubStatCard = ({ label, value, icon, color, subValue, trend, children }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(0,0,0,0.06)" }}
    className="premium-card" 
    style={{ 
      padding: "16px 20px", borderRadius: 16, display: "flex", flexDirection: "column", gap: 12,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "default",
      borderLeft: `4px solid ${color}`
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ 
        width: 40, height: 40, borderRadius: 10, background: `${color}15`, 
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, 
        border: `1px solid ${color}20`,
        boxShadow: `0 4px 8px ${color}10`
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0d2b0f", fontFamily: "'Syne', sans-serif" }}>{value}</div>
          {subValue && <div style={{ fontSize: 10, color: color, fontWeight: 700 }}>{subValue}</div>}
        </div>
      </div>
      {trend && (
        <div style={{ fontSize: 10, fontWeight: 800, color: trend.startsWith("+") ? "#059669" : "#64748b", background: trend.startsWith("+") ? "#ecfdf5" : "var(--slate-50)", padding: "4px 8px", borderRadius: 6 }}>
          {trend}
        </div>
      )}
    </div>
    {children && (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 10, marginTop: 4 }}>
        {children}
      </div>
    )}
  </motion.div>
);

const ProgrammeGrid = ({ title, sub, data, countFn, color, icon, onClick }) => (
  <div style={{ marginBottom: 48, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
    <SectionHeader title={title} subtitle={sub} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
      {data.map(p => (
        <SubStatCard key={p} label={p} value={countFn(p)} icon={icon} color={color} />
      ))}
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, theme = "light" }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 20, fontWeight: 900, color: theme === "dark" ? "#f8fafc" : "#0d2b0f", margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0", fontWeight: 500, lineHeight: 1.5 }}>{subtitle}</p>}
  </div>
);

const Badge = ({ text, type }) => {
  const colors = { 
    HIGH: ["#dc2626", "#fef2f2", "#fecaca"], 
    MEDIUM: ["#d97706", "#fffbeb", "#fde68a"], 
    LOW: ["#008751", "#ecfdf5", "#d1fae5"], 
    Active: ["#1e40af", "#eff6ff", "#dbeafe"], 
    Pending: ["#d97706", "#fffbeb", "#fde68a"],
    Graduated: ["#008751", "#f0fdf4", "#bbf7d0"],
    Inactive: ["#64748b", "#f1f5f9", "#e2e8f0"]
  };
  const [text_c, bg_c, border_c] = colors[text] || colors[type] || ["#1e3a8a", "#eff6ff", "#dbeafe"];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: bg_c, color: text_c, border: `1px solid ${border_c}`, letterSpacing: 0.3, display: "inline-flex", alignItems: "center" }}>
      {text || type}
    </span>
  );
};

const ProgressBar = ({ value, max, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  const c = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6, overflow: "hidden", border: "1px solid rgba(0,0,0,0.03)" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || c, borderRadius: 4, transition: "width 0.8s ease" }} />
    </div>
  );
};

// ─── TABS ────────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { id: "overview", label: "Analytics Overview", icon: "📊" },
  { id: "governance", label: "Institutional Governance", icon: "🛡️" },
  { id: "students", label: "Registered Student", icon: "🎓" },
  { id: "admitted_pool", label: "Admitted", icon: "📜" },
  { id: "admissions", label: "Admissions Hub", icon: "📥" },
  { id: "courses", label: "Core Courses", icon: "📘" },
  { id: "electives", label: "Elective Courses", icon: "📚" },
  { id: "general", label: "General Courses", icon: "📖" },
  { id: "facilitators", label: "Facilitators", icon: "🧑‍🏫" },
  { id: "alumni", label: "Alumni", icon: "🤝" },
  { id: "short_courses", label: "Short Courses", icon: "🌐" },
  { id: "workshops", label: "Workshops & Conferences", icon: "🛠️" },
  { id: "ai", label: "AI Insights", icon: "🤖" },
  { id: "users", label: "User Management", icon: "🔐", adminOnly: true },
];

const PROGRAMMES = [...ACETEL_PROGRAMMES];

const inferCohort = (explicit?: string, hint?: string) => {
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  if (!hint) return "";
  const m = String(hint).match(/\b(20\d{2}_\d)\b/);
  return m ? m[1] : "";
};

// ─── GENERAL ANALYTICS TAB ───────────────────────────────────────────────────
// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────
const EMPTY_DASHBOARD = { students: { active: 0, total: 0, byNationality: [], byGender: [], enrollmentTrend: [] }, applications: { total: 0, admitted: 0 }, alumni: { employmentRate: 0 }, facilitators: [], academicCourses: [], analytics: { lastRefresh: new Date().toISOString(), facilitatorToStudentRatio: 0, graduationRate: 0, mscCount: 0, phdCount: 0 } };

const defaultAnalyticsDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};

const ModuleAnalyticsStrip = ({ title, rows, color = "#1F7A63" }) => {
  if (!rows?.length) return null;
  return (
    <div style={{ 
      marginBottom: 20, 
      padding: "14px 18px", 
      background: "#fff", 
      border: `1px solid ${color}20`, 
      borderRadius: 14, 
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)", 
      borderLeft: `4px solid ${color}`,
      transition: "transform 0.2s"
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ padding: "10px 14px", background: `${color}08`, borderRadius: 10, border: `1px solid ${color}15`, minWidth: 96 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: color, fontFamily: "'Syne', sans-serif" }}>{r.value !== null && typeof r.value === 'object' ? ('result' in r.value ? r.value.result : JSON.stringify(r.value)) : (r.value ?? '—')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverviewTab = ({
  data,
  onRefresh,
  onExport,
  shortCourses = [],
  academicEvents = [],
  user,
  auditLogs = [],
  onNavigate,
  analyticsSummary,
  analyticsDateRange,
  onAnalyticsDateRangeChange,
}) => {
  const safeData = data || EMPTY_DASHBOARD;
  const { students, applications, alumni, facilitators, academicCourses, analytics } = safeData;
  const lastRefresh = analytics?.lastRefresh || new Date().toISOString();

  const handleManualRefresh = () => { if (onRefresh) onRefresh(); };

  const totalStudents   = students?.total  || 0;
  const activeStudents  = students?.active || 0;
  const totalApps       = applications?.total   || 0;
  const totalAdmitted   = applications?.admitted || 0;
  const totalAlumni     = Array.isArray(alumni) ? alumni.length : (alumni?.total ?? 0);
  const totalFacs       = Array.isArray(facilitators) ? facilitators.length : 0;
  const totalCourses    = Array.isArray(academicCourses) ? academicCourses.length : 0;
  const totalShort      = Array.isArray(shortCourses) ? shortCourses.length : 0;
  const totalWorkshops  = Array.isArray(academicEvents) ? academicEvents.length : 0;
  const shortPartic     = shortCourses.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const workshopPartic  = academicEvents.reduce((s, e) => s + (e.participants?.length || 0), 0);
  const conversionRate  = totalApps > 0 ? Math.round((totalAdmitted / totalApps) * 100) : 0;
  
  // Dynamic institutional reach stats
  const uniqueNationalities = students?.byNationality?.length || 0;
  const activeNationalities = students?.byNationality?.filter(n => n.count > 0).length || 0;

  const Card = ({ label, val, icon, color, sub }) => (
    <div style={{ 
      background:'#fff', 
      border:`1px solid ${color}20`, 
      borderRadius:20, 
      padding:24, 
      boxShadow:'0 4px 6px -1px rgba(0,0,0,0.03)', 
      position: 'relative',
      overflow: 'hidden',
      borderBottom: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 20px -5px ${color}20`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03)'; }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:900, color:color, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:900, color:'#0f172a', fontFamily:"'Syne', sans-serif", letterSpacing:-1 }}>{val}</div>
          {sub && <div style={{ fontSize:11, color:color, marginTop:4, fontWeight:800 }}>{sub}</div>}
        </div>
        <div style={{ 
          fontSize:24, 
          background: `${color}15`, 
          borderRadius:12, 
          width:48, 
          height:48, 
          display:'flex', 
          alignItems:'center', 
          justifyContent:'center',
          color: color,
          boxShadow: `0 4px 10px ${color}20`
        }}>{icon}</div>
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children, span=1 }) => (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-main)', borderRadius:20, padding:24, boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn:`span ${span}` }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:900, color:'var(--text-main)', fontFamily: "'Syne', sans-serif" }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{subtitle}</div>}
      </div>
      <div style={{ height:220 }}>{children}</div>
    </div>
  );

  // Derived data
  const genderData = students?.byGender?.length ? students.byGender : [{gender:'Male',count:0},{gender:'Female',count:0}];
  const natData    = (students?.byNationality || []).slice(0,8);
  const trendFromApi = (analyticsSummary?.students?.monthlyTrend || []).map((t) => ({
    n: String(t.period || "").replace(/^(\d+)-(\d+)$/, "$1 M$2"),
    v: t.count || 0,
  }));
  const trendData =
    trendFromApi.length > 0
      ? trendFromApi
      : (students?.enrollmentTrend || []).map((t) => ({ n: `M${t._id?.month || ""}`, v: t.count || 0 }));

  const admStatusData = analyticsSummary?.applications
    ? [
        { name: "Pending", value: analyticsSummary.applications.pending || 0, fill: "#f59e0b" },
        { name: "Admitted", value: analyticsSummary.applications.admitted || 0, fill: "#008751" },
        { name: "Not Admitted", value: analyticsSummary.applications.notAdmitted || 0, fill: "#ef4444" },
      ]
    : [
        { name: "Pending", value: Math.max(0, totalApps - totalAdmitted), fill: "#f59e0b" },
        { name: "Admitted", value: totalAdmitted, fill: "#008751" },
        { name: "Not Admitted", value: Math.max(0, totalApps - totalAdmitted - Math.round(totalApps * 0.1)), fill: "#ef4444" },
      ];

  const programmeBarData = (analyticsSummary?.programmes?.popularity || [])
    .filter((p) => p.programme)
    .sort((a, b) => progRank(a.programme) - progRank(b.programme))
    .slice(0, 8)
    .map((p) => ({
      name: String(p.programme).replace("Management Information System", "MIS").replace("Artificial Intelligence", "AI").replace("Cybersecurity", "Cyber"),
      students: p.students || 0,
      applications: p.applications || 0,
    }));

  const aiInsights = analyticsSummary?.ai?.insights || [];
  const insightCards =
    aiInsights.length > 0
      ? aiInsights.slice(0, 3)
      : [
          { title: "PREDICTIVE ENROLLMENT", body: "Connect to the API to load date-filtered AI insights from your live admissions and registry data.", severity: "info" },
          { title: "RETENTION ANALYSIS", body: "Use the AI Insights tab for at-risk applicants and facilitator workload signals.", severity: "info" },
          { title: "RESOURCES OPTIMIZATION", body: "Set the global date range above to align trends with your reporting window.", severity: "info" },
        ];

  return (
    <div style={{ animation:'fadeIn 0.4s ease-out' }}>
      {/* 1. Welcome Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
              Institutional Overview
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>
              Live metrics for Africa Centre of Excellence on Technology Enhanced Learning.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Analytics date range</span>
              <input
                type="date"
                value={analyticsDateRange?.from || ""}
                onChange={(e) => onAnalyticsDateRangeChange && onAnalyticsDateRangeChange({ ...analyticsDateRange, from: e.target.value })}
                style={{ border: "1px solid var(--border-main)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600 }}
              />
              <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>–</span>
              <input
                type="date"
                value={analyticsDateRange?.to || ""}
                onChange={(e) => onAnalyticsDateRangeChange && onAnalyticsDateRangeChange({ ...analyticsDateRange, to: e.target.value })}
                style={{ border: "1px solid var(--border-main)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600 }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onRefresh} style={{ background: "none", border: "1px solid var(--border-main)", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text-main)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <RefreshCcw size={16} /> Refresh
              </button>
              <button onClick={onExport} style={{ background: "var(--primary-green)", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={16} /> Export Global Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Summary Cards (4 cards in grid) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, marginBottom:32 }}>
        <Card label='Registered Students' val={totalStudents} icon='🎓' color='#3b82f6' sub={`${activeStudents} Active Sessions`} />
        <Card label='Alumni Records' val={totalAlumni} icon='🏆' color='#10b981' sub={`Graduate Network`} />
        <Card label='Admitted' val={totalAdmitted} icon='📜' color='#8b5cf6' sub={`${conversionRate}% Success Rate`} />
        <Card label='Faculty Network' val={totalFacs} icon='🧑‍🏫' color='#f59e0b' sub={`1:${analytics?.facilitatorToStudentRatio || 'N/A'} Staff Ratio`} />
      </div>

      {analyticsSummary?.applications && (
        <div style={{ marginBottom: 24, padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-main)", borderRadius: 16, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Applications in range</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Syne', sans-serif" }}>{analyticsSummary.applications.total}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Admission rate</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1F7A63", fontFamily: "'Syne', sans-serif" }}>
              {(analyticsSummary.applications.admissionRate ?? 0).toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Registered in range</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Syne', sans-serif" }}>{analyticsSummary.students?.total ?? "—"}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 360, fontWeight: 500 }}>
            Counts use created/applied dates within the selected window. Lists elsewhere show full records; this strip is for cross-module reporting alignment.
          </div>
        </div>
      )}

      {/* 3. Quick Actions */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Rapid Access Hub</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: 'Register Student', icon: '👤+', action: () => onNavigate && onNavigate('students', 'registered') },
            { label: 'Academic Modules', icon: '📘', action: () => onNavigate && onNavigate('academics', 'courses') },
            { label: 'Admissions Hub', icon: '📥', action: () => onNavigate && onNavigate('students', 'admissions') },
            { label: 'System Audit', icon: '🕒', action: () => onNavigate && onNavigate('admin', 'governance') },
          ].map((act, i) => (
            <button key={i} onClick={act.action} style={{ 
              flex: 1, background: "#fff", border: "1px solid var(--border-main)", 
              padding: "20px", borderRadius: 16, display: "flex", alignItems: "center", 
              justifyContent: "center", gap: 12, cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(31, 122, 99, 0.04)"; e.currentTarget.style.borderColor = "var(--primary-green)"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "var(--border-main)"; }}>
              <span style={{ fontSize: 20 }}>{act.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Analytics Chart Area */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:24, marginBottom:32 }}>
        <InstitutionalChartCard title='Enrollment Growth Matrix' gradient='blue'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
              <XAxis dataKey='n' tick={{ fontSize:11, fill:'rgba(255,255,255,0.7)', fontWeight: 600 }} />
              <YAxis tick={{ fontSize:11, fill:'rgba(255,255,255,0.7)', fontWeight: 600 }} />
              <Tooltip contentStyle={{ background:'#fff', border:'none', borderRadius:12, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
              <Area type='monotone' dataKey='v' stroke='#fff' fill='rgba(255,255,255,0.2)' strokeWidth={3} name='Registrations' />
            </AreaChart>
          </ResponsiveContainer>
        </InstitutionalChartCard>
        <InstitutionalChartCard title={programmeBarData.length ? "Programme Demand" : "Admission Pipeline"} gradient='emerald'>
          <ResponsiveContainer width='100%' height='100%'>
            {programmeBarData.length ? (
              <BarChart data={programmeBarData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
                <XAxis dataKey='name' tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)', fontWeight: 600 }} interval={0} angle={-18} textAnchor='end' height={48} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: 600 }} />
                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey='students' fill='#fff' name='Registered' radius={[4, 4, 0, 0]} />
                <Bar dataKey='applications' fill='rgba(255,255,255,0.4)' name='Applications' radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={admStatusData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={60} outerRadius={85} paddingAngle={5}>
                  {admStatusData.map((e, i) => <Cell key={i} fill={i === 1 ? '#fff' : i === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 10, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Legend iconType='circle' wrapperStyle={{ color: '#fff' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </InstitutionalChartCard>
      </div>

      {/* 5. AI Insights (highlighted section) */}
      <div style={{ 
        background: "linear-gradient(135deg, #1F7A63 0%, #16624F 100%)", 
        borderRadius: 24, padding: 32, marginBottom: 32, 
        color: "#fff", position: "relative", overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(31, 122, 99, 0.2)"
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.1, transform: "rotate(-15deg)" }}>🤖</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: 100, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Neural Intelligence Hub</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
              {analyticsSummary?.range?.from && analyticsSummary?.range?.to
                ? `Window: ${String(analyticsSummary.range.from).slice(0, 10)} → ${String(analyticsSummary.range.to).slice(0, 10)}`
                : "Date-filtered signals from live registry & admissions"}
            </div>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>AI Strategic Insights</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {insightCards.map((ins, idx) => {
              const sev = ins.severity || "info";
              const accent = sev === "critical" ? "#fecaca" : sev === "warning" ? "#fde68a" : "#fde047";
              return (
                <div key={idx} style={{ background: "rgba(255,255,255,0.1)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: accent, marginBottom: 8, letterSpacing: 0.6 }}>{(ins.title || "Insight").toUpperCase()}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{ins.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border-main)", borderRadius: 20, padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", fontFamily: "'Syne', sans-serif" }}>Institutional Audit Trail</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Latest administrative actions across the IAMS platform</div>
          </div>
          <button onClick={() => onNavigate && onNavigate("admin", "governance")} style={{ color: "var(--primary-green)", background: "none", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>View Full History →</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-main)" }}>
              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Time</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Action</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Officer</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Target</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.slice(0, 5).map((log, i) => (
              <tr key={i} style={{ borderBottom: i === 4 ? "none" : "1px solid rgba(0,0,0,0.02)" }}>
                <td style={{ padding: "16px", fontSize: 13, color: "var(--text-muted)" }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td style={{ padding: "16px" }}>
                  <span style={{ 
                    fontSize: 10, fontWeight: 900, padding: "4px 8px", borderRadius: 6,
                    background: log.action === 'DELETE' ? '#fef2f2' : log.action === 'EDIT' ? '#fffbeb' : '#f0fdf4',
                    color: log.action === 'DELETE' ? '#ef4444' : log.action === 'EDIT' ? '#d97706' : '#16a34a',
                    border: `1px solid ${log.action === 'DELETE' ? '#fee2e2' : log.action === 'EDIT' ? '#fef3c7' : '#dcfce7'}`
                  }}>{log.action}</span>
                </td>
                <td style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{log.officer}</td>
                <td style={{ padding: "16px", fontSize: 13, color: "var(--text-main)" }}>{log.targetName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 7. Institutional Hub Summary */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-main)', borderRadius:20, padding:24, boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: 32 }}>
        <div style={{ fontSize:14, fontWeight:800, color:'var(--text-main)', marginBottom:4 }}>Institutional Hub Summary</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500, marginBottom:20 }}>Live record counts across all active management hubs</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { hub:'Registered Students', count: totalStudents,  icon:'🎓', color:'#1F7A63' },
            { hub:'Admitted',      count: totalAdmitted,  icon:'📜', color:'#C9A227' },
            { hub:'Applications',      count: totalApps,      icon:'📋', color:'#1F7A63' },
            { hub:'Alumni Records',    count: totalAlumni,    icon:'🏆', color:'#1F7A63' },
            { hub:'Facilitators',      count: totalFacs,      icon:'🧑‍🏫', color:'#C9A227' },
            { hub:'Academic Courses',  count: totalCourses,   icon:'📘', color:'#1F7A63' },
            { hub:'Short Courses',     count: totalShort,     icon:'📚', color:'#1F7A63' },
            { hub:'Workshops & Events', count: totalWorkshops, icon:'🎤', color:'#C9A227' },
          ].map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'rgba(0,0,0,0.02)', borderRadius:14, border:'1px solid var(--border-main)' }}>
              <div style={{ fontSize:20, background:`${h.color}10`, borderRadius:10, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>{h.icon}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'var(--text-main)', fontFamily:"'Syne', sans-serif", lineHeight:1 }}>{h.count.toLocaleString()}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:800, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{h.hub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const GovernanceTab = ({ data, auditLogs }) => {
  const jobs = data.cronStats || [];
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <SectionHeader title='Automated Governance & Security Hub' subtitle='Monitor critical institutional tasks, cryptographic integrity scans, and automated disaster recovery status' />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <KPIItem label='Scheduled Jobs' val={jobs.length} icon='⏰' color='#1e3a8a' />
        <KPIItem label='Critical Alerts' val={jobs.filter(j => j.lastStatus === 'failure').length} icon='🚨' color='#ef4444' />
        <KPIItem label='Audit Logs (Last 50)' val={auditLogs.length} icon='📜' color='#8b5cf6' />
        <KPIItem label='Encryption' val='AES-256' icon='🛡️' color='#008751' />
      </div>

      <div style={{ marginBottom: 40 }}>
        <SectionHeader title='System Automation & Tasks' subtitle='Background processes for student data synchronization and backups' />
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Task Name', 'Schedule', 'Last Execution', 'Status', 'Executions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '18px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '18px 24px' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{j.name}</div><div style={{ fontSize: 11, color: '#64748b' }}>{j.description}</div></td>
                  <td style={{ padding: '18px 24px', fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}><code>{j.schedule}</code></td>
                  <td style={{ padding: '18px 24px', fontSize: 12, color: '#64748b' }}>{j.lastRun ? new Date(j.lastRun).toLocaleString() : 'Never'}</td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, background: j.lastStatus === 'success' ? '#dcfce7' : '#fee2e2', color: j.lastStatus === 'success' ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: 20 }}>{j.lastStatus?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '18px 24px', fontSize: 12, fontWeight: 800 }}>{j.executionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionHeader title='Institutional Audit Trail' subtitle='Immutable record of all state-modifying operations (NDPR Compliant)' />
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 35, 102, 0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Timestamp', 'User', 'Action', 'Resource', 'Remote IP', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '18px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '18px 24px', fontSize: 11, color: '#64748b', fontWeight: 600 }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '18px 24px' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{log.userName || 'System'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{log.userId || 'ID: Cron/System'}</div></td>
                  <td style={{ padding: '18px 24px', fontSize: 11, fontWeight: 700, color: '#1e3a8a' }}><code>{log.action}</code></td>
                  <td style={{ padding: '18px 24px', fontSize: 11, color: '#64748b' }}>{log.resource} <span style={{ color: '#cbd5e1' }}>/</span> {log.resourceId || '--'}</td>
                  <td style={{ padding: '18px 24px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, background: log.status === 'success' ? '#dcfce7' : '#fee2e2', color: log.status === 'success' ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: 20 }}>{log.status?.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 13 }}>No institutional audit records discovered yet. Capture will begin on next state modification.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const normEmail = (e) => (e || "").trim().toLowerCase();

/** Compares **registered** students to **admitted** applications (matric or email). */
const RegistryVsAdmissionsTab = ({ data }) => {
  const { students = [], applications = [] } = data || {};
  if (!students.length && !applications.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No data to align yet</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Upload students and admissions data first, then return here to see alignment gaps.</div>
      </div>
    );
  }
  const admittedKeys = new Set();
  (applications || []).forEach((a) => {
    if (a.status !== "Admitted" && a.status !== "admitted") return;
    const m = (a.matricNo || "").trim();
    if (m) admittedKeys.add("m:" + m.toLowerCase());
    if (a.email) admittedKeys.add("e:" + normEmail(a.email));
    if (a.personalEmail) admittedKeys.add("e:" + normEmail(a.personalEmail));
  });

  const registryRows = (students || []).map((s) => {
    const m = String(s.id || s.matricNo || "").trim();
    const inAdmittedPool =
      (m && admittedKeys.has("m:" + m.toLowerCase())) ||
      (normEmail(s.email) && admittedKeys.has("e:" + normEmail(s.email))) ||
      (normEmail(s.personalEmail) && admittedKeys.has("e:" + normEmail(s.personalEmail)));
    return { s, inAdmittedPool };
  });

  const flaggedRegistry = registryRows.filter((r) => !r.inAdmittedPool);

  const admittedNotInRegistry = (applications || []).filter((a) => {
    if (a.status !== "Admitted" && a.status !== "admitted") return false;
    const m = (a.matricNo || "").trim().toLowerCase();
    const em = normEmail(a.email || a.personalEmail);
    const matchMatric = m && (students || []).some((s) => String(s.id || s.matricNo || "").trim().toLowerCase() === m);
    const matchEmail =
      em &&
      (students || []).some(
        (s) => normEmail(s.email) === em || normEmail(s.personalEmail || s.email) === em
      );
    return !matchMatric && !matchEmail;
  });

  return (
    <div className="animate-dash">
      <SectionHeader
        title="Registry vs admission alignment"
        subtitle="Registered students without a matching admitted application (by matric or email), and admitted records not yet linked to the registry"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ padding: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#92400e" }}>⚠️ In registry, not matched to admitted pool</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{flaggedRegistry.length}</div>
          <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>Match uses matric first, then institutional/personal email.</div>
        </div>
        <div style={{ padding: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#1e40af" }}>📋 Admitted — no registry row yet</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{admittedNotInRegistry.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Pull admitted candidates into the registry when matriculation is confirmed.</div>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <SectionHeader title="Registry gaps (needs admitted match)" subtitle="Students in the official registry with no Admitted application match" />
          <ExportButton
            fileName="ACETEL_Registry_Gaps"
            title="Registry without admitted match"
            headers={[["Surname", "Other Names", "Matric", "Cohort", "Programme", "Email"]]}
            data={flaggedRegistry.map(({ s }) => [
              s.surname,
              s.otherNames,
              s.id || s.matricNo,
              s.cohort || "—",
              s.prog,
              s.email || s.personalEmail || "",
            ])}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Surname", "Matric", "Programme", "Cohort", "Email", "Note"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flaggedRegistry.map(({ s }, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 700 }}>{s.surname} {s.otherNames}</td>
                  <td style={{ padding: "12px", color: "#1e3a8a", fontWeight: 800 }}>{s.id || s.matricNo}</td>
                  <td style={{ padding: "12px" }}>{s.prog}</td>
                  <td style={{ padding: "12px" }}>{s.cohort || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 12 }}>{s.email || s.personalEmail || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#b45309", fontWeight: 600 }}>No admitted record with same matric/email</td>
                </tr>
              ))}
              {flaggedRegistry.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    All registered students align with an admitted application (by matric or email).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <SectionHeader title="Admitted — pending registry" subtitle="Admitted applications with no matching student registry row yet" />
          <ExportButton
            fileName="ACETEL_Admitted_No_Registry"
            title="Admitted without registry row"
            headers={[["Name", "Email", "Matric", "Programme", "Cohort"]]}
            data={admittedNotInRegistry.map((a) => [
              a.name,
              a.email || a.personalEmail || "",
              a.matricNo || "—",
              a.prog || a.programme,
              a.cohort || "—",
            ])}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Matric", "Programme", "Cohort"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admittedNotInRegistry.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 700 }}>{a.name}</td>
                  <td style={{ padding: "12px", fontSize: 12 }}>{a.email || a.personalEmail || "—"}</td>
                  <td style={{ padding: "12px" }}>{a.matricNo || "—"}</td>
                  <td style={{ padding: "12px" }}>{a.prog || a.programme}</td>
                  <td style={{ padding: "12px" }}>{a.cohort || "—"}</td>
                </tr>
              ))}
              {admittedNotInRegistry.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    Every admitted application has a matching registry identifier, or lists are empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RegisteredStudentsTab = ({ data, onEdit, onDelete, onHistory, onAddStudent, progFilter, setProgFilter, cohortFilter, setCohortFilter, onDownloadTemplate, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) {
      onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    }
  };
  const { students } = data;
  const [matricExport, setMatricExport] = useState("");
  const [listLayout, setListLayout] = useState("grouped");

  const filteredItems = (students
    ?.filter(s => cohortFilter === "All Cohorts" || s.cohort === cohortFilter)
    .filter(s => progFilter === "All Programmes" || s.programme === progFilter) || [])
    .slice()
    .sort(sortByCohortThenProgramme);

  const cohortProgGroups = groupItemsByCohortThenProgramme(
    filteredItems,
    (s) => s.cohort,
    (s) => s.programme
  );

  const byMatric = matricExport.trim()
    ? filteredItems.filter(s => (s.id || s.matricNo || "").toLowerCase() === matricExport.trim().toLowerCase())
    : null;


  return (
    <div className="animate-dash">
      <SectionHeader title="Registered Student Analytics" subtitle="Detailed enrolment breakdown by degree level and programme" />
      {analyticsSummary?.students && (
        <ModuleAnalyticsStrip
          color="#3b82f6"
          title="Students — date-filtered cohorts & programmes (API)"
          rows={[
            { label: "Registered in range", value: analyticsSummary.students.total },
            ...(analyticsSummary.students.byCohort || []).filter((c) => c.cohort).sort((a, b) => b.cohort.localeCompare(a.cohort)).slice(0, 4).map((c) => ({ label: `Cohort ${c.cohort}`, value: c.count })),
            ...(analyticsSummary.students.byProgramme || [])
              .filter((p) => p.programme)
              .sort((a, b) => progRank(a.programme) - progRank(b.programme))
              .map((p) => ({ label: p.programme.slice(0, 28), value: p.count })),
          ]}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        <SubStatCard label="MSc Artificial Intelligence" value={students?.filter(s => s.programme === "MSc Artificial Intelligence").length || 0} icon="🔬" color="#0066FF" />
        <SubStatCard label="MSc Cybersecurity" value={students?.filter(s => s.programme === "MSc Cybersecurity").length || 0} icon="🛡️" color="#7C3AED" />
        <SubStatCard label="MSc MIS" value={students?.filter(s => s.programme === "MSc Management Information System").length || 0} icon="📊" color="#10B981" />
        <SubStatCard label="PhD Artificial Intelligence" value={students?.filter(s => s.programme === "PhD Artificial Intelligence").length || 0} icon="🔭" color="#F59E0B" />
        <SubStatCard label="PhD Cybersecurity" value={students?.filter(s => s.programme === "PhD Cybersecurity").length || 0} icon="🔐" color="#EC4899" />
        <SubStatCard label="PhD MIS" value={students?.filter(s => s.programme === "PhD Management Information System").length || 0} icon="📡" color="#8B5CF6" />
      </div>
      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <SectionHeader title="Registered Student Database" subtitle="Official institutional records for all enrolled students" />
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)} style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: 10, padding: "10px 14px", color: "var(--slate-900)", fontSize: 13, outline: "none", fontWeight: 600 }}>
              <option value="All Cohorts">All Cohorts</option>
              {ACETEL_COHORTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={progFilter} onChange={e => setProgFilter(e.target.value)} style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: 10, padding: "10px 14px", color: "var(--slate-900)", fontSize: 13, outline: "none", fontWeight: 600 }}>
              <option value="All Programmes">All Programmes Filter</option>
              {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ display: "flex", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <button type="button" onClick={() => setListLayout("grouped")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "grouped" ? "#1F7A63" : "#fff", color: listLayout === "grouped" ? "#fff" : "#64748b" }}>Cohort → Programme</button>
              <button type="button" onClick={() => setListLayout("flat")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "flat" ? "#1F7A63" : "#fff", color: listLayout === "flat" ? "#fff" : "#64748b" }}>Flat</button>
            </div>
            <input
              value={matricExport}
              onChange={e => setMatricExport(e.target.value)}
              placeholder="Matric for one-student export"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 12, width: 200, fontWeight: 600 }}
            />
            <div style={{ display: "flex", gap: 10, background: "rgba(0,135,81,0.05)", padding: "4px", borderRadius: 12, border: "1px solid rgba(0,135,81,0.1)" }}>
              <button 
                onClick={onAddStudent} 
                style={{ background: "#008751", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
              >
                + ADD STUDENT
              </button>
              <ExportButton 
                fileName="ACETEL_Registry" 
                title="Official Student Registry"
                headers={[["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Level", "Semester", "Gender", "Phone", "Nationality", "Status"]]}
                data={filteredItems.map((s, idx) => [idx + 1, s.surname, s.otherNames, s.cohort || "—", s.id || s.matricNo, s.instEmail, s.email || s.personalEmail, s.programme, s.level || 800, s.sem, s.gender, s.phone, s.nationality, s.status])}
              />
              {byMatric && byMatric.length > 0 && (
                <ExportButton
                  fileName={`ACETEL_Student_${(byMatric[0].id || byMatric[0].matricNo || "record").replace(/\//g, "_")}`}
                  title="Single student export"
                  headers={[["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Level", "Semester", "Gender", "Phone", "Nationality", "Status"]]}
                  data={byMatric.map((s, idx) => [idx + 1, s.surname, s.otherNames, s.cohort || "—", s.id || s.matricNo, s.instEmail, s.email || s.personalEmail, s.programme, s.level || 800, s.sem, s.gender, s.phone, s.nationality, s.status])}
                />
              )}
              <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                📥 Bulk Upload
                <input type="file" style={{ display: "none" }} onChange={e => onHistory && onHistory(e, "Registry")} />
              </label>
              <button 
                onClick={() => onDownloadTemplate && onDownloadTemplate("Registry")}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#475569", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              >
                📄 Template
              </button>
              <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
                🗑️ Bulk Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 14px", borderBottom: "2px solid #e2e8f0" }}>
                   <input type="checkbox" checked={filteredItems.length > 0 && filteredItems.every(x => selectedIds.includes(x._id || x.id))} onChange={() => toggleAll(filteredItems)} />
                </th>
                {["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Level", "Sem", "Gender", "Phone", "Nationality", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 10, color: "#64748b", fontWeight: 700, borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLayout === "flat"
                ? filteredItems.map((s, i) => (
                    <tr key={s._id || s.id || i} style={{ borderBottom: "1px solid #f1f5f9", background: selectedIds.includes(s._id || s.id) ? "rgba(31, 122, 99, 0.05)" : "transparent" }}>
                      <td style={{ padding: "14px 14px" }}>
                        <input type="checkbox" checked={selectedIds.includes(s._id || s.id)} onChange={() => toggleSelect(s._id || s.id)} />
                      </td>
                      <td style={{ padding: "14px 14px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{s.surname}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{s.otherNames}</td>
                      <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569", fontWeight: 700 }}>{s.cohort || "—"}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{s.id || s.matricNo}</td>
                      <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569" }}>{s.instEmail || "N/A"}</td>
                      <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569" }}>{s.email || s.personalEmail || "N/A"}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{s.programme}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>{s.level || 800}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12, fontWeight: 700 }}>{s.sem}</td>
                      <td style={{ padding: "14px 14px", fontSize: 12 }}>{s.gender || "N/A"}</td>
                      <td style={{ padding: "14px 14px", fontSize: 11 }}>{s.phone || "N/A"}</td>
                      <td style={{ padding: "14px 14px", fontSize: 11 }}>{s.nationality || "N/A"}</td>
                      <td style={{ padding: "14px 14px" }}><Badge type={s.status} text={s.status} /></td>
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <ExportButton 
                            variant="icon" 
                            fileName={`Student_${s.id}`} 
                            title={`Student Record: ${s.surname} ${s.otherNames}`}
                            headers={[["Field", "Value"]]}
                            data={[
                               ["Surname", s.surname],
                               ["Other Names", s.otherNames],
                               ["Cohort", s.cohort || "—"],
                               ["Matric Number", s.id || s.matricNo],
                               ["Inst. Email", s.instEmail],
                               ["Personal Email", s.personalEmail || s.email],
                               ["Programme", s.programme],
                               ["Level", s.level],
                               ["Semester", s.sem],
                               ["Gender", s.gender],
                               ["Phone", s.phone],
                               ["Nationality", s.nationality],
                               ["Status", s.status]
                            ]}
                          />
                          <button onClick={() => onEdit(s, 'student')} style={{ fontSize: 10, padding: "5px 8px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 4, color: "#d97706", fontWeight: 700 }}>Edit</button>
                          <button onClick={() => onDelete(s)} style={{ fontSize: 10, padding: "5px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, color: "#dc2626", fontWeight: 700 }}>Move to Bin</button>
                        </div>
                      </td>
                    </tr>
                  ))
                : cohortProgGroups.flatMap((cg) =>
                    cg.programmes.flatMap((pg) => {
                      let rowSn = 0;
                      const header = (
                        <tr key={`hdr-${cg.cohort}-${pg.programme}`} style={{ background: "#ecfdf5" }}>
                          <td colSpan={16} style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, color: "#064e3b", borderBottom: "1px solid #bbf7d0" }}>
                            <span style={{ marginRight: 8 }}>{cg.cohort}</span>
                            <span style={{ color: "#64748b", fontWeight: 700 }}>→</span>
                            <span style={{ marginLeft: 8 }}>{pg.programme}</span>
                            <span style={{ marginLeft: 10, color: "#059669", fontWeight: 700 }}>({pg.items.length})</span>
                          </td>
                        </tr>
                      );
                      const body = pg.items.map((s) => {
                        rowSn += 1;
                        const i = rowSn;
                        return (
                          <tr key={s._id || s.id || `${cg.cohort}-${pg.programme}-${i}`} style={{ borderBottom: "1px solid #f1f5f9", background: selectedIds.includes(s._id || s.id) ? "rgba(31, 122, 99, 0.05)" : "transparent" }}>
                            <td style={{ padding: "14px 14px" }}>
                              <input type="checkbox" checked={selectedIds.includes(s._id || s.id)} onChange={() => toggleSelect(s._id || s.id)} />
                            </td>
                            <td style={{ padding: "14px 14px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{i}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{s.surname}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{s.otherNames}</td>
                            <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569", fontWeight: 700 }}>{s.cohort || "—"}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{s.id || s.matricNo}</td>
                            <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569" }}>{s.instEmail || "N/A"}</td>
                            <td style={{ padding: "14px 14px", fontSize: 11, color: "#475569" }}>{s.email || s.personalEmail || "N/A"}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{s.prog}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>{s.level || 800}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12, fontWeight: 700 }}>{s.sem}</td>
                            <td style={{ padding: "14px 14px", fontSize: 12 }}>{s.gender || "N/A"}</td>
                            <td style={{ padding: "14px 14px", fontSize: 11 }}>{s.phone || "N/A"}</td>
                            <td style={{ padding: "14px 14px", fontSize: 11 }}>{s.nat || s.nationality || "N/A"}</td>
                            <td style={{ padding: "14px 14px" }}><Badge type={s.status} text={s.status} /></td>
                            <td style={{ padding: "14px 14px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <ExportButton 
                                  variant="icon" 
                                  fileName={`Student_${s.id}`} 
                                  title={`Student Record: ${s.surname} ${s.otherNames}`}
                                  headers={[["Field", "Value"]]}
                                  data={[
                                     ["Surname", s.surname],
                                     ["Other Names", s.otherNames],
                                     ["Cohort", s.cohort || "—"],
                                     ["Matric Number", s.id || s.matricNo],
                                     ["Inst. Email", s.instEmail],
                                     ["Personal Email", s.personalEmail || s.email],
                                     ["Programme", s.prog],
                                     ["Level", s.level],
                                     ["Semester", s.sem],
                                     ["Gender", s.gender],
                                     ["Phone", s.phone],
                                     ["Nationality", s.nat || s.nationality],
                                     ["Status", s.status]
                                  ]}
                                />
                                <button onClick={() => onEdit(s, 'student')} style={{ fontSize: 10, padding: "5px 8px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 4, color: "#d97706", fontWeight: 700 }}>Edit</button>
                                <button onClick={() => onDelete(s)} style={{ fontSize: 10, padding: "5px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, color: "#dc2626", fontWeight: 700 }}>Move to Bin</button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                      return [header, ...body];
                    })
                  )}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No records found in student list.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// ─── Admission Hub Tab ────────────────────────────────────────────────────────
const REJECTION_REASONS = [
  "Low CGPA",
  "Unavailability of BSc and MSc Certificates/other relevant documents",
  "Deficiency in O'level results",
  "Research Proposals that were deemed unresearchable and failed assessment",
  "Evidence of application payment receipts not uploaded",
];

const AdmissionHubTab = ({ data, onBulkUpload, onDownloadTemplate, onDelete, selectedIds = [], onSelectionChange }) => {
  const records = data?.admissionHub || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [progFilter, setProgFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);

  const cohorts = [...new Set(records.map(r => r.cohort).filter(Boolean))].sort().reverse();
  const progs   = [...new Set(records.map(r => r.programme).filter(Boolean))].sort();

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.name||'').toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q) || (r.matricNo||'').toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || r.admissionStatus === statusFilter;
    const matchC = cohortFilter === 'All' || r.cohort === cohortFilter;
    const matchP = progFilter === 'All' || r.programme === progFilter;
    return matchQ && matchS && matchC && matchP;
  });

  const admitted    = records.filter(r => r.admissionStatus === 'Admitted').length;
  const notAdmitted = records.filter(r => r.admissionStatus === 'Not Admitted').length;
  const pending     = records.filter(r => r.admissionStatus === 'Pending').length;

  const statusColor = (s) => s === 'Admitted' ? '#10b981' : s === 'Not Admitted' ? '#ef4444' : '#f59e0b';
  const statusBg    = (s) => s === 'Admitted' ? '#ecfdf5' : s === 'Not Admitted' ? '#fef2f2' : '#fffbeb';

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await api.post('/admission-hub/sync');
      alert(r?.message || 'Sync complete.');
      if (typeof fetchData === 'function') fetchData();
    } catch (e) { alert('Sync failed: ' + (e?.response?.data?.message || e.message)); }
    finally { setSyncing(false); }
  };

  const handleExportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Admission Hub');
    ws.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Matric No', key: 'matricNo', width: 16 },
      { header: 'Programme', key: 'programme', width: 30 },
      { header: 'Cohort', key: 'cohort', width: 10 },
      { header: 'Admission Status', key: 'admissionStatus', width: 18 },
      { header: 'Rejection / Deficiency Notes', key: 'rejectionNotes', width: 60 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F7A63' } };
    filtered.forEach(r => ws.addRow({
      ...r,
      rejectionNotes: Array.isArray(r.rejectionNotes) ? r.rejectionNotes.join('; ') : (r.rejectionNotes || ''),
    }));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = 'AdmissionHub.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:'#1F7A63' }}>Admission Hub</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Independent upload — auto-matched against admitted pool</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={handleSync} disabled={syncing} style={{ padding:'9px 18px', background:'#1F7A63', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
            {syncing ? '⟳ Syncing…' : '⟳ Sync with Admitted Pool'}
          </button>
          <label style={{ padding:'9px 18px', background:'#3b82f6', color:'#fff', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ⬆ Upload Excel
            <input type="file" style={{ display:'none' }} accept=".xlsx,.xls,.csv"
              onChange={e => onBulkUpload && onBulkUpload(e, 'AdmissionHub')} />
          </label>
          <button onClick={() => onDownloadTemplate && onDownloadTemplate('AdmissionHub')}
            style={{ padding:'9px 18px', background:'#f1f5f9', color:'#1e293b', border:'1px solid #e2e8f0', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ⬇ Template
          </button>
          <button onClick={handleExportExcel}
            style={{ padding:'9px 18px', background:'#f1f5f9', color:'#1e293b', border:'1px solid #e2e8f0', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ⬇ Export Excel
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Total Records', val:records.length, color:'#1F7A63' },
          { label:'Admitted', val:admitted, color:'#10b981' },
          { label:'Not Admitted', val:notAdmitted, color:'#ef4444' },
          { label:'Pending', val:pending, color:'#f59e0b' },
        ].map(c => (
          <div key={c.label} style={{ padding:'12px 20px', background:'#fff', borderRadius:10, border:`1px solid ${c.color}25`, borderLeft:`4px solid ${c.color}`, minWidth:120 }}>
            <div style={{ fontSize:10, fontWeight:800, color:c.color, textTransform:'uppercase', letterSpacing:0.8 }}>{c.label}</div>
            <div style={{ fontSize:26, fontWeight:900, color:c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / matric…"
          style={{ flex:1, minWidth:200, padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13 }}>
          <option>All</option><option>Admitted</option><option>Not Admitted</option><option>Pending</option>
        </select>
        <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)}
          style={{ padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13 }}>
          <option value="All">All Cohorts</option>
          {cohorts.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={progFilter} onChange={e => setProgFilter(e.target.value)}
          style={{ padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13 }}>
          <option value="All">All Programmes</option>
          {progs.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:700 }}>No records yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Upload an Excel file to populate the Admission Hub.</div>
        </div>
      ) : (
        <div style={{ overflowX:'auto', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Name</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Email</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Matric</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Programme</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Cohort</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Status</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Rejection / Deficiency Notes</th>
                <th style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:'#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id || r.id || i} style={{ borderBottom:'1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding:'11px 14px', fontWeight:700 }}>{r.name}</td>
                  <td style={{ padding:'11px 14px', color:'#64748b' }}>{r.email || '—'}</td>
                  <td style={{ padding:'11px 14px', color:'#64748b', fontFamily:'monospace' }}>{r.matricNo || '—'}</td>
                  <td style={{ padding:'11px 14px', color:'#475569' }}>{r.programme || '—'}</td>
                  <td style={{ padding:'11px 14px', color:'#475569' }}>{r.cohort || '—'}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:statusBg(r.admissionStatus), color:statusColor(r.admissionStatus), border:`1px solid ${statusColor(r.admissionStatus)}40` }}>
                      {r.admissionStatus}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px', maxWidth:300 }}>
                    {Array.isArray(r.rejectionNotes) && r.rejectionNotes.length > 0 ? (
                      <ul style={{ margin:0, paddingLeft:16, color:'#ef4444', fontSize:12 }}>
                        {r.rejectionNotes.map((n, ni) => <li key={ni}>{n}</li>)}
                      </ul>
                    ) : (
                      <span style={{ color:'#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <button onClick={() => onDelete && onDelete(r)}
                      style={{ padding:'5px 12px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'10px 16px', color:'#94a3b8', fontSize:12, borderTop:'1px solid #f1f5f9' }}>
            Showing {filtered.length} of {records.length} records
          </div>
        </div>
      )}
    </div>
  );
};

const AdmittedStudentsTab = ({ data, onEdit, onDelete, progFilter, setProgFilter, cohortFilter, setCohortFilter, onAddAdmitted, onBulkUpload, onDownloadTemplate, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
  const { applications } = data;
  const [matricExport, setMatricExport] = useState("");
  const [listLayout, setListLayout] = useState("grouped");
  const admittedItems = (applications || []).filter(a => a?.status === "Admitted");
  const filteredItems = (admittedItems
    .filter(a => cohortFilter === "All Cohorts" || a.cohort === cohortFilter)
    .filter(a => progFilter === "All Programmes" || a?.programme === progFilter) || [])
    .slice()
    .sort(sortByCohortThenProgramme);
  const cohortProgGroups = groupItemsByCohortThenProgramme(
    filteredItems,
    (a) => a.cohort,
    (a) => a.programme
  );
  const byMatric = matricExport.trim()
    ? filteredItems.filter(a => (a.matricNo || "").toLowerCase() === matricExport.trim().toLowerCase())
    : null;

  return (
    <div className="animate-dash">
      <SectionHeader title="Admitted Candidate Analytics" subtitle="High-fidelity pool of confirmed institutional candidates" />
      {analyticsSummary?.applications && (
        <ModuleAnalyticsStrip
          color="#10b981"
          title="Admitted pool — aligned with global analytics window"
          rows={[
            { label: "Admitted (in API window)", value: analyticsSummary.applications.admitted },
            { label: "Admission rate", value: `${(analyticsSummary.applications.admissionRate ?? 0).toFixed(1)}%` },
            ...(analyticsSummary.applications.byProgramme || [])
              .filter((p) => p.programme)
              .sort((a, b) => progRank(a.programme) - progRank(b.programme))
              .map((p) => ({ label: p.programme.slice(0, 26), value: p.count })),
          ]}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        <SubStatCard label="MSc Artificial Intelligence" value={admittedItems.filter(a => a.programme === "MSc Artificial Intelligence").length} icon="📜" color="#0066FF" />
        <SubStatCard label="MSc Cybersecurity" value={admittedItems.filter(a => a.programme === "MSc Cybersecurity").length} icon="📜" color="#7C3AED" />
        <SubStatCard label="MSc MIS" value={admittedItems.filter(a => a.programme === "MSc Management Information System").length} icon="📜" color="#10B981" />
        <SubStatCard label="PhD Artificial Intelligence" value={admittedItems.filter(a => a.programme === "PhD Artificial Intelligence").length} icon="📜" color="#F59E0B" />
        <SubStatCard label="PhD Cybersecurity" value={admittedItems.filter(a => a.programme === "PhD Cybersecurity").length} icon="📜" color="#EC4899" />
        <SubStatCard label="PhD MIS" value={admittedItems.filter(a => a.programme === "PhD Management Information System").length} icon="📜" color="#8B5CF6" />
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #E5E0D5", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(11,61,46,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <SectionHeader title="Admitted Candidates" subtitle="Official list of candidates cleared for matriculation" />

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={cohortFilter}
              onChange={e => setCohortFilter(e.target.value)}
              style={{ background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "10px 14px", color: "#111827", fontSize: 13, outline: "none", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="All Cohorts">All Cohorts</option>
              {ACETEL_COHORTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Programme Filter */}
            <select
              value={progFilter}
              onChange={e => setProgFilter(e.target.value)}
              style={{ background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "10px 14px", color: "#111827", fontSize: 13, outline: "none", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="All Programmes">All Programmes</option>
              {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={matricExport}
              onChange={e => setMatricExport(e.target.value)}
              placeholder="Matric for one-student export"
              style={{ background: "#fff", border: "1px solid #E5E0D5", borderRadius: 8, padding: "10px 12px", fontSize: 12, width: 200, fontWeight: 600 }}
            />
            <div style={{ display: "flex", borderRadius: 8, border: "1px solid #E5E0D5", overflow: "hidden" }}>
              <button type="button" onClick={() => setListLayout("grouped")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "grouped" ? "#0B3D2E" : "#fff", color: listLayout === "grouped" ? "#fff" : "#64748b" }}>Cohort → Programme</button>
              <button type="button" onClick={() => setListLayout("flat")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "flat" ? "#0B3D2E" : "#fff", color: listLayout === "flat" ? "#fff" : "#64748b" }}>Flat</button>
            </div>

            {/* Action Buttons Group */}
            <div style={{ display: "flex", gap: 8, background: "rgba(11,61,46,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(11,61,46,0.08)" }}>

              {/* ADD STUDENT */}
              <button
                onClick={onAddAdmitted}
                style={{ background: "#0B3D2E", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}
              >
                + ADD STUDENT
              </button>

              {/* EXPORT */}
              <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
                🗑️ BULK DELETE ({selectedIds.length})
              </button>
              <ExportButton
                fileName="ACETEL_AdmittedPool"
                title="Admitted Candidates Directory"
                headers={[["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Gender", "Phone", "Nationality", "Date Admitted"]]}
                data={filteredItems.map((a, idx) => [
                  idx + 1, a.surname, a.otherNames, a.cohort || "—", a.matricNo || "Not Allocated",
                  a.instEmail || "", a.email || a.personalEmail || "",
                  a.programme, a.gender || "", a.phone || "", a.nationality || "",
                  a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : ""
                ])}
              />
              {byMatric && byMatric.length > 0 && (
                <ExportButton
                  fileName={`ACETEL_Admitted_${(byMatric[0].matricNo || "student").replace(/\//g, "_")}`}
                  title="Single admitted record"
                  headers={[["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Gender", "Phone", "Nationality", "Date Admitted"]]}
                  data={byMatric.map((a, idx) => [
                    idx + 1, a.surname, a.otherNames, a.cohort || "—", a.matricNo || "Not Allocated",
                    a.instEmail || "", a.email || a.personalEmail || "",
                    a.programme, a.gender || "", a.phone || "", a.nationality || "",
                    a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : ""
                  ])}
                />
              )}

              {/* BULK UPLOAD */}
              <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                📥 Bulk Upload
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={e => onBulkUpload && onBulkUpload(e, "AdmittedPool")}
                />
              </label>

              {/* TEMPLATE */}
              <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                🗑️ Bulk Delete ({selectedIds.length})
              </button>
              <button
                onClick={() => onDownloadTemplate && onDownloadTemplate("AdmittedPool")}
                style={{ background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 8, padding: "10px 14px", color: "#374151", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}
              >
                📄 Template
              </button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F4F6F3" }}>
                <th style={{ padding: "12px 14px", width: 40 }}>
                  <input 
                    type="checkbox" 
                    checked={filteredItems.length > 0 && filteredItems.every(a => selectedIds.includes(a._id || a.id))}
                    onChange={(e) => {
                      const ids = e.target.checked ? filteredItems.map(a => a._id || a.id) : [];
                      onSelectionChange(ids);
                    }}
                  />
                </th>
                {["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Gender", "Phone Number", "Nationality", "Date Admitted", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 10, color: "#6B7280", fontWeight: 700, borderBottom: "2px solid #E5E0D5", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLayout === "flat"
                ? filteredItems.map((a, i) => (
                <tr key={a._id || i} style={{ borderBottom: "1px solid #F4F6F3" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9F8F6"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "13px 14px" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(a._id || a.id)}
                      onChange={(e) => {
                        const id = a._id || a.id;
                        if (e.target.checked) onSelectionChange([...selectedIds, id]);
                        else onSelectionChange(selectedIds.filter(x => x !== id));
                      }}
                    />
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#0B3D2E", fontWeight: 800 }}>{a.surname}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#111827", fontWeight: 700 }}>{a.otherNames}</td>
                  <td style={{ padding: "13px 14px", fontSize: 11, color: "#6B7280", fontWeight: 700 }}>{a.cohort || "—"}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{a.matricNo || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Not Allocated</span>}</td>
                  <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.instEmail || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Allocating...</span>}</td>
                  <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.email || a.personalEmail || "—"}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#374151" }}>{a.gender || "—"}</td>
                  <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.phone || "—"}</td>
                  <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.nationality || "—"}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#6B7280" }}>{a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : "TBD"}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <ExportButton
                        variant="icon"
                        fileName={`Admitted_${a._id}`}
                        title={`Offer of Admission: ${a.surname}`}
                        headers={[["Field", "Value"]]}
                        data={[
                          ["Surname", a.surname],
                          ["Other Names", a.otherNames],
                          ["Cohort", a.cohort || "—"],
                          ["Matric Number", a.matricNo],
                          ["Inst. Email", a.instEmail],
                          ["Personal Email", a.email || a.personalEmail],
                          ["Gender", a.gender],
                          ["Nationality", a.nationality],
                          ["Date Admitted", a.appliedDate]
                        ]}
                      />
                      <button onClick={() => onEdit(a, 'application')} style={{ fontSize: 10, padding: "5px 10px", background: "#fff", border: "1px solid #E5E0D5", borderRadius: 6, color: "#C9A227", fontWeight: 700, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => onDelete(a)} style={{ fontSize: 10, padding: "5px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#DC2626", fontWeight: 700, cursor: "pointer" }}>Withdraw</button>
                    </div>
                  </td>
                </tr>
              ))
                : cohortProgGroups.flatMap((cg) =>
                    cg.programmes.flatMap((pg) => {
                      let rowSn = 0;
                      const header = (
                        <tr key={`ah-${cg.cohort}-${pg.programme}`} style={{ background: "#ecfdf5" }}>
                          <td colSpan={12} style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, color: "#064e3b", borderBottom: "1px solid #bbf7d0" }}>
                            {cg.cohort} → {pg.programme} <span style={{ color: "#059669" }}>({pg.items.length})</span>
                          </td>
                        </tr>
                      );
                      const body = pg.items.map((a) => {
                        rowSn += 1;
                        const i = rowSn;
                        return (
                          <tr key={a._id || `${cg.cohort}-${pg.programme}-${i}`} style={{ borderBottom: "1px solid #F4F6F3" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F9F8F6"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{i}</td>
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#0B3D2E", fontWeight: 800 }}>{a.surname}</td>
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#111827", fontWeight: 700 }}>{a.otherNames}</td>
                            <td style={{ padding: "13px 14px", fontSize: 11, color: "#6B7280", fontWeight: 700 }}>{a.cohort || "—"}</td>
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{a.matricNo || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Not Allocated</span>}</td>
                            <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.instEmail || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Allocating...</span>}</td>
                            <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.email || a.personalEmail || "—"}</td>
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#374151" }}>{a.gender || "—"}</td>
                            <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.phone || "—"}</td>
                            <td style={{ padding: "13px 14px", fontSize: 11, color: "#374151" }}>{a.nationality || "—"}</td>
                            <td style={{ padding: "13px 14px", fontSize: 12, color: "#6B7280" }}>{a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : "TBD"}</td>
                            <td style={{ padding: "13px 14px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <ExportButton
                                  variant="icon"
                                  fileName={`Admitted_${a._id}`}
                                  title={`Offer of Admission: ${a.surname}`}
                                  headers={[["Field", "Value"]]}
                                  data={[
                                    ["Surname", a.surname],
                                    ["Other Names", a.otherNames],
                                    ["Cohort", a.cohort || "—"],
                                    ["Matric Number", a.matricNo],
                                    ["Inst. Email", a.instEmail],
                                    ["Personal Email", a.email || a.personalEmail],
                                    ["Gender", a.gender],
                                    ["Nationality", a.nationality],
                                    ["Date Admitted", a.appliedDate]
                                  ]}
                                />
                                <button onClick={() => onEdit(a, 'application')} style={{ fontSize: 10, padding: "5px 10px", background: "#fff", border: "1px solid #E5E0D5", borderRadius: 6, color: "#C9A227", fontWeight: 700, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => onDelete(a)} style={{ fontSize: 10, padding: "5px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#DC2626", fontWeight: 700, cursor: "pointer" }}>Withdraw</button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                      return [header, ...body];
                    })
                  )}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#6B7280" }}>No admitted records found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Use "Add Student" or "Bulk Upload" to add records</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// ─── STUDENTS TAB ──────────────────────────────────────────────────────────── (REMOVED REDUNDANT)

// ─── STUDENTS TAB ────────────────────────────────────────────────────────────

// Redundant StudentsTab Removed

// ─── ALUMNI & GRADUATES TAB ──────────────────────────────────────────────────

const AlumniTab = ({ data, onEdit, onDelete, onHistory, onMessage, onDownloadTemplate, cohortFilter, setCohortFilter, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
  const [search, setSearch] = useState("");
  const [listLayout, setListLayout] = useState("grouped");
  const alumni = data.alumni || [];
  
  const filtered = (alumni?.filter(a =>
    (cohortFilter === "All Cohorts" || a.cohort === cohortFilter) &&
    (a?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a?.employer?.toLowerCase().includes(search.toLowerCase()) ||
    a?.programme?.toLowerCase().includes(search.toLowerCase()))
  ) || []).slice().sort(sortByCohortThenProgramme);

  const cohortProgGroups = groupItemsByCohortThenProgramme(
    filtered,
    (a) => a.cohort,
    (a) => a.programme
  );

  const getAlumniCount = (p) => alumni?.filter(a => a.programme === p).length || 0;

  return (
    <div className="animate-dash">
      <SectionHeader title="Alumni" subtitle="Tracking graduate production and global placement across the 6 core programmes" />
      {analyticsSummary?.alumni && (
        <ModuleAnalyticsStrip
          color="#8b5cf6"
          title="Alumni — date-filtered distribution"
          rows={[
            { label: "Alumni in range", value: analyticsSummary.alumni.total },
            ...(analyticsSummary.alumni.byCohort || []).filter((c) => c.cohort).sort((a, b) => b.cohort.localeCompare(a.cohort)).slice(0, 4).map((c) => ({ label: `Cohort ${c.cohort}`, value: c.count })),
            ...(analyticsSummary.alumni.byProgramme || [])
              .filter((p) => p.programme)
              .sort((a, b) => progRank(a.programme) - progRank(b.programme))
              .map((p) => ({ label: p.programme.slice(0, 28), value: p.count })),
          ]}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {PROGRAMMES.map(p => (
          <SubStatCard key={p} label={p} value={getAlumniCount(p)} icon="🎓" color="#8b5cf6" trend="Graduates" />
        ))}
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 20, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <SectionHeader title="Graduate Career Placement" subtitle={`${filtered.length} alumni records currently indexed`} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
              <option value="All Cohorts">All Cohorts</option>
              {ACETEL_COHORTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search graduates..."
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: 220, fontWeight: 500 }}
            />
            <div style={{ display: "flex", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <button type="button" onClick={() => setListLayout("grouped")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "grouped" ? "#8b5cf6" : "#fff", color: listLayout === "grouped" ? "#fff" : "#64748b" }}>Cohort → Programme</button>
              <button type="button" onClick={() => setListLayout("flat")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "flat" ? "#8b5cf6" : "#fff", color: listLayout === "flat" ? "#fff" : "#64748b" }}>Flat</button>
            </div>
            <div style={{ display: "flex", gap: 8, background: "#f8fafc", padding: "4px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <button 
                onClick={() => setEditData({ name: '', surname: '', otherNames: '', email: '', personalEmail: '', cohort: '', matricNo: '', programme: '', level: 800, gradYear: new Date().getFullYear(), status: 'Graduated', _editType: 'alumni', _isNew: true })} 
                style={{ background: "#8b5cf6", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
              >
                + ADD ALUMNI
              </button>
              <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
                🗑️ BULK DELETE ({selectedIds.length})
              </button>
              <ExportButton 
                fileName="ACETEL_Alumni" 
                title="Official Alumni Directory"
                headers={[["Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Level", "Gender", "Phone", "Nationality", "Graduation", "Status"]]}
                data={filtered.map(a => [a.surname, a.otherNames, a.cohort || "—", a.matricNo || a.id, a.instEmail, a.email || a.personalEmail, a.programme, a.level || 800, a.gender, a.phone, a.nationality, a.gradYear, a.status])}
              />
              <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                📥 Bulk Upload
                <input type="file" style={{ display: "none" }} onChange={e => onHistory && onHistory(e, "Alumni")} />
              </label>
              <button 
                onClick={() => onDownloadTemplate && onDownloadTemplate("Alumni")}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#475569", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              >
                📄 Template
              </button>
            </div>
            <button onClick={() => onMessage && onMessage()} style={{ background: "#008751", border: "none", borderRadius: 8, padding: "12px 20px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>COMMUNICATE WITH NETWORK</button>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.01)" }}>
                <th style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", width: 40 }}>
                   <input type="checkbox" checked={filtered.length > 0 && filtered.every(x => selectedIds.includes(x._id || x.id))} onChange={() => toggleAll(filtered)} />
                </th>
                {["Surname", "Other Names", "Cohort", "Matric Number", "Inst. Email", "Personal Email", "Programme", "Level", "Gender", "Phone", "Nationality", "Graduation Data", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLayout === "flat"
                ? filtered.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s", background: selectedIds.includes(a._id || a.id) ? "rgba(139, 92, 246, 0.05)" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#fcfdff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px" }}>
                    <input type="checkbox" checked={selectedIds.includes(a._id || a.id)} onChange={() => toggleSelect(a._id || a.id)} />
                  </td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{a.surname}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{a.otherNames}</td>
                  <td style={{ padding: "14px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>{a.cohort || "—"}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{a.matricNo || a.id}</td>
                  <td style={{ padding: "14px", fontSize: 11 }}>{a.instEmail || "Allocating..."}</td>
                  <td style={{ padding: "14px", fontSize: 11 }}>{a.email || a.personalEmail || "N/A"}</td>
                  <td style={{ padding: "14px", fontSize: 12 }}>{a.programme}</td>
                  <td style={{ padding: "14px", fontSize: 12, fontWeight: 700 }}>{a.level || 800}</td>
                  <td style={{ padding: "14px", fontSize: 12 }}>{a.gender || "N/A"}</td>
                  <td style={{ padding: "14px", fontSize: 11 }}>{a.phone || "N/A"}</td>
                  <td style={{ padding: "14px", fontSize: 11 }}>{a.nationality || "N/A"}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#059669", fontWeight: 800 }}>{a.gradYear || "N/A"}</td>
                  <td style={{ padding: "14px" }}><Badge text={a.status || "Graduated"} /></td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ExportButton 
                        variant="icon" 
                        fileName={`Alumni_${a.id}`} 
                        title={`Alumni Record: ${a.name}`}
                        headers={[["Field", "Value"]]}
                        data={[
                           ["Full Name", a.name],
                           ["Matric Number", a.id],
                           ["Programme", a.programme],
                           ["Graduation Year", a.gradYear],
                           ["Current Employer", a.employer],
                           ["Job Role", a.role],
                           ["Engagement Level", a.engagement]
                        ]}
                      />
                      <button onClick={() => onMessage?.(a)} style={{ fontSize: 10, padding: "6px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, color: "#166534", cursor: "pointer", fontWeight: 800 }}>MESSAGE</button>
                      <button onClick={() => onEdit?.(a, 'alumni')} style={{ fontSize: 10, padding: "6px 12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#b45309", cursor: "pointer", fontWeight: 800 }}>EDIT</button>
                      <button onClick={() => onDelete?.(a)} style={{ fontSize: 10, padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 800 }}>DELETE</button>
                    </div>
                  </td>
                </tr>
              ))
                : cohortProgGroups.flatMap((cg) =>
                    cg.programmes.flatMap((pg) => {
                      const header = (
                        <tr key={`al-h-${cg.cohort}-${pg.programme}`} style={{ background: "#faf5ff" }}>
                          <td colSpan={15} style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, color: "#6b21a8", borderBottom: "1px solid #e9d5ff" }}>
                            {cg.cohort} → {pg.programme} <span style={{ color: "#7c3aed" }}>({pg.items.length})</span>
                          </td>
                        </tr>
                      );
                      const body = pg.items.map((a, idx) => (
                        <tr key={a._id || `${cg.cohort}-${pg.programme}-${idx}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s", background: selectedIds.includes(a._id || a.id) ? "rgba(139, 92, 246, 0.05)" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#fcfdff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px" }}>
                            <input type="checkbox" checked={selectedIds.includes(a._id || a.id)} onChange={() => toggleSelect(a._id || a.id)} />
                          </td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{a.surname}</td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{a.otherNames}</td>
                          <td style={{ padding: "14px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>{a.cohort || "—"}</td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#1e3a8a", fontWeight: 800 }}>{a.matricNo || a.id}</td>
                          <td style={{ padding: "14px", fontSize: 11 }}>{a.instEmail || "Allocating..."}</td>
                          <td style={{ padding: "14px", fontSize: 11 }}>{a.email || a.personalEmail || "N/A"}</td>
                          <td style={{ padding: "14px", fontSize: 12 }}>{a.programme}</td>
                          <td style={{ padding: "14px", fontSize: 12, fontWeight: 700 }}>{a.level || 800}</td>
                          <td style={{ padding: "14px", fontSize: 12 }}>{a.gender || "N/A"}</td>
                          <td style={{ padding: "14px", fontSize: 11 }}>{a.phone || "N/A"}</td>
                          <td style={{ padding: "14px", fontSize: 11 }}>{a.nationality || "N/A"}</td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#059669", fontWeight: 800 }}>{a.gradYear || "N/A"}</td>
                          <td style={{ padding: "14px" }}><Badge text={a.status || "Graduated"} /></td>
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <ExportButton 
                                variant="icon" 
                                fileName={`Alumni_${a.id}`} 
                                title={`Alumni Record: ${a.name}`}
                                headers={[["Field", "Value"]]}
                                data={[
                                   ["Full Name", a.name],
                                   ["Matric Number", a.id],
                                   ["Programme", a.programme],
                                   ["Graduation Year", a.gradYear],
                                   ["Current Employer", a.employer],
                                   ["Job Role", a.role],
                                   ["Engagement Level", a.engagement]
                                ]}
                              />
                              <button onClick={() => onMessage?.(a)} style={{ fontSize: 10, padding: "6px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, color: "#166534", cursor: "pointer", fontWeight: 800 }}>MESSAGE</button>
                              <button onClick={() => onEdit?.(a, 'alumni')} style={{ fontSize: 10, padding: "6px 12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#b45309", cursor: "pointer", fontWeight: 800 }}>EDIT</button>
                              <button onClick={() => onDelete?.(a)} style={{ fontSize: 10, padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 800 }}>DELETE</button>
                            </div>
                          </td>
                        </tr>
                      ));
                      return [header, ...body];
                    })
                  )}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>No alumni results match your search criteria.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── ADMISSIONS TAB ──────────────────────────────────────────────────────────

const AdmissionsTab = ({ data, onEdit, onDelete, onHistory, onDownloadTemplate, cohortFilter, setCohortFilter, onEvaluateEligibility, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
    const { applications, metrics, students } = data;
    const [statusFilter, setStatusFilter] = useState("All");
    const [search, setSearch] = useState("");
    
    // Enrich applications with Registry synchronization data
    const enrichedApplications = (applications || []).map(a => {
      const email = normEmail(a.email || a.personalEmail);
      const matric = (a.matricNo || "").trim().toLowerCase();
      
      const matchingStudent = (students || []).find(s => 
        (matric && (s.id || s.matricNo || "").trim().toLowerCase() === matric) ||
        (email && normEmail(s.email) === email) ||
        (email && normEmail(s.personalEmail) === email)
      );

      // Standardize original status for comparison and filtering
      const rawStatus = (a.status || "Pending").trim().toLowerCase();
      
      let smartStatus = "Pending";
      if (matchingStudent || /^(admitted|approved|successful|accepted)$/i.test(rawStatus)) {
        smartStatus = "Admitted";
      } else if (/^(not admitted|rejected|denied|failed|unsuccessful)$/i.test(rawStatus)) {
        smartStatus = "Not Admitted";
      }

      return {
        ...a,
        isPulled: !!matchingStudent,
        registryCohort: matchingStudent?.cohort,
        originalStatus: a.status || "Pending",
        effectiveStatus: smartStatus
      };
    });

    const filtered = enrichedApplications.filter(a => {
      const matchCohort = cohortFilter === "All Cohorts" || a.cohort === cohortFilter || a.registryCohort === cohortFilter;
      const matchStatus = statusFilter === "All" || a.effectiveStatus === statusFilter;
      const matchSearch = !search || 
                          (a.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
                          (a.prog || "").toLowerCase().includes(search.toLowerCase());
      return matchCohort && matchStatus && matchSearch;
    }).slice().sort(sortByCohortThenProgramme);

    // Calculate Top 5 Common Reasons for Non-Admission (Phase 2 Requirement)
    const reasonCounts = {};
    applications?.forEach(a => {
      if (a.status === 'Not Admitted') {
        const list = (a.nonAdmissionReasons && a.nonAdmissionReasons.length)
          ? a.nonAdmissionReasons
          : (a.nonAdmissionReason ? [a.nonAdmissionReason] : []);
        list.forEach((r) => {
          if (r) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        });
      }
    });
    const topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return (
      <div style={{ animation: "fadeIn 0.5s ease-out" }}>
        <SectionHeader 
          title="Admissions Hub Intelligence" 
          subtitle="Manage applicants, evaluate credentials, and orchestrate institutional intake" 
        />
        {/* Smart Analytics Summary calculated locally to match table logic */}
        <ModuleAnalyticsStrip
          color="#10b981"
          title="Admission Hub Intelligence — Real-time Synchronization"
          rows={[
            { label: "Total Applications", value: enrichedApplications.length },
            { 
              label: "Admission Rate", 
              value: enrichedApplications.length > 0 
                ? `${((enrichedApplications.filter(a => a.effectiveStatus === 'Admitted').length / enrichedApplications.length) * 100).toFixed(1)}%`
                : "0%"
            },
            { label: "Pending", value: enrichedApplications.filter(a => a.effectiveStatus === 'Pending').length },
            { label: "Admitted", value: enrichedApplications.filter(a => a.effectiveStatus === 'Admitted').length },
            { label: "Not Admitted", value: enrichedApplications.filter(a => a.effectiveStatus === 'Not Admitted').length },
          ]}
        />

        {/* Reason Analytics Section (Additional 3) */}
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 20, padding: 24, marginBottom: 28, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}>
           <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a8a", marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.5 }}>Reasons for Non-Admission (Top 5)</div>
           <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 16 }}>
              {topReasons.length > 0 ? topReasons.map((r, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                   <div style={{ position: "relative", width: "100%", background: "#f1f5f9", borderRadius: "8px 8px 0 0", height: `${(r.count / Math.max(...topReasons.map(x => x.count))) * 100}%`, transition: "height 1s ease-out" }}>
                      <div style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", fontSize: 12, fontWeight: 800, color: "#1e3a8a" }}>{r.count}</div>
                   </div>
                   <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 8, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", width: "100%", whiteSpace: "nowrap" }}>{r.reason}</div>
                </div>
              )) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, border: "1px dashed #e2e8f0", borderRadius: 12 }}>No non-admission data logged yet.</div>
              )}
           </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 24, padding: 32, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
              <input 
                placeholder="Search applicants by name, email or programme..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "14px 14px 14px 52px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, outline: "none", fontSize: 14, fontWeight: 500 }}
              />
            </div>
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              style={{ padding: "0 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, fontSize: 13, fontWeight: 700, color: "#0f172a", outline: "none" }}
            >
              <option value="All Cohorts">All Cohorts</option>
              {ACETEL_COHORTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "0 24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, fontSize: 13, fontWeight: 700, color: "#1e3a8a", outline: "none" }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Admitted">Admitted</option>
              <option value="Not Admitted">Not Admitted</option>
            </select>
            <button
              type="button"
              onClick={() => onEvaluateEligibility && onEvaluateEligibility()}
              style={{ background: "#059669", color: "#fff", border: "none", padding: "0 20px", borderRadius: 16, fontWeight: 800, fontSize: 13, cursor: "pointer", height: 48 }}
            >
              ⚙️ Run eligibility rules
            </button>
            <button
              onClick={() => onEdit({ name: '', email: '', phone: '', programme: '', status: 'Pending', nonAdmissionReason: '', _isNew: true }, 'application')}
              style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 16, fontWeight: 800, fontSize: 13, cursor: 'pointer', height: 48 }}
            >
              + Add Application
            </button>
            <button onClick={() => onDownloadTemplate('Admissions', 'Admissions_Template.xlsx')} style={{ background: "#f1f5f9", color: "#1e3a8a", border: "1px solid #e2e8f0", padding: "0 24px", borderRadius: 16, fontWeight: 800, fontSize: 13, cursor: "pointer", height: 48 }}>⬇ Template</button>
            <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 16, padding: "0 20px", fontSize: 13, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800, height: 48 }}>
                🗑️ Bulk Delete ({selectedIds.length})
            </button>
            <label style={{ background: '#008751', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 16, fontWeight: 800, fontSize: 13, cursor: 'pointer', height: 48, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚀 Bulk Admission
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => onHistory && onHistory(e, 'Admissions')} />
            </label>
          </div>

          <div style={{ border: "1px solid #f1f5f9", borderRadius: 20, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "18px 24px", width: 40 }}>
                     <input type="checkbox" checked={filtered.length > 0 && filtered.every(x => selectedIds.includes(x._id || x.id))} onChange={() => toggleAll(filtered)} />
                  </th>
                  {["Applicant Details", "Cohort", "Programme Selection", "Admission Status", "Rejection / deficiency notes", "Pull Status", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "18px 24px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.2s", background: selectedIds.includes(a._id || a.id) ? "rgba(30, 58, 138, 0.05)" : "transparent" }}>
                    <td style={{ padding: "20px 24px" }}>
                      <input type="checkbox" checked={selectedIds.includes(a._id || a.id)} onChange={() => toggleSelect(a._id || a.id)} />
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{a.email}</div>
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: a.registryCohort && a.registryCohort !== a.cohort ? "#1e3a8a" : "#475569" }}>
                        {a.registryCohort || a.cohort || "—"}
                        {a.registryCohort && a.registryCohort !== a.cohort && <div style={{ fontSize: 9, color: "#64748b", fontWeight: 400 }}>(Registry Match)</div>}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 6 }}>{a.prog}</span>
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 900, 
                        background: a.effectiveStatus === 'Admitted' ? "#dcfce7" : (a.effectiveStatus === 'Not Admitted' ? "#fee2e2" : "#fef3c7"), 
                        color: a.effectiveStatus === 'Admitted' ? "#166534" : (a.effectiveStatus === 'Not Admitted' ? "#991b1b" : "#92400e"), 
                        padding: "6px 12px", 
                        borderRadius: 20, 
                        textTransform: "uppercase",
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2
                      }}>
                        {a.effectiveStatus}
                        {a.isPulled && a.originalStatus !== "Admitted" && <span style={{ fontSize: 8, opacity: 0.7 }}>(Sync Admitted)</span>}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px", maxWidth: 280, fontSize: 11, color: "#991b1b", lineHeight: 1.4, fontWeight: 600 }}>
                      {a.status === 'Not Admitted'
                        ? ((a.nonAdmissionReasons && a.nonAdmissionReasons.length)
                          ? a.nonAdmissionReasons.join('; ')
                          : (a.nonAdmissionReason || '—'))
                        : '—'}
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      {a.isPulled ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, background: "#059669", borderRadius: "50%" }}></div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Auto-Pulled</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Not Synchronized</span>
                      )}
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                       <button onClick={() => onEdit(a)} style={{ background: a.isPulled ? "#f1f5f9" : "#1e3a8a", color: a.isPulled ? "#64748b" : "#fff", border: "none", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                         {a.isPulled ? "Details" : "Edit / Admit"}
                       </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={14} style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>📥</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>No applicants found matching this view.</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Upload an Excel file or change your filters to see records.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

// ─── COURSES TAB ─────────────────────────────────────────────────────────────

const AcademicCoursesTab = ({ category, data, onEdit, onDelete, onAddCourse, onDownloadTemplate, onBulkUpload, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const { courses } = data;
  const [exportProg, setExportProg] = useState("All Programmes");
  const [exportSem, setExportSem] = useState("All Semesters");
  const [listLayout, setListLayout] = useState("grouped");
  const filtered = courses?.filter(c => c.cat === category) || [];
  const normalizeCourseSemester = (course) => parseSemesterValue(course.sem ?? course.semester);
  const displayRows = filtered
    .filter(c => exportProg === "All Programmes" || c.programme === exportProg)
    .filter(c => exportSem === "All Semesters" || normalizeCourseSemester(c) === Number(exportSem))
    .slice()
    .sort((a, b) => progRank(a.programme || "") - progRank(b.programme || "") || normalizeCourseSemester(a) - normalizeCourseSemester(b));
  const courseTree = groupCoursesByProgrammeThenSemester(
    displayRows,
    (n) => SEMESTER_LABELS[Number(n)] || `Semester ${n}`
  );
  const PROGS = [
    "MSc Artificial Intelligence", "MSc Cybersecurity", "MSc Management Information System",
    "PhD Artificial Intelligence", "PhD Cybersecurity", "PhD Management Information System"
  ];

  return (
    <div className="animate-dash">
      <SectionHeader title={`${category} Course Registry`} subtitle={`Managing official academic modules for ${category} curriculum`} />
      {category === "Core" && analyticsSummary?.courses && (
        <ModuleAnalyticsStrip
          color="#1e3a8a"
          title="Courses — catalogue distribution (all time; programme × semester filters below)"
          rows={[
            { label: "Total modules", value: analyticsSummary.courses.total },
            ...(analyticsSummary.courses.byProgramme || [])
              .filter((p) => p.programme)
              .sort((a, b) => progRank(a.programme) - progRank(b.programme))
              .map((p) => ({ label: p.programme.slice(0, 26), value: p.count })),
            ...(analyticsSummary.courses.bySemester || []).sort((a, b) => a.semester - b.semester).map((s) => ({ label: `Semester ${s.semester}`, value: s.count })),
          ]}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {PROGS.map(p => (
          <SubStatCard key={p} label={p} value={filtered.filter(c => c.programme === p).length} icon="📘" color="#1e3a8a" />
        ))}
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <SectionHeader title={`${category} Courses - Full List`} subtitle={`${filtered.length} modules in ${category} · ${displayRows.length} shown after filters`} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select value={exportProg} onChange={e => setExportProg(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 700 }}>
              <option value="All Programmes">All programmes (export)</option>
              {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={exportSem} onChange={e => setExportSem(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 700 }}>
              <option value="All Semesters">All semesters</option>
              <option value="1">First Semester</option>
              <option value="2">Second Semester</option>
              <option value="3">Third Semester</option>
            </select>
            <div style={{ display: "flex", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <button type="button" onClick={() => setListLayout("grouped")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "grouped" ? "#1e3a8a" : "#fff", color: listLayout === "grouped" ? "#fff" : "#64748b" }}>Programme → Semester</button>
              <button type="button" onClick={() => setListLayout("flat")} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: listLayout === "flat" ? "#1e3a8a" : "#fff", color: listLayout === "flat" ? "#fff" : "#64748b" }}>Flat</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, background: "rgba(30,58,138,0.05)", padding: "4px", borderRadius: 12, border: "1px solid rgba(30,58,138,0.1)" }}>
            <button 
              onClick={() => onAddCourse(category)} 
              style={{ background: "#1e3a8a", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
            >
              + ADD {category.toUpperCase()} COURSE
            </button>
            <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
                disabled={selectedIds.length === 0}
                style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
                🗑️ BULK DELETE ({selectedIds.length})
            </button>
            <ExportButton 
              fileName={`ACETEL_${category}_Courses`} 
              title={`${category} Course Registry`}
              headers={[["Code", "Title", "Programme", "Category", "Semester"]]}
              data={displayRows.map(c => [c.code, c.title, c.programme, category, SEMESTER_LABELS[normalizeCourseSemester(c)] || `Semester ${normalizeCourseSemester(c)}`])}
            />
            <label style={{ background: "rgba(30,58,138,0.85)", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              📥 Bulk Upload
              <input type="file" style={{ display: "none" }} onChange={e => onBulkUpload && onBulkUpload(e, `Academic_Courses:${category}`)} />
            </label>
            <button 
              onClick={() => onDownloadTemplate && onDownloadTemplate("Academic_Courses")}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#475569", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
            >
              📄 Template
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 14px", width: 40 }}>
                  <input 
                    type="checkbox" 
                    checked={displayRows.length > 0 && displayRows.every(c => selectedIds.includes(c.id))}
                    onChange={(e) => {
                      const ids = e.target.checked ? displayRows.map(c => c.id) : [];
                      onSelectionChange(ids);
                    }}
                  />
                </th>
                {["Course Code", "Course Title", "Programme", "Semester", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 10, color: "#64748b", fontWeight: 700, borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLayout === "flat"
                ? displayRows.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) onSelectionChange([...selectedIds, c.id]);
                        else onSelectionChange(selectedIds.filter(id => id !== c.id));
                      }}
                    />
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#1e3a8a", fontFamily: "'Space Mono', monospace" }}>{c.code}</td>
                  <td style={{ padding: "14px", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{c.title}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>{c.programme}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{SEMESTER_LABELS[normalizeCourseSemester(c)] || `Semester ${normalizeCourseSemester(c)}`}</td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEdit?.(c)} style={{ fontSize: 10, padding: "6px 10px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#008751", cursor: "pointer", fontWeight: 800 }}>EDIT</button>
                      <button onClick={() => onDelete?.(c)} style={{ fontSize: 10, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 800 }}>DELETE</button>
                    </div>
                  </td>
                </tr>
              ))
                : courseTree.flatMap((pg) => {
                    const headerProg = (
                      <tr key={`ch-prog-${category}-${pg.programme}`} style={{ background: "#eff6ff" }}>
                        <td colSpan={6} style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, color: "#1e40af" }}>
                          Programme: {pg.programme} · {category}
                        </td>
                      </tr>
                    );
                    const semBlocks = pg.semesters.flatMap((sem) => {
                      const headerSem = (
                        <tr key={`ch-sem-${category}-${pg.programme}-${sem.semester}`} style={{ background: "#f8fafc" }}>
                          <td colSpan={6} style={{ padding: "8px 14px 8px 28px", fontWeight: 700, fontSize: 11, color: "#475569" }}>
                            {sem.label} ({sem.items.length} modules)
                          </td>
                        </tr>
                      );
                      const rows = sem.items.map((c, i) => (
                        <tr key={`${c.id}-${sem.semester}-${i}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px" }}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked) onSelectionChange([...selectedIds, c.id]);
                                else onSelectionChange(selectedIds.filter(id => id !== c.id));
                              }}
                            />
                          </td>
                          <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#1e3a8a", fontFamily: "'Space Mono', monospace" }}>{c.code}</td>
                          <td style={{ padding: "14px", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{c.title}</td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>{c.programme}</td>
                          <td style={{ padding: "14px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{SEMESTER_LABELS[normalizeCourseSemester(c)] || `Semester ${normalizeCourseSemester(c)}`}</td>
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => onEdit?.(c)} style={{ fontSize: 10, padding: "6px 10px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#008751", cursor: "pointer", fontWeight: 800 }}>EDIT</button>
                              <button onClick={() => onDelete?.(c)} style={{ fontSize: 10, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 800 }}>DELETE</button>
                            </div>
                          </td>
                        </tr>
                      ));
                      return [headerSem, ...rows];
                    });
                    return [headerProg, ...semBlocks];
                  })}
              {displayRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
                     <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                     <div style={{ fontSize: 14, fontWeight: 700 }}>No {category.toLowerCase()} courses found in this portfolio.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── AI INSIGHTS TAB ─────────────────────────────────────────────────────────

const AITab = ({ data, analyticsSummary }) => {
  const { students, metrics } = data;
  const insights = analyticsSummary?.ai?.insights || [];
  const atRisk = analyticsSummary?.ai?.atRiskApplicants || [];
  const admRate = analyticsSummary?.applications?.admissionRate;

  const trendChartData =
    (analyticsSummary?.applications?.monthlyTrend || []).length > 0
      ? analyticsSummary.applications.monthlyTrend.map((t) => ({
          year: String(t.period || ""),
          predicted: t.count,
          actual: Math.max(0, Math.round((t.count || 0) * 0.94)),
        }))
      : graduationPredictions;

  const programmeDemandChart =
    (analyticsSummary?.programmes?.popularity || [])
      .filter((p) => p.programme)
      .slice(0, 8)
      .map((p) => ({
        name: String(p.programme).replace("Management Information System", "MIS").replace("Artificial Intelligence", "AI").slice(0, 22),
        applications: p.applications || 0,
        students: p.students || 0,
      })) || [];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', background: '#f8fafc', minHeight: 400, padding: 4 }}>
      <div style={{ background: "rgba(0,135,81,0.04)", border: "1px solid rgba(0,135,81,0.12)", borderRadius: 16, padding: 20, marginBottom: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 36 }}>🤖</div>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", fontFamily: "'Syne', sans-serif" }}>ACETEL AI Intelligence Engine</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
            Rule-based insights and at-risk applicant signals from the same date-filtered <code style={{ fontSize: 12 }}>/api/analytics/summary</code> bundle used on the Overview tab.
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            [String(atRisk.length), "At-risk (pending)", "#ef4444"],
            [insights.length ? String(insights.length) : "—", "Live insights", "#8b5cf6"],
            [admRate != null ? `${Number(admRate).toFixed(1)}%` : "—", "Admission rate", "#008751"],
          ].map(([v, l, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: c, fontFamily: "'Space Mono', monospace" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <SectionHeader title="Application volume trend" subtitle="Monthly applications in the selected analytics window (bars: heuristic forecast)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} />
              <YAxis stroke="#cbd5e1" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", color: "#1e293b" }} />
              <Legend wrapperStyle={{ color: "#475569", fontSize: 12, fontWeight: 500 }} />
              <Bar dataKey="predicted" fill="#008751" name="Applications" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#10b981" name="Heuristic trend" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <SectionHeader title="Programme demand" subtitle="Applications vs registered students by programme" />
          {programmeDemandChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={programmeDemandChart} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }} interval={0} angle={-16} textAnchor="end" height={44} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                <Bar dataKey="students" fill="#1F7A63" name="Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" fill="#C9A227" name="Applications" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <SectionHeader title="Model benchmarks (placeholder)" subtitle="Replace when external ML scores are wired" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {aiModelAccuracy.map((m, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{m.metric}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a", fontFamily: "'Space Mono', monospace" }}>{m.score}%</span>
                    </div>
                    <ProgressBar value={m.score} max={100} color={i === 0 ? "#1e3a8a" : i === 1 ? "#3b82f6" : "#6366f1"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <SectionHeader title="Insight engine output" subtitle="Heuristics over filtered aggregates (not generative LLM)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 260, overflowY: "auto" }}>
            {insights.length === 0 && (
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>No insights yet — widen the date range on Overview or refresh data.</div>
            )}
            {insights.map((ins, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{ins.title}</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{ins.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <SectionHeader title="At-risk applicants (pending)" subtitle="Missing checklist items or CGPA below threshold" />
          <div style={{ overflowX: "auto", maxHeight: 260, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Name", "Programme", "Reasons"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atRisk.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a" }}>{row.name}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{row.programme || "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{(row.reasons || []).join("; ")}</td>
                  </tr>
                ))}
                {atRisk.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                      No pending at-risk rows in the current window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <SectionHeader title="Per-Student AI Predictions" subtitle="Individual graduation forecast & risk flags" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Student", "Programme", "Grad Year", "AI Confidence", "Risk", "Courses", "Action"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 0.8, borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 10).map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{s.name}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>{s.prog}</td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#059669", fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>{s.gradYear || 2026}</td>
                  <td style={{ padding: "14px" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                       <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                         <div style={{ width: `${85 + (i * 2)}%`, height: "100%", background: "#1e3a8a", borderRadius: 2 }} />
                       </div>
                       <span style={{ fontSize: 11, fontWeight: 800, color: "#1e3a8a" }}>{85 + (i * 2)}%</span>
                     </div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <Badge text={i % 4 === 0 ? "High" : "Low"} type={i % 4 === 0 ? "HIGH" : "LOW"} />
                  </td>
                  <td style={{ padding: "14px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>CIT-801, CIT-811...</td>
                  <td style={{ padding: "14px" }}>
                    <button style={{ fontSize: 10, padding: "6px 12px", background: "#1e3a8a", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 800 }}>VIEW INSIGHTS</button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
                     <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                     <div style={{ fontSize: 14, fontWeight: 700 }}>No student data available for AI predictions yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── RECRUITMENT MAP TAB ─────────────────────────────────────────────────────

const RecruitmentTab = ({ data }) => {
  const nationalities = data.nationalities || [];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KPICard title="Countries" value={nationalities?.length || 0} trend="global reach" sub="" icon="🌍" color="#3b82f6" />
        <KPICard title="Top Country" value={nationalities?.sort((a,b) => b.count - a.count)?.[0]?.country || "None"} trend="" sub="" icon="📍" color="#10b981" />
        <KPICard title="International Rate" value="0%" trend="of enrolment" sub="" icon="✈️" color="#8b5cf6" />
        <KPICard title="New Regions" value="0" trend="expansion" sub="" icon="📍" color="#f59e0b" />
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <SectionHeader title="Global Student Recruitment Map" subtitle="Geographic distribution of enrolled students" />
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, position: "relative", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#334155", fontSize: 14, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
            <div style={{ color: "#1e3a8a", fontWeight: 800 }}>Interactive Recruitment Map</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, fontWeight: 600 }}>Renders with core analytics integration</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 24 }}>
              {nationalities.slice(0, 8).map((n, i) => (
                <div key={i} style={{
                  width: Math.max(45, n.count * 1.5), height: Math.max(45, n.count * 1.5),
                  borderRadius: "50%", background: "rgba(30,58,138,0.08)",
                  border: `2px solid rgba(30,58,138,0.2)`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#475569", transition: "all 0.3s"
                }}>
                  <div style={{ fontWeight: 900, color: "#1e3a8a" }}>{n.count}</div>
                  <div style={{ fontSize: 8, fontWeight: 700 }}>{n.country?.slice(0, 6) || "N/A"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <SectionHeader title="Students by Country" subtitle="Full breakdown of nationalities" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {nationalities.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#008751", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: "#475569", fontWeight: 500 }}>{n.country}</span>
              <div style={{ flex: 2 }}>
                <ProgressBar value={n.count} max={nationalities?.sort((a,b) => b.count-a.count)?.[0]?.count || 100} color="#008751" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'Space Mono', monospace", width: 28, textAlign: "right" }}>{n.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── USER MANAGEMENT TAB ─────────────────────────────────────────────────────

const PERMISSION_LABELS = {
  all: "Full System Access",
  view_dashboard: "View Dashboard",
  manage_students: "Manage Students",
  view_students: "View Students",
  manage_supervisors: "Manage Courses",
  view_supervisors: "View Courses",
  manage_admissions: "Manage Admissions",
  view_admissions: "View Admissions",
  view_ai: "View AI Insights",
  view_recruitment: "View Recruitment Map",
  upload_data: "Upload Data",
  view_logs: "View Audit Logs",
  manage_integrations: "Manage Integrations",
};

const EMPTY_FORM = { name: "", email: "", phone: "", role: "", dept: "", password: "", confirmPassword: "" };

const DEPT_GROUPS = [
  { key: "Artificial Intelligence", label: "Artificial Intelligence", icon: "🤖", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", match: ["artificial", "ai"] },
  { key: "Cybersecurity", label: "Cybersecurity", icon: "🛡️", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", match: ["cybersecurity", "cyber"] },
  { key: "Management Information System", label: "Management Information System", icon: "📊", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", match: ["management", "mis", "information system"] },
  { key: "General Courses", label: "General Courses", icon: "📚", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", match: [] },
];

const FacilitatorsTab = ({ data, onEdit, onDelete, onHistory, onAddUser, onDownloadTemplate, onAddCoordinator, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
  const facilitators = data?.facilitators || [];
  const activeCount = facilitators.filter(f => f?.status === "Active").length;
  const avgLoad = facilitators.length > 0 ? (facilitators.reduce((acc, f) => acc + (f?.load || 0), 0) / facilitators.length) : 0;
  const depts = Array.from(new Set(facilitators.map(f => f?.dept || "Unknown"))).length;

  const PROGS = [
    { name: "MSc Artificial Intelligence", coord: "Dr. Adebayo Omotola" },
    { name: "MSc Cybersecurity", coord: "Prof. Sarah Jenkins" },
    { name: "MSc Management Information System", coord: "Dr. Ibrahim Musa" },
    { name: "PhD Artificial Intelligence", coord: "Dr. Linda Chen" },
    { name: "PhD Cybersecurity", coord: "Prof. Robert Smith" },
    { name: "PhD Management Information System", coord: "Dr. Amina Yusuf" }
  ];

  const coordinatorForFacilitator = (f) => {
    const progFromCourse = (f.facilitatorCourses || []).map((fc) => fc.programme).find(Boolean);
    if (progFromCourse) {
      const hit = PROGS.find((p) => p.name === progFromCourse);
      if (hit) return hit.coord;
    }
    return "—";
  };

  const getDiscipline = (prog) => {
    const p = (prog || "").toLowerCase();
    if (p.includes("artificial") || p.includes("ai")) return "artificial";
    if (p.includes("cyber")) return "cybersecurity";
    if (p.includes("management") || p.includes("mis") || p.includes("system") || p.includes("information")) return "management";
    return "general";
  };

  const getFacCount = (p) => {
    const disc = getDiscipline(p);
    const keywords = disc === "management" ? ["management", "mis", "information system", "system"] : [disc];
    return facilitators?.filter(f => {
      const d = (f.dept || "").toLowerCase();
      const e = (f.expertise || "").toLowerCase();
      return keywords.some(k => d.includes(k) || e.includes(k));
    }).length || 0;
  };

  const groupFacilitators = (groupKey) => {
    const group = DEPT_GROUPS.find(g => g.key === groupKey);
    if (!group) return [];

    if (groupKey === "General Courses") {
      return facilitators.filter(f => {
        const d = (f.dept || "").toLowerCase();
        // Return true if it DOES NOT match any of the first 3 groups
        return !DEPT_GROUPS.slice(0, 3).some(g => 
          g.match.some(m => d.includes(m))
        );
      });
    }

    return facilitators.filter(f => {
      const d = (f.dept || "").toLowerCase();
      // Returns true if the department includes any of the matching keywords
      return group.match.some(m => d.includes(m));
    });
  };

  return (
    <div className="animate-dash">
      <SectionHeader title="Academic Facilitator Analytics" subtitle="Detailed instructional capacity by programme and degree level" />
      {analyticsSummary?.facilitators && (
        <ModuleAnalyticsStrip
          color="#f59e0b"
          title="Facilitators — workload snapshot (course assignments in profile)"
          rows={[
            { label: "Facilitator accounts", value: analyticsSummary.facilitators.total },
            ...(analyticsSummary.facilitators.workload || []).slice(0, 5).map((w) => ({
              label: (w.name || "—").slice(0, 22),
              value: w.assignments ?? 0,
            })),
          ]}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {PROGS.map(p => (
          <SubStatCard key={p.name} label={p.name} value={getFacCount(p.name)} icon="🧑‍🏫" color="#3b82f6" subValue={`Coordinator: ${p.coord}`}>
             <div style={{ display: "flex", gap: 8 }}>
               <button 
                 onClick={() => onAddUser && onAddUser(p.name)} 
                 style={{ flex: 1, background: "rgba(0,135,81,0.08)", border: "1px solid rgba(0,135,81,0.2)", borderRadius: 8, padding: "6px", color: "#008751", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
               >
                 + Add User
               </button>
               <label style={{ flex: 1, background: "rgba(30,58,138,0.08)", border: "1px solid rgba(30,58,138,0.2)", borderRadius: 8, padding: "6px", color: "#1e3a8a", fontSize: 10, fontWeight: 800, cursor: "pointer", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                 📥 Bulk
                 <input type="file" style={{ display: "none" }} onChange={e => onHistory && onHistory(e, "Facilitators")} />
               </label>
             </div>
          </SubStatCard>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionHeader title="Academic Facilitators" subtitle="Grouped by Discipline · AI · Cybersecurity · MIS · General Courses" />
        <div style={{ display: "flex", gap: 8, background: "rgba(0,135,81,0.05)", padding: "4px", borderRadius: 12, border: "1px solid rgba(0,135,81,0.12)" }}>
          <button 
            onClick={onAddCoordinator} 
            style={{ background: "#3b82f6", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
          >
            + ADD PROGRAMME COORDINATORS
          </button>
          <button 
            onClick={onAddUser} 
            style={{ background: "#008751", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
          >
            + ADD USER
          </button>
          <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
            disabled={selectedIds.length === 0}
            style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
            🗑️ BULK DELETE ({selectedIds.length})
          </button>
          <ExportButton 
            fileName="ACETEL_Facilitators" 
            title="Academic Facilitator Directory"
            headers={[["Name", "Programme coordinator", "Department", "Expertise", "Email", "Status", "Course attachments (code · programme · semester · category)"]]}
            data={facilitators.map(f => [
              f.name,
              coordinatorForFacilitator(f),
              f.dept,
              f.expertise,
              f.email,
              f.status,
              (f.facilitatorCourses || []).map(fc => `${fc.courseCode} · ${fc.programme} · Sem ${fc.semester} · ${fc.category}`).join(' | ') || '—'
            ])}
          />
          <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            📥 Bulk Upload
            <input type="file" style={{ display: "none" }} onChange={e => onHistory && onHistory(e, "Facilitators")} />
          </label>
          <button 
            onClick={() => onDownloadTemplate && onDownloadTemplate("Facilitators")}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#475569", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
          >
            📄 Template
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 24 }}>
        {DEPT_GROUPS.map(group => {
          const members = groupFacilitators(group.key);
          return (
            <div key={group.key}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 16px", background: group.bg, border: `1px solid ${group.border}`, borderRadius: 10 }}>
                <span style={{ fontSize: 20 }}>{group.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: group.color, fontFamily: "'Syne', sans-serif" }}>{group.label}</span>
                <button 
                  onClick={() => toggleAll(members)}
                  style={{ marginLeft: 12, background: "#fff", border: `1px solid ${group.color}40`, borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: group.color, cursor: "pointer" }}
                >
                  {members.every(x => selectedIds.includes(x._id || x.id)) ? "Deselect All" : "Select All"}
                </button>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: `${group.color}25`, color: group.color, border: `1px solid ${group.color}40`, display: "flex", alignItems: "center", gap: 6 }}>
                   <span style={{ fontSize: 14 }}>{members.length}</span>
                   <span>Facilitator{members.length !== 1 ? "s" : ""}</span>
                </span>
              </div>

              {members.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "16px 0", fontStyle: "italic", fontWeight: 500 }}>
                  No facilitators registered under this discipline yet.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {members.map((f, i) => (
                    <div key={i} style={{ background: "#ffffff", border: `2px solid ${selectedIds.includes(f._id || f.id) ? group.color : group.border}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.01)", position: "relative" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(f._id || f.id)}
                        onChange={() => toggleSelect(f._id || f.id)}
                        style={{ position: "absolute", top: 12, right: 12, width: 18, height: 18, cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: group.bg, border: `1px solid ${group.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          {group.icon}
                        </div>
                        <div>
                          {f.title && <div style={{ fontSize: 10, color: group.color, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>{f.title}</div>}
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{f.name}</div>
                          {(f.surname || f.otherNames) && f.name !== `${f.surname} ${f.otherNames}`.trim() && (
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 1, fontWeight: 500 }}>
                              {f.surname && <span><b>Surname:</b> {f.surname} </span>}
                              {f.otherNames && <span><b>Other names:</b> {f.otherNames}</span>}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: group.color, fontWeight: 700, marginTop: 2 }}>{f.dept}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginBottom: 10, lineHeight: 1.6, fontWeight: 500 }}>
                        <b style={{ color: "#0f172a" }}>Expertise: </b>{f.expertise || "N/A"}
                      </div>
                      <div style={{ fontSize: 11, color: "#334155", marginBottom: 10, lineHeight: 1.55, fontWeight: 500 }}>
                        <b style={{ color: "#0f172a" }}>Course attachments: </b>
                        {(f.facilitatorCourses || []).length
                          ? (f.facilitatorCourses || []).map((fc, idx) => (
                              <span key={idx} style={{ display: "block", marginTop: 4 }}>
                                {fc.courseCode} · {fc.programme} · {SEMESTER_LABELS[fc.semester] || `Semester ${fc.semester}`} · {fc.category}
                              </span>
                            ))
                          : "— Link modules via Edit (JSON array)."}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📧</span> {f.email || "N/A"}
                        </div>
                        {f.phone && (
                          <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>📞</span> {f.phone}
                          </div>
                        )}
                        {f.office && (
                          <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>🚪</span> Office: {f.office}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 16, borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: 12 }}>
                        <ExportButton 
                          variant="icon" 
                          fileName={`Facilitator_${f.id || 'N/A'}`} 
                          title={`Facilitator Profile: ${f.name}`}
                          headers={[["Field", "Value"]]}
                          data={[
                             ["Full Name", f.name],
                             ["Department", f.dept],
                             ["Expertise", f.expertise],
                             ["Email", f.email],
                             ["Phone", f.phone],
                             ["Office", f.office]
                          ]}
                        />
                        <button onClick={() => onEdit?.(f, 'facilitator')} style={{ flex: 1, fontSize: 10, padding: "6px 8px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: 6, color: "#d97706", cursor: "pointer", fontWeight: 700 }}>Edit</button>
                        <button onClick={() => onDelete?.(f)} style={{ flex: 1, fontSize: 10, padding: "6px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                        <button onClick={() => onHistory?.(f)} style={{ flex: 1, fontSize: 10, padding: "6px 8px", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 6, color: "#1e40af", cursor: "pointer", fontWeight: 700 }}>Log</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {facilitators.length === 0 && (
          <div style={{ color: "#475569", textAlign: "center", padding: 40 }}>No facilitators records found. Please upload list.</div>
        )}
      </div>
    </div>
  );
};

const ShortCoursesTab = ({ data, onBulkUpload, onAddCourse, onEdit, onDelete, onAddParticipant, onDownloadTemplate, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
  const { shortCourses } = data;
  const totalTrained = shortCourses?.reduce((acc, c) => acc + (c.studentsCount || (c.participants?.length || 0)), 0) || 0;
  const activeCount = shortCourses.filter(c => c.status === "Active").length;
  const [expandedCourse, setExpandedCourse] = useState(null);

  return (
    <div className="animate-dash">
      <SectionHeader title="Short Courses Hub" subtitle="Management of specialized professional certifications" />
      {analyticsSummary?.shortCourses != null && (
        <ModuleAnalyticsStrip
          color="#0ea5e9"
          title="Programmes hub — short courses (catalogue count)"
          rows={[{ label: "Short course records", value: analyticsSummary.shortCourses.total }]}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, flex: 1 }}>
          <SubStatCard label="Total Individual Trained" value={totalTrained} icon="🎓" color="#0ea5e9" />
          <SubStatCard label="Total Currently on Training" value={activeCount * 12} icon="⏳" color="#f59e0b" />
          <SubStatCard label="Current Active Training" value={activeCount} icon="🌐" color="#059669" />
        </div>
        <div style={{ marginLeft: 24, display: "flex", gap: 8, background: "#f8fafc", padding: "4px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <button 
            onClick={onAddCourse} 
            style={{ background: "#0ea5e9", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
          >
            + ADD SHORT COURSE
          </button>
          <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
              disabled={selectedIds.length === 0}
              style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
              🗑️ BULK DELETE ({selectedIds.length})
          </button>
          <ExportButton 
            fileName="ACETEL_Short_Courses" 
            title="Institutional Short Courses Portfolio"
            headers={[["Course Title", "Duration", "Enrollment", "Status"]]}
            data={shortCourses.map(c => [c.title, c.duration, c.studentsCount || (c.participants?.length || 0), c.status])}
          />
          <button 
            onClick={() => toggleAll(shortCourses)}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#64748b", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
          >
            {shortCourses.length > 0 && shortCourses.every(x => selectedIds.includes(x._id || x.id)) ? "Deselect All" : "Select All"}
          </button>
          <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            📥 Bulk Upload
            <input type="file" style={{ display: "none" }} onChange={e => onBulkUpload && onBulkUpload(e, "ShortCourses")} />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <SectionHeader title="Training Registry" subtitle="Operational short course modules" />
        <button onClick={onAddCourse} style={{ background: "#008751", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>+ ADD NEW HUB</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {shortCourses.map((c, i) => (
          <div key={i} className="premium-card" style={{ padding: 24, position: "relative", border: `2px solid ${selectedIds.includes(c._id || c.id) ? "#0ea5e9" : "transparent"}` }}>
            <input 
              type="checkbox" 
              checked={selectedIds.includes(c._id || c.id)}
              onChange={() => toggleSelect(c._id || c.id)}
              style={{ position: "absolute", top: 12, right: 12, width: 18, height: 18, cursor: "pointer", zIndex: 10 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{c.title}</div>
              <Badge text={c.status} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 20, fontWeight: 600 }}>
              <span>⏱ {c.duration}</span>
              <span style={{ color: "#008751" }}>👥 {c.studentsCount || c.participants?.length || 0} Trained</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
               <button onClick={() => setExpandedCourse(expandedCourse === i ? null : i)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>{expandedCourse === i ? "Close List" : "Participants"}</button>
               <ExportButton 
                 variant="icon" 
                 fileName={`ShortCourse_${c.id}`} 
                 title={`Course Registry: ${c.title}`}
                 headers={[["Name", "Email", "Phone", "Role", "Status"]]}
                 data={(c.participants || []).map(p => [p.name, p.email, p.phone, p.role, p.status])}
               />
               <button onClick={() => onAddParticipant(c)} style={{ padding: "10px 14px", background: "#ecfdf5", color: "#008751", border: "1px solid #d1fae5", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>+</button>
               <button onClick={() => onEdit?.(c, 'course')} style={{ padding: "10px 14px", background: "#fefce8", color: "#d97706", border: "1px solid #fef08a", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>✎</button>
               <button onClick={() => onDelete?.(c)} style={{ padding: "10px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>✕</button>
            </div>

            {expandedCourse === i && (
              <div style={{ marginTop: 24, background: "rgba(0,0,0,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1e3a8a" }}>Participant Registry</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onDownloadTemplate?.("Short_Courses")} style={{ fontSize: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", color: "#475569", fontWeight: 700, cursor: "pointer" }}>📄 Template</button>
                    <label style={{ fontSize: 10, background: "#1e3a8a", border: "none", borderRadius: 4, padding: "4px 10px", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      📥 Bulk
                      <input type="file" style={{ display: "none" }} onChange={evt => onBulkUpload && onBulkUpload(evt, `CourseStudents:${c._id || c.id}`)} />
                    </label>
                    <button onClick={() => onAddParticipant(c)} style={{ fontSize: 10, background: "#008751", border: "none", borderRadius: 4, padding: "4px 10px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Add Participant</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        {["Name", "Email/Phone", "Status", "Action"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                  {(c.participants || []).map((p, j) => (
                    <tr key={j} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                      <td style={{ padding: "8px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.name}</td>
                      <td style={{ padding: "8px" }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{p.email}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.phone}</div>
                      </td>
                      <td style={{ padding: "8px" }}><Badge text={p.status} /></td>
                      <td style={{ padding: "8px" }}>
                        <button style={{ background: "none", border: "none", color: "#dc2626", fontSize: 14, cursor: "pointer" }}>×</button>
                      </td>
                    </tr>
                  ))}
                  {(c.participants || []).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 11 }}>No participants registered yet.</td></tr>}
            </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkshopsTab = ({ data, onBulkUpload, onAddEvent, onEdit, onDelete, onAddParticipant, onDownloadTemplate, analyticsSummary, selectedIds = [], onSelectionChange }) => {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };
  const toggleAll = (items) => {
    const allIds = items.map(x => x._id || x.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    if (areAllSelected) onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...allIds])]);
  };
  const { academicEvents } = data;
  const totalAttendees = academicEvents?.reduce((acc, e) => acc + (e.attendance?.length || 0), 0) || 0;
  const activeEvents = academicEvents.length;
  const [expandedEvent, setExpandedEvent] = useState(null);

  return (
    <div className="animate-dash">
      <SectionHeader title="Workshops & Conferences Hub" subtitle="Institutional engagement and knowledge exchange portfolio" />
      {analyticsSummary?.workshops != null && (
        <ModuleAnalyticsStrip
          color="#10b981"
          title="Programmes hub — workshops & trainings"
          rows={[{ label: "Workshop / event records", value: analyticsSummary.workshops.total }]}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, flex: 1 }}>
          <SubStatCard label="Total Event Attendees" value={totalAttendees} icon="🎫" color="#10b981" />
          <SubStatCard label="Total Currently on Training" value={activeEvents * 8} icon="⏳" color="#f59e0b" />
          <SubStatCard label="Currently Operational" value={activeEvents} icon="🛠️" color="#10b981" />
        </div>
        <div style={{ marginLeft: 24, display: "flex", gap: 8, background: "#f8fafc", padding: "4px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <button 
            onClick={onAddEvent} 
            style={{ background: "#10b981", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}
          >
            + ADD NEW WORKSHOPS & CONFERENCES
          </button>
          <button onClick={() => selectedIds.length > 0 && onDelete({ _bulk: true, ids: selectedIds })} 
              disabled={selectedIds.length === 0}
              style={{ background: selectedIds.length > 0 ? "#dc2626" : "#f1f5f9", color: selectedIds.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 11, cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", fontWeight: 800 }}>
              🗑️ BULK DELETE ({selectedIds.length})
          </button>
          <button 
            onClick={() => toggleAll(academicEvents)}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#64748b", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
          >
            {academicEvents.length > 0 && academicEvents.every(x => selectedIds.includes(x._id || x.id)) ? "Deselect All" : "Select All"}
          </button>
          <ExportButton 
            fileName="ACETEL_Workshops_Conferences" 
            title="Institutional Events Portfolio"
            headers={[["Type", "Title", "Date", "Location", "Attendees"]]}
            data={academicEvents.map(e => [e.type, e.name, e.date, e.location, e.attendance?.length || 0])}
          />
          <label style={{ background: "#1e3a8a", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            📥 Bulk Upload
            <input type="file" style={{ display: "none" }} onChange={e => onBulkUpload && onBulkUpload(e, "Events")} />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
         <SectionHeader title="Event Inventory" subtitle="Workshops, Conferences & Seminars" />
         <button onClick={onAddEvent} style={{ background: "#1e3a8a", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>+ ADD NEW WORKSHOPS & CONFERENCES</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
        {academicEvents.map((e, i) => (
          <div key={i} className="premium-card" style={{ padding: 24, position: "relative", border: `2px solid ${selectedIds.includes(e._id || e.id) ? "#10b981" : "transparent"}` }}>
            <input 
              type="checkbox" 
              checked={selectedIds.includes(e._id || e.id)}
              onChange={() => toggleSelect(e._id || e.id)}
              style={{ position: "absolute", top: 12, right: 12, width: 18, height: 18, cursor: "pointer", zIndex: 10 }}
            />
            <div style={{ fontSize: 11, color: "#008751", fontWeight: 900, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>{e.type}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>{e.name}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b", marginBottom: 20, fontWeight: 600 }}>
              <span>📅 {e.date}</span>
              <span>📍 {e.location}</span>
              <span style={{ marginLeft: "auto", fontWeight: 800, color: "#008751" }}>👥 {e.attendance?.length || 0}</span>
            </div>
            
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setExpandedEvent(expandedEvent === i ? null : i)} 
                style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#1e293b", border: "none", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                {expandedEvent === i ? "Hide Attendees" : "View Attendance"}
              </button>
              <ExportButton 
                variant="icon" 
                fileName={`Event_${e.id}`} 
                title={`Event Attendance: ${e.name}`}
                headers={[["Name", "Email", "Phone", "Status"]]}
                data={(e.attendance || []).map(a => [a.name, a.email, a.phone, a.status])}
              />
              <button onClick={() => onAddParticipant(e)} style={{ padding: "10px 16px", background: "#ecfdf5", color: "#008751", border: "1px solid #d1fae5", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>+</button>
              <button onClick={() => onEdit?.(e, 'event')} style={{ padding: "12px 14px", background: "#fefce8", color: "#d97706", border: "1px solid #fef08a", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>✎</button>
              <button onClick={() => onDelete?.(e)} style={{ padding: "12px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>✕</button>
            </div>

            {expandedEvent === i && (
              <div style={{ marginTop: 24, background: "rgba(0,0,0,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#008751" }}>Attendance Register</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onDownloadTemplate?.("Workshops")} style={{ fontSize: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", color: "#475569", fontWeight: 700, cursor: "pointer" }}>📄 Template</button>
                    <label style={{ fontSize: 10, background: "#1e3a8a", border: "none", borderRadius: 4, padding: "4px 10px", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      📥 Bulk
                      <input type="file" style={{ display: "none" }} onChange={evt => onBulkUpload && onBulkUpload(evt, `EventAttendance:${e._id || e.id}`)} />
                    </label>
                    <button onClick={() => onAddParticipant(e)} style={{ fontSize: 10, background: "#1e3a8a", border: "none", borderRadius: 4, padding: "4px 10px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Add Attendee</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        {["Name", "Email/Phone", "Status", "Action"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                  {(e.attendance || []).map((p, j) => (
                    <tr key={j} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                      <td style={{ padding: "8px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.name}</td>
                      <td style={{ padding: "8px" }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{p.email}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.phone}</div>
                      </td>
                      <td style={{ padding: "8px" }}><Badge text={p.status} /></td>
                      <td style={{ padding: "8px" }}>
                        <button style={{ background: "none", border: "none", color: "#dc2626", fontSize: 14, cursor: "pointer" }}>×</button>
                      </td>
                    </tr>
                  ))}
                  {(e.attendance || []).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 11 }}>No participants registered yet.</td></tr>}
            </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
          {academicEvents.length === 0 && <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 40, background: "#f8fafc", borderRadius: 16, width: "100%" }}>No events scheduled in current portfolio.</div>}
        </div>
      </div>
  );
};

const AuditTrailTab = ({ logs = [] }) => {
  const [filterAction, setFilterAction] = useState("all");
  const [filterResource, setFilterResource] = useState("all");

  const filteredLogs = logs.filter(log => {
    if (filterAction !== "all" && !log.action.includes(filterAction)) return false;
    if (filterResource !== "all" && log.resource !== filterResource) return false;
    return true;
  });

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>📜 Institutional Audit Trail</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600 }}>
            <option value="all">All Actions</option>
            <option value="POST">Creation (POST)</option>
            <option value="PUT">Modification (PUT)</option>
            <option value="DELETE">Deletion (DELETE)</option>
            <option value="AUTH">Security (AUTH)</option>
          </select>
          <select value={filterResource} onChange={e => setFilterResource(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600 }}>
            <option value="all">All Resources</option>
            <option value="STUDENTS">Students</option>
            <option value="APPLICATIONS">Applications</option>
            <option value="ACADEMIC-COURSES">Courses</option>
            <option value="USERS">Users</option>
          </select>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Timestamp</th>
              <th style={{ padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Action</th>
              <th style={{ padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Resource</th>
              <th style={{ padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>User</th>
              <th style={{ padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Details</th>
              <th style={{ padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={log._id || idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 24px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{new Date(log.createdAt).toLocaleString()}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: log.action.includes('DELETE') ? "#fef2f2" : "#eff6ff", color: log.action.includes('DELETE') ? "#ef4444" : "#3b82f6" }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#475569", fontWeight: 700 }}>{log.resource.toUpperCase()}</td>
                <td style={{ padding: "14px", fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{log.userName || "System"}</td>
                <td style={{ padding: "14px", fontSize: 11, color: "#64748b", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.resourceId ? `ID: ${log.resourceId} · ` : ""}{log.errorMessage || "Operation completed"}
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ color: log.status === 'success' ? "#10b981" : "#ef4444", fontSize: 11, fontWeight: 800 }}>
                    {log.status === 'success' ? "● SUCCESS" : "○ FAILED"}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No audit logs found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const UserManagementTab = ({ users = [], onRefresh }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [activeDetailUser, setActiveDetailUser] = useState(null);
  const [saved, setSaved] = useState(false);

  const filtered = users.filter(u => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.role) errs.role = "Please select a role";
    if (!form.dept.trim()) errs.dept = "Department is required";
    if (!editUser) {
      if (!form.password || form.password.length < 8) errs.password = "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    try {
      if (editUser) {
        await api.put(`/users/${editUser._id || editUser.id}`, {
          ...form,
          programmes: [form.dept]
        });
      } else {
        await api.post("/users", {
          ...form,
          username: form.email.split('@')[0] + Math.floor(Math.random() * 1000),
          programmes: [form.dept]
        });
      }
      onRefresh();
      setShowModal(false); setEditUser(null); setForm(EMPTY_FORM); setFormErrors({});
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Error saving user: " + (err?.response?.data?.message || err.message));
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await api.get("/monitoring/audit-logs?limit=50");
      if (Array.isArray(data)) setAuditLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, phone: u.phone || "", role: u.role, dept: u.dept, password: "", confirmPassword: "" }); setFormErrors({}); setShowModal(true); };
  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); };

  const handleResetMFA = async (u) => {
    if (!window.confirm(`Are you sure you want to reset MFA for ${u.name}? They will be required to set it up again on next login.`)) return;
    try {
      await api.post(`/users/${u._id || u.id}/reset-mfa`, {});
      alert(`MFA has been successfully reset for ${u.name}`);
    } catch (err) {
      alert(`Failed to reset MFA: ${err?.message || err}`);
    }
  };

  const roleCounts = Object.keys(ROLES).reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {});

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', background: '#f8fafc', minHeight: 400, padding: 4 }}>
      {/* Success toast */}
      {saved && (
        <div style={{ position: "fixed", top: 80, right: 32, background: "#10b981", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          ✅ User saved successfully
        </div>
      )}

      {/* Role Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {Object.entries(ROLES).map(([key, role]) => (
          <div key={key} onClick={() => setFilterRole(filterRole === key ? "all" : key)}
            style={{ background: filterRole === key ? role.bg : "#ffffff", border: `1px solid ${filterRole === key ? role.border : "rgba(0,0,0,0.06)"}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{role.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: role.color, fontFamily: "'Space Mono', monospace" }}>{roleCounts[key] || 0}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 600 }}>{role.label}</div>
          </div>
        ))}
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>{users.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 600 }}>Total Users</div>
        </div>
      </div>

      {/* Role Permission Matrix */}
      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <SectionHeader title="🔐 Role Permission Matrix" subtitle="Access rights per role across the system" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.5, borderBottom: "1px solid rgba(0,0,0,0.06)", textTransform: "uppercase" }}>Permission</th>
                {Object.entries(ROLES).map(([key, role]) => (
                  <th key={key} style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, color: role.color, fontWeight: 800, letterSpacing: 0.5, borderBottom: "1px solid rgba(0,0,0,0.06)", textTransform: "uppercase" }}>{role.icon} {key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSION_LABELS).map(([perm, label], i) => (
                <tr key={perm} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>{label}</td>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <td key={key} style={{ textAlign: "center", padding: "12px 14px" }}>
                      {role.permissions.includes(perm) || role.permissions.includes("all") ? (
                        <span style={{ color: "#008751", fontSize: 16 }}>✓</span>
                      ) : (
                        <span style={{ color: "#cbd5e1", fontSize: 16 }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* User Table */}
      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <SectionHeader title="System Users" subtitle={`${filtered.length} user${filtered.length !== 1 ? "s" : ""} found`} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: 200, fontWeight: 500 }} />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 500 }}>
              <option value="all" style={{ background: "#fff" }}>All Roles</option>
              {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k} style={{ background: "#fff" }}>{r.label}</option>)}
            </select>
            <button onClick={openCreate} style={{ background: "#008751", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>+ Create User</button>
            <ExportButton 
              fileName="ACETEL_User_Directory" 
              title="Official Institutional User Directory"
              headers={[["Name", "Email", "Role", "Department", "Status"]]}
              data={users.map(u => [u.name, u.email, u.role, u.dept, u.status])}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Email", "Role", "Department", "Status", "Last Login", "Created", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.5, borderBottom: "1px solid rgba(0,0,0,0.06)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setActiveDetailUser(activeDetailUser?.id === u.id ? null : u)}
                >
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: ROLES[u.role]?.bg || "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: `1px solid ${ROLES[u.role]?.border || "#e2e8f0"}` }}>
                        {ROLES[u.role]?.icon || "👤"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#475569" }}>{u.email}</td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: ROLES[u.role]?.bg || "#f1f5f9", color: ROLES[u.role]?.color || "#64748b", padding: "4px 10px", borderRadius: 20, border: `1px solid ${ROLES[u.role]?.border || "#e2e8f0"}` }}>
                      {ROLES[u.role]?.icon} {ROLES[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px", fontSize: 12, color: "#475569" }}>{u.dept}</td>
                  <td style={{ padding: "14px" }}><Badge text={u.status} /></td>
                  <td style={{ padding: "14px", fontSize: 11, color: "#94a3b8" }}>{u.lastLogin}</td>
                  <td style={{ padding: "14px", fontSize: 11, color: "#94a3b8" }}>{u.created}</td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {['admin', 'staff'].includes(u.role) && (
                        <button onClick={e => { e.stopPropagation(); handleResetMFA(u); }}
                          title="Reset Multi-Factor Authentication"
                          style={{ fontSize: 11, padding: "6px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, color: "#0284c7", cursor: "pointer", fontWeight: 700 }}>MFA Reset</button>
                      )}
                      <button onClick={e => { e.stopPropagation(); openEdit(u); }}
                        style={{ fontSize: 11, padding: "6px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#d97706", cursor: "pointer", fontWeight: 700 }}>Edit</button>
                      <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(u); }}
                        style={{ fontSize: 11, padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 13 }}>No users match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>{editUser ? "Edit User" : "Create New User"}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>Fill in all fields to {editUser ? "update" : "register"} a system user</div>
              </div>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 34, height: 34, color: "#64748b", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
            </div>

            {/* Role Picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#0f172a", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Select Role *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(ROLES).map(([key, role]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, role: key }))}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: `1px solid ${form.role === key ? role.border : "#e2e8f0"}`, background: form.role === key ? role.bg : "#f8fafc", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 20 }}>{role.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: form.role === key ? role.color : "#64748b" }}>{role.label}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, lineHeight: 1.4, fontWeight: 500 }}>{role.description.slice(0, 55)}...</div>
                    </div>
                  </button>
                ))}
              </div>
              {formErrors.role && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6, fontWeight: 600 }}>⚠ {formErrors.role}</div>}
            </div>

            {/* Selected Role Permissions Preview */}
            {form.role && (
              <div style={{ background: `${ROLES[form.role].bg}`, border: `1px solid ${ROLES[form.role].border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: ROLES[form.role].color, marginBottom: 8 }}>🔓 Permissions for {ROLES[form.role].label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ROLES[form.role].permissions.map(p => (
                    <span key={p} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 12, background: "#ffffff", color: "#64748b", border: "1px solid rgba(0,0,0,0.06)", fontWeight: 700 }}>{PERMISSION_LABELS[p] || p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "name", label: "Full Name", placeholder: "e.g. Dr. Kwame Asante", type: "text" },
                { key: "email", label: "Email Address", placeholder: "user@acetel.edu", type: "email" },
                { key: "phone", label: "Phone Number", placeholder: "+233 24 000 0000", type: "tel" },
                { key: "dept", label: "Department / Unit", placeholder: "e.g. Computer Science", type: "text" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label} *</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} type={type}
                    style={{ width: "100%", background: "#f8fafc", border: `1px solid ${formErrors[key] ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 500 }} />
                  {formErrors[key] && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 600 }}>⚠ {formErrors[key]}</div>}
                </div>
              ))}

              {!editUser && <>
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password *</label>
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder="Min. 8 characters"
                    style={{ width: "100%", background: "#f8fafc", border: `1px solid ${formErrors.password ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 500 }} />
                  {formErrors.password && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 600 }}>⚠ {formErrors.password}</div>}
                  {form.password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length >= i * 3 ? (form.password.length >= 12 ? "#008751" : form.password.length >= 8 ? "#f59e0b" : "#ef4444") : "#e2e8f0" }} />)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 3, fontWeight: 600 }}>{form.password.length < 6 ? "Weak" : form.password.length < 10 ? "Fair" : form.password.length < 14 ? "Good" : "Strong"}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm Password *</label>
                  <input value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} type="password" placeholder="Repeat password"
                    style={{ width: "100%", background: "#f8fafc", border: `1px solid ${formErrors.confirmPassword ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 500 }} />
                  {formErrors.confirmPassword && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 600 }}>⚠ {formErrors.confirmPassword}</div>}
                </div>
              </>}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: "#008751", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
                {editUser ? "💾 Save Changes" : "✅ Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 28, maxWidth: 380, textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Delete User?</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, fontWeight: 500 }}>This action cannot be undone. The user will lose all system access immediately.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
              <button onClick={async () => { 
                try {
                  await api.delete(`/users/${showDeleteConfirm?._id || showDeleteConfirm?.id}`);
                  onRefresh();
                  setShowDeleteConfirm(null); 
                } catch (err) {
                  alert("Error deleting user: " + (err?.response?.data?.message || err.message));
                }
              }} style={{ background: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER DETAIL PANEL ── */}
      {activeDetailUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 2000, display: "flex", justifyContent: "flex-end" }} onClick={() => setActiveDetailUser(null)}>
          <div style={{ width: 380, background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.06)", height: "100%", overflowY: "auto", padding: 28, boxShadow: "-10px 0 15px -3px rgba(0,0,0,0.05)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>User Profile</div>
              <button onClick={() => setActiveDetailUser(null)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 34, height: 34, color: "#64748b", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
            </div>
            {(() => {
              const u = activeDetailUser;
              const role = ROLES[u.role];
              return (
                <>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: role?.bg || "#f1f5f9", border: `2px solid ${role?.border || "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px" }}>{role?.icon || "👤"}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{u.email}</div>
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20, background: role?.bg || "#f1f5f9", color: role?.color || "#64748b", border: `1px solid ${role?.border || "#e2e8f0"}` }}>{role?.label || "User"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {[["Department", u.dept], ["Phone", u.phone || "—"], ["Status", u.status], ["Last Login", u.lastLogin], ["Account Created", u.created]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{l}</span>
                        <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Granted Permissions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(role?.permissions || []).map(p => (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
                          <span style={{ color: "#008751" }}>✓</span> {PERMISSION_LABELS[p] || p}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setActiveDetailUser(null); openEdit(u); }} style={{ flex: 1, background: "#008751", border: "none", borderRadius: 8, padding: "12px 0", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Edit User</button>
                    <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x))}
                      style={{ flex: 1, background: u.status === "Active" ? "#fef2f2" : "#d1fae5", border: `1px solid ${u.status === "Active" ? "#fecaca" : "#a7f3d0"}`, borderRadius: 8, padding: "12px 0", color: u.status === "Active" ? "#dc2626" : "#059669", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function ACETELDashboard() {
  const { logout, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // All useState and useEffect hooks must come BEFORE any conditional returns
  // (React Rules of Hooks)

  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "registration", title: "New Student Applied", time: "2 mins ago", read: false },
    { id: 2, type: "admission", title: "Review Pending: MSc AI", time: "1 hour ago", read: false },
  ]);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedIds, setSelectedIds] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // --- STATEFUL DATA ---
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [admissionHub, setAdmissionHub] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [facilitators, setFacilitators] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddCoordinatorModal, setShowAddCoordinatorModal] = useState(false);
  const [newCoordinatorForm, setNewCoordinatorForm] = useState({ name: "", email: "", phone: "", programme: "", date: "" });
  const [shortCourses, setShortCourses] = useState([]);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([{ id: 1, timestamp: new Date().toISOString(), action: "SYSTEM_INIT", targetId: "System", targetName: "All ACETEL SDMS Records", reason: "System initialized", officer: "System Admin" }]);
  const [recycleBin, setRecycleBin] = useState([]);
  const [nationalities, setNationalities] = useState(initialNationalities);
  const [semesterDistribution, setSemesterDistribution] = useState(initialSemesterDistribution);

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddAdmittedModal, setShowAddAdmittedModal] = useState(false);
  const [newAdmittedForm, setNewAdmittedForm] = useState({
    surname: "", otherNames: "", matricNo: "", prog: "MSc Artificial Intelligence",
    email: "", instEmail: "", phone: "", gender: "Male", nationality: "Nigeria"
  });
  const [newCourseForm, setNewCourseForm] = useState({ title: "", description: "", duration: "", facilitatorName: "", startDate: "" });
  const [newEventForm, setNewEventForm] = useState({ name: "", type: "Workshop", date: "", location: "", speaker: "", description: "" });
  const [newStudentForm, setNewStudentForm] = useState({ surname: "", otherNames: "", matric: "", cohort: "", prog: "MSc Artificial Intelligence", email: "", instEmail: "", phone: "", gender: "Male", level: 800, nationality: "Nigeria" });
  const [studentProgFilter, setStudentProgFilter] = useState("All Programmes");
  const [studentCohortFilter, setStudentCohortFilter] = useState("All Cohorts");

  // Isolated Admission Hub filters
  const [admissionCohortFilter, setAdmissionCohortFilter] = useState("All Cohorts");
  const [admissionProgFilter, setAdmissionProgFilter] = useState("All Programmes");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [cronStats, setCronStats] = useState([]);
  const [academicCourses, setAcademicCourses] = useState([]);
  const initAnalyticsRange = defaultAnalyticsDateRange();
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState(initAnalyticsRange.from);
  const [analyticsDateTo, setAnalyticsDateTo] = useState(initAnalyticsRange.to);
  const analyticsRangeRef = useRef(initAnalyticsRange);
  useEffect(() => {
    analyticsRangeRef.current = { from: analyticsDateFrom, to: analyticsDateTo };
  }, [analyticsDateFrom, analyticsDateTo]);

  const [showAddAcademicModal, setShowAddAcademicModal] = useState(false);
  const [newAcademicForm, setNewAcademicForm] = useState({ code: "", title: "", prog: PROGRAMMES[0], sem: 1, cat: "Core" });

  // --- PARTICIPANT MANAGEMENT ---
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [targetHub, setTargetHub] = useState(null); // { id, title, type: 'course' | 'event' }
  const [newParticipantForm, setNewParticipantForm] = useState({ name: "", email: "", phone: "", organisation: "", role: "Participant", status: "Active" });

  const [showAddFacilitatorModal, setShowAddFacilitatorModal] = useState(false);
  const [newFacilitatorForm, setNewFacilitatorForm] = useState({ name: "", email: "", phone: "", dept: "", expertise: "", courseCode: "", courseTitle: "" });

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({ target: "registry", format: "pdf", prog: "All Programmes", session: "All Sessions", semester: "All Semesters" });

  // --- LIVE DATA FETCHING ---
  const splitName = (fullName) => {
    if (!fullName) return { surname: "Unknown", otherNames: "N/A" };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return { surname: "Unknown", otherNames: "N/A" };
    if (parts.length === 1) return { surname: parts[0], otherNames: "N/A" };
    const surname = parts[parts.length - 1];
    const otherNames = parts.slice(0, parts.length - 1).join(" ");
    return { surname, otherNames };
  };

  const fetchData = async () => {
    try {
      const [cronData, dashData, sData, appData, almData, ahData, scData, aeData, acData, userData, logData] = await Promise.all([
        api.get('/dashboard/cron-stats').catch(() => []),
        api.get('/dashboard/stats').catch(() => EMPTY_DASHBOARD),
        api.get('/students').catch(() => []),
        api.get('/applications').catch(() => []),
        api.get('/alumni').catch(() => []),
        api.get('/admission-hub').catch(() => []),
        api.get('/short-courses').catch(() => []),
        api.get('/academic-events').catch(() => []),
        api.get('/academic-courses').catch(() => []),
        api.get('/users').catch(() => []),
        api.get('/dashboard/audit-logs').catch(() => []),
      ]);

      setCronStats(cronData);
      setDashboardStats(dashData);
      setAuditLogs(logData);
      
      if (dashData.students?.byNationality) setNationalities(dashData.students.byNationality);

      const mappedStudents = sData.map(s => {
        const { surname, otherNames } = (s.surname && s.otherNames) ? { surname: s.surname, otherNames: s.otherNames } : splitName(s.name);
        const cohort = inferCohort(s.cohort, s.entrySession);
        return { ...s, surname, otherNames, id: s.matricNo, prog: s.programme, sem: s.semester, entry: s.entrySession, nat: s.nationality, cohort };
      });
      setStudents(mappedStudents);

      setApplications(appData.map(a => {
        const { surname, otherNames } = (a.surname && a.otherNames) ? { surname: a.surname, otherNames: a.otherNames } : splitName(a.name);
        const cohort = inferCohort(a.cohort, a.entrySession);
        return {
          ...a,
          surname,
          otherNames,
          prog: a.programme,
          cohort,
          nonAdmissionReasons: Array.isArray(a.nonAdmissionReasons) ? a.nonAdmissionReasons : (a.nonAdmissionReason ? [a.nonAdmissionReason] : []),
        };
      }));

      setAdmissionHub(Array.isArray(ahData) ? ahData : []);

      setAlumni(almData.map(a => {
        const { surname, otherNames } = (a.surname && a.otherNames) ? { surname: a.surname, otherNames: a.otherNames } : splitName(a.name);
        const cohort = inferCohort(a.cohort);
        return { ...a, surname, otherNames, prog: a.programme, cohort };
      }));

      setShortCourses(Array.isArray(scData) ? scData : []);
      setAcademicEvents(Array.isArray(aeData) ? aeData : []);
      setAcademicCourses(
        (acData || []).map((c) => {
          const semester = parseSemesterValue(c.semester ?? c.sem);
          return {
            ...c,
            id: c._id || c.id,
            code: c.code,
            prog: c.programme || c.prog,
            cat: c.category || c.cat,
            sem: semester,
            semester,
          };
        })
      );
      
      setUsers(userData.map(u => ({
        ...u,
        id: u._id || u.id,
        dept: u.dept || u.programmes?.[0] || "General",
        created: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "N/A",
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"
      })));

      const mappedFacs = userData
        .filter(u => u.role === 'facilitator')
        .map(f => {
          const { surname, otherNames } = (f.surname && f.otherNames) ? { surname: f.surname, otherNames: f.otherNames } : splitName(f.name);
          return {
            ...f, id: f._id || f.id, surname, otherNames,
            dept: f.department || f.dept || f.programmes?.[0] || "ACETEL",
            expertise: f.specialization || f.expertise || f.programmes?.join(", ") || "General",
            facilitatorCourses: f.facilitatorCourses || [],
            current: (f.facilitatorCourses || []).length,
            max: 10,
            load: Math.min(100, ((f.facilitatorCourses || []).length / 10) * 100),
            status: f.status === "active" ? "Active" : f.status === "inactive" ? "Inactive" : f.status || "Active",
          };
        });
      setFacilitators(mappedFacs);
      setSupervisors(mappedFacs);

      const { from, to } = analyticsRangeRef.current;
      try {
        const sumRes = await api.get("/analytics/summary", { params: { from, to } });
        setAnalyticsSummary(sumRes?.data ?? sumRes);
      } catch {
        /* leave prior analyticsSummary */
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  };

  const handleWipeAllData = async () => {
    if (!window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE all institutional records (Students, Applications, Courses, Events, Alumni, and Facilitators). Only the system administrators will remain. \n\nAre you absolutely sure you want to proceed?")) {
      return;
    }
    const reason = window.prompt("System Security: Enter 'WIPE' to confirm full system data reset:");
    if (reason !== "WIPE") {
      alert("Wipe cancelled: Confirmation word mismatch.");
      return;
    }

    try {
      await api.post("/dashboard/wipe");
      await fetchData(); // Refresh all state
      alert("System reset successful. All institutional records have been cleared.");
      setShowAuditModal(false);
    } catch (err) {
      console.error(err);
      alert("Error wiping system data: " + (err.message || "Forbidden"));
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/analytics/summary", { params: { from: analyticsDateFrom, to: analyticsDateTo } })
      .then((r) => {
        if (!cancelled) setAnalyticsSummary(r?.data ?? r);
      })
      .catch(() => {
        if (!cancelled) setAnalyticsSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [analyticsDateFrom, analyticsDateTo]);

  const runAdmissionEvaluation = async () => {
    if (!window.confirm("Run automated eligibility on all Pending applications? Status and reasons will be updated on the server.")) return;
    try {
      await api.post("/applications/batch/evaluate-eligibility", {});
      await fetchData();
      alert("Eligibility evaluation completed and lists refreshed.");
    } catch (e) {
      console.error(e);
      alert("Evaluation failed. Ensure you are signed in as an administrator with network access to the API.");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [refreshKey]);
  const [metrics, setMetrics] = useState({
    atRiskCount: 0,
    completionRate: 0,
    growthData: [],
    performanceData: [],
    funnelData: [
      { name: "Applied", value: 0, fill: "#3b82f6" },
      { name: "Shortlisted", value: 0, fill: "#6366f1" },
      { name: "Admitted", value: 0, fill: "#8b5cf6" },
      { name: "Enrolled", value: 0, fill: "#a78bfa" },
      { name: "Graduated", value: 0, fill: "#c4b5fd" },
    ],
    semesterData: initialSemesterDistribution
  });

  useEffect(() => {
    // Recalculate metrics whenever data changes
    if (!students || !applications || !alumni) return;
    
    const mscCount = students?.filter(s => s?.prog?.includes("MSc")).length || 0;
    const phdCount = students?.filter(s => s?.prog?.includes("PhD")).length || 0;
    const graduatedCount = alumni?.length || 0;
    
    // Simple semester dist
    const dist = initialSemesterDistribution.map(d => ({
      ...d,
      count: students?.filter(s => `Sem ${s?.sem}` === d.semester || (d.semester === "Sem 8+" && s?.sem >= 8)).length || 0
    }));

    // Funnel Update
    const funnel = [
      { name: "Applied", value: applications?.length || 0, fill: "#3b82f6" },
      { name: "Shortlisted", value: Math.floor((applications?.length || 0) * 0.8), fill: "#6366f1" },
      { name: "Admitted", value: applications?.filter(a => a?.status === "Admitted").length || 0, fill: "#8b5cf6" },
      { name: "Enrolled", value: students?.length || 0, fill: "#a78bfa" },
      { name: "Graduated", value: alumni?.length || 0, fill: "#c4b5fd" },
    ];

    setMetrics(prev => ({
      ...prev,
      atRiskCount: students?.filter(s => {
        if (!s?.prog) return false;
        const limit = s.prog.includes("PhD") ? 12 : 6;
        const remaining = limit - (s.sem || 0);
        return remaining <= 1 || s.status === "Inactive";
      }).length || 0,
      completionRate: (students?.length + alumni?.length) > 0 ? Math.round((alumni.length / (students.length + alumni.length)) * 100) : 0,
      semesterData: dist || [],
      funnelData: funnel || [],
      performanceData: PROGRAMMES.map(p => ({
        program: p.replace("Artificial Intelligence", "AI").replace("Management Information System", "MIS"),
        msc: p.startsWith("MSc") ? (students?.filter(s => s?.prog === p).length || 0) : 0,
        phd: p.startsWith("PhD") ? (students?.filter(s => s?.prog === p).length || 0) : 0,
        admitted: applications?.filter(a => a?.prog === p && a?.status === "Admitted").length || 0,
        graduated: alumni?.filter(a => a?.prog === p).length || 0
      }))
    }));
  }, [students, applications, alumni]);

  const [deleteData, setDeleteData] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [editData, setEditData] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editReason, setEditReason] = useState("");

  const [restoreData, setRestoreData] = useState(null);
  const [restoreReason, setRestoreReason] = useState("");

  const [studentHistoryData, setStudentHistoryData] = useState(null);
  const handleGlobalExport = async () => {
    const sections = [
      { title: 'Student Registry Summary', headers: [['Matric', 'Name', 'Prog', 'Status']], data: (students || []).map(s => [s?.matricNo || s?.id || 'N/A', s?.name || 'N/A', s?.prog || 'N/A', s?.status || 'N/A']) },
      { title: 'Admissions Hub Summary', headers: [['Name', 'Prog', 'Status', 'Date']], data: (applications || []).map(a => [a?.name || 'N/A', a?.programme || 'N/A', a?.status || 'N/A', a?.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : 'N/A']) },
      { title: 'Alumni Directory Summary', headers: [['Name', 'Prog', 'Grad Year']], data: (alumni || []).map(a => [a?.name || 'N/A', a?.programme || 'N/A', a?.gradYear || 'N/A']) },
      { title: 'Faculty & Facilitators', headers: [['Name', 'Dept', 'Expertise']], data: (facilitators || []).map(f => [f?.name || 'N/A', f?.dept || 'N/A', f?.expertise || 'N/A']) }
    ];
    try {
      await exportGlobalInstitutionalReport(sections, user?.name || 'System Administrator');
    } catch (err) {
      alert("Export failed: " + (err.message || "Unknown error"));
    }
  };

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  useEffect(() => {
    if (!editData) return;
    if (
      editData._editType === "application" &&
      editData.status === "Not Admitted" &&
      !(editData.nonAdmissionReasons && editData.nonAdmissionReasons.length) &&
      editData.nonAdmissionReason
    ) {
      setEditForm({ ...editData, nonAdmissionReasons: [editData.nonAdmissionReason] });
    } else {
      setEditForm({ ...editData });
    }
  }, [editData]);

  const handleDeleteSubmit = async () => {
    if (!deleteReason.trim()) return alert("Reason is required to delete.");
    
    if (deleteData?._bulk) {
      const { ids } = deleteData;
      const idStrings = (ids || []).map(id => String(id));
      const filterFn = (item) => !idStrings.includes(String(item._id || item.id));
      
      // Persist bulk deletes to backend
      let errors = 0;
      for (const id of idStrings) {
        try {
          const isStudent = students.some(s => String(s._id || s.id) === id);
          const isApplication = applications.some(a => String(a._id || a.id) === id);
          const isCourse = shortCourses.some(c => String(c._id || c.id) === id);
          const isAcademic = academicCourses.some(c => String(c._id || c.id) === id);
          const isEvent = academicEvents.some(e => String(e._id || e.id) === id);
          const isFacilitator = facilitators.some(f => String(f._id || f.id) === id);
          const isAlumni = alumni.some(a => String(a._id || a.id) === id);
          if (isStudent) await api.delete(`/students/${id}`).catch(() => null);
          else if (isApplication) await api.delete(`/applications/${id}`).catch(() => null);
          else if (isCourse) await api.delete(`/short-courses/${id}`).catch(() => null);
          else if (isAcademic) await api.delete(`/academic-courses/${id}`).catch(() => null);
          else if (isEvent) await api.delete(`/academic-events/${id}`).catch(() => null);
          else if (isFacilitator) await api.delete(`/users/${id}`).catch(() => null);
          else if (isAlumni) await api.delete(`/alumni/${id}`).catch(() => null);
        } catch { errors++; }
      }
      
      setStudents(prev => prev.filter(filterFn));
      setApplications(prev => prev.filter(filterFn));
      setShortCourses(prev => prev.filter(filterFn));
      setAcademicCourses(prev => prev.filter(filterFn));
      setAcademicEvents(prev => prev.filter(filterFn));
      setSupervisors(prev => prev.filter(filterFn));
      setFacilitators(prev => prev.filter(filterFn));
      setAlumni(prev => prev.filter(filterFn));
      setAuditLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "BULK_DELETE", targetId: "MULTIPLE", targetName: `${idStrings.length} items`, reason: deleteReason, officer: "Admin" }, ...prev]);
      setSelectedIds([]);
      if (errors > 0) alert(`${idStrings.length - errors} deleted. ${errors} failed (check console).`);
    } else {
      let type = "student";
      const targetId = deleteData?._id || deleteData?.id;
      const sTargetId = String(targetId);
      
      if (applications.some(a => String(a._id || a.id) === sTargetId)) type = "application";
      else if (shortCourses.some(c => String(c._id || c.id) === sTargetId)) type = "course";
      else if (academicCourses.some(c => String(c._id || c.id) === sTargetId)) type = "academic_course";
      else if (academicEvents.some(e => String(e._id || e.id) === sTargetId)) type = "event";
      else if (supervisors.some(su => String(su._id || su.id) === sTargetId)) type = "supervisor";
      else if (facilitators.some(fa => String(fa._id || fa.id) === sTargetId)) type = "facilitator";
      else if (alumni.some(al => String(al._id || al.id) === sTargetId)) type = "alumni";

      // Persist delete to backend
      try {
        const endpointMap = {
          student: `/students/${sTargetId}`,
          application: `/applications/${sTargetId}`,
          course: `/short-courses/${sTargetId}`,
          academic_course: `/academic-courses/${sTargetId}`,
          event: `/academic-events/${sTargetId}`,
          facilitator: `/users/${sTargetId}`,
          supervisor: `/users/${sTargetId}`,
          alumni: `/alumni/${sTargetId}`,
        };
        const endpoint = endpointMap[type];
        if (endpoint) await api.delete(endpoint);
      } catch (err) {
        console.error("Backend delete failed:", err);
      }

      setRecycleBin(prev => [{ ...deleteData, _deletedAt: new Date().toISOString(), _reason: deleteReason, _officer: "Admin", _type: type }, ...prev]);
      const filterSingle = (item) => String(item._id || item.id) !== sTargetId;
      setStudents(prev => prev.filter(filterSingle));
      setApplications(prev => prev.filter(filterSingle));
      setShortCourses(prev => prev.filter(filterSingle));
      setAcademicCourses(prev => prev.filter(filterSingle));
      setAcademicEvents(prev => prev.filter(filterSingle));
      setSupervisors(prev => prev.filter(filterSingle));
      setFacilitators(prev => prev.filter(filterSingle));
      setAlumni(prev => prev.filter(filterSingle));
      const itemName = deleteData?.title || deleteData?.name || "Unknown Item";
      setAuditLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "DELETE", targetId: sTargetId, targetName: itemName, reason: deleteReason, officer: "Admin" }, ...prev]);
    }
    
    setDeleteData(null);
    setDeleteReason("");
  };

  const handleEditSubmit = async () => {
    if (!editReason.trim()) return alert("Reason is required to edit.");

    if (editForm._editType === "application" && editForm.status === "Not Admitted") {
      const rs = editForm.nonAdmissionReasons;
      if (!rs?.length && !editForm.nonAdmissionReason) {
        return alert("Mandatory: select one or more reasons for non-admission.");
      }
    }

    const targetId = editData._id || editData.id;

    try {
      if (editForm._isNew) {
        // Handle creations
        if (editForm._editType === "application") {
          await api.post("/applications", {
            name: editForm.name,
            email: editForm.email || "",
            phone: editForm.phone || "",
            programme: editForm.prog || editForm.programme,
            cohort: editForm.cohort || "",
            status: editForm.status || "Pending",
          });
        } else if (editForm._editType === "facilitator") {
          let parsed = [];
          try {
            parsed = JSON.parse(editForm.facilitatorCoursesJson || "[]");
          } catch {
            alert("Facilitator course attachments must be valid JSON (array of objects).");
            return;
          }
          const genUsername = (editForm.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_") || `fac_${Date.now()}`;
          await api.post("/users", {
            name: editForm.name,
            email: editForm.email,
            username: genUsername,
            password: "Welcome123",
            department: editForm.dept || editForm.department,
            facilitatorCourses: parsed,
            role: "facilitator"
          });
        } else if (editForm._editType === "academic_course") {
          await api.post("/academic-courses", {
            courseCode: editForm.id || editForm.code,
            courseTitle: editForm.title,
            programme: editForm.programme || editForm.prog,
            semester: editForm.semester || editForm.sem || 1,
            category: editForm.cat || "Core"
          });
        } else if (editForm._editType === "alumni") {
          await api.post("/alumni", {
            surname: editForm.surname || editForm.name.split(' ')[0],
            otherNames: editForm.otherNames || editForm.name.split(' ').slice(1).join(' '),
            matricNo: editForm.matricNo || editForm.id,
            programme: editForm.programme || editForm.prog,
            cohort: editForm.cohort,
            gradYear: editForm.gradYear,
            status: editForm.status || "Graduated"
          });
        }
      } else if (targetId) {
        // Handle updates
        if (editForm._editType === "application") {
          const nr =
            editForm.nonAdmissionReasons && editForm.nonAdmissionReasons.length
              ? editForm.nonAdmissionReasons
              : editForm.nonAdmissionReason
                ? [editForm.nonAdmissionReason]
                : [];
          await api.put(`/applications/${targetId}`, {
            name: editForm.name,
            programme: editForm.prog || editForm.programme,
            cohort: editForm.cohort || "",
            status: editForm.status,
            cgpa:
              editForm.cgpa === "" || editForm.cgpa === undefined
                ? undefined
                : Number(editForm.cgpa),
            nonAdmissionReason: nr.length ? nr.join(" | ") : editForm.nonAdmissionReason || "",
            nonAdmissionReasons: nr,
            paymentReceiptUploaded: !!editForm.paymentReceiptUploaded,
            bscMscCertificatesComplete: !!editForm.bscMscCertificatesComplete,
            oLevelSatisfactory: !!editForm.oLevelSatisfactory,
            researchProposalPass: !!editForm.researchProposalPass,
          });
        } else if (editForm._editType === "facilitator") {
          let parsed = [];
          if (typeof editForm.facilitatorCoursesJson === "string") {
            try {
              parsed = JSON.parse(editForm.facilitatorCoursesJson || "[]");
            } catch {
              alert("Facilitator course attachments must be valid JSON (array of objects).");
              return;
            }
          } else {
            parsed = editForm.facilitatorCourses || [];
          }
          await api.put(`/users/${targetId}`, { facilitatorCourses: parsed, name: editForm.name, department: editForm.dept || editForm.department });
          editForm.facilitatorCourses = parsed;
        } else if (editForm._editType === "alumni") {
          await api.put(`/alumni/${targetId}`, { ...editForm });
        } else if (editForm._editType === "student") {
          await api.put(`/students/${targetId}`, { ...editForm });
        }
      }
    } catch (e) {
      console.error(e);
      alert("Could not save changes on the server: " + (e?.response?.data?.message || e.message));
      return;
    }

    // Intelligent Auto-Pull Logic: Application -> Student Registry
    if (editForm._editType === 'application' && editForm.status === 'Admitted') {
      const isAlreadyStudent = students.some(s => s.personalEmail === editForm.personalEmail || s.phone === editForm.phone);
      if (!isAlreadyStudent) {
        const { surname, otherNames } = splitName(editForm.name);
        const newMatric = `ACE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
        const newStudent = {
          ...editForm,
          id: newMatric,
          matricNo: newMatric,
          surname,
          otherNames,
          name: editForm.name,
          prog: editForm.prog || editForm.programme,
          cohort: editForm.cohort || "",
          sem: 1,
          level: (editForm.prog || "").includes("PhD") ? 900 : 800,
          status: "Active",
          entry: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          nat: editForm.nationality || editForm.nat || "N/A"
        };
        
        // Optimistic State Update
        setStudents(prev => [newStudent, ...prev]);
        
        api.post("/students", {
          matricNo: newMatric,
          surname,
          otherNames,
          name: editForm.name,
          programme: editForm.prog || editForm.programme || "",
          cohort: (editForm.cohort || "").trim(),
          semester: 1,
          level: (editForm.prog || "").includes("PhD") ? 900 : 800,
          email: editForm.personalEmail || editForm.email || "",
          personalEmail: editForm.personalEmail || editForm.email || "",
          instEmail: editForm.instEmail || "",
          phone: editForm.phone || "",
          gender: editForm.gender || "N/A",
          nationality: editForm.nationality || editForm.nat || "",
          status: "Active",
          entrySession: editForm.entry || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          gradYear: new Date().getFullYear() + ((editForm.prog || "").includes("PhD") ? 6 : 3),
        }).catch((err) => console.error("Auto-pull persistence failed:", err?.message || err));
        
        setAuditLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "AUTO_PULL", targetId: newMatric, targetName: newStudent.name, reason: "Admitted from Applications Hub", officer: "System Intelligence" }, ...prev]);
      }
    }

    // Update state collections
    setStudents(prev => prev.map(s => (s._id || s.id) === targetId ? { ...editForm } : s));
    setApplications(prev => prev.map(a => (a._id || a.id) === targetId ? { ...editForm } : a));
    setShortCourses(prev => prev.map(c => (c._id || c.id) === targetId ? { ...editForm } : c));
    setAcademicEvents(prev => prev.map(e => (e._id || e.id) === targetId ? { ...editForm } : e));
    setSupervisors(prev => prev.map(su => (su._id || su.id) === targetId ? { ...editForm } : su));
    setFacilitators(prev => prev.map(fa => (fa._id || fa.id) === targetId ? { ...editForm } : fa));
    
    // add to audit logs
    const itemName = editData.title || editData.name || "Unknown Item";
    setAuditLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "EDIT", targetId, targetName: itemName, reason: editReason, officer: "Admin" }, ...prev]);
    
    setEditData(null);
    setEditForm(null);
    setEditReason("");
    fetchData();
  };

  const handleRestoreSubmit = () => {
    if (!restoreReason.trim()) return alert("Reason is required to restore.");
    
    const { _deletedAt, _reason, _officer, _type, ...rest } = restoreData;
    
    // Correct restoration based on type
    if (_type === "application") setApplications(prev => [rest, ...prev]);
    else if (_type === "course") setShortCourses(prev => [rest, ...prev]);
    else if (_type === "event") setAcademicEvents(prev => [rest, ...prev]);
    else if (_type === "supervisor") setSupervisors(prev => [rest, ...prev]);
    else if (_type === "facilitator") setFacilitators(prev => [rest, ...prev]);
    else setStudents(prev => [rest, ...prev]);

    setRecycleBin(prev => prev.filter(s => (s._id || s.id) !== (rest._id || rest.id)));
    setAuditLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "RESTORE", targetId: rest._id || rest.id, targetName: rest.name || rest.title, reason: restoreReason, officer: "Admin" }, ...prev]);
    
    setRestoreData(null);
    setRestoreReason("");
  };

  const handleAddStudent = async () => {
    if (!newStudentForm.surname || !newStudentForm.matric) return alert("Surname and Matric Number are required.");
    const matric = newStudentForm.matric.trim();
    const payload = {
      matricNo: matric,
      surname: newStudentForm.surname.trim(),
      otherNames: (newStudentForm.otherNames || "").trim(),
      name: `${newStudentForm.surname.trim()} ${(newStudentForm.otherNames || "").trim()}`.trim(),
      programme: newStudentForm.prog,
      cohort: (newStudentForm.cohort || "").trim(),
      semester: 1,
      level: newStudentForm.level || 800,
      email: newStudentForm.email || "",
      personalEmail: newStudentForm.email || "",
      instEmail: newStudentForm.instEmail || "",
      phone: newStudentForm.phone || "",
      gender: newStudentForm.gender || "N/A",
      nationality: newStudentForm.nationality || "",
      status: "Active",
      entrySession: "",
      gradYear: new Date().getFullYear() + (newStudentForm.prog.includes("PhD") ? 6 : 3),
    };
    try {
      await api.post("/students", payload);
    } catch (e) {
      const msg = e?.message || "Request failed";
      if (e?.status === 409) {
        alert(`Duplicate matric: ${msg}`);
      } else {
        alert(`Could not save student: ${msg}`);
      }
      return;
    }

    const newStudent = {
      ...newStudentForm,
      id: matric,
      matricNo: matric,
      name: payload.name,
      prog: newStudentForm.prog,
      sem: 1,
      status: "Active",
      gradYear: payload.gradYear,
    };

    setStudents((prev) => [newStudent, ...prev]);
    setShowAddStudentModal(false);
    setNewStudentForm({ surname: "", otherNames: "", matric: "", cohort: "", prog: "MSc Artificial Intelligence", email: "", instEmail: "", phone: "", gender: "Male", level: 800, nationality: "Nigeria" });
    setAuditLogs((prev) => [{ id: Date.now(), timestamp: new Date().toISOString(), action: "ADD", targetId: newStudent.id, targetName: newStudent.name, reason: "Manual Registration", officer: "Admin" }, ...prev]);
    fetchData();
  };

  const handleAddFacilitator = async () => {
    if (!newFacilitatorForm.name || !newFacilitatorForm.email) return alert("Name and Email are required.");
    try {
      const generatedUsername = newFacilitatorForm.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_") || `fac_${Date.now()}`;
      await api.post("/users", {
        name: newFacilitatorForm.name,
        email: newFacilitatorForm.email,
        username: generatedUsername,
        password: "Welcome123",
        phone: newFacilitatorForm.phone,
        department: newFacilitatorForm.dept,
        specialization: newFacilitatorForm.expertise,
        role: "facilitator",
        programmes: newFacilitatorForm.dept ? [newFacilitatorForm.dept] : [],
        facilitatorCourses: newFacilitatorForm.courseCode ? [{ courseCode: newFacilitatorForm.courseCode, programme: newFacilitatorForm.dept || "General", semester: 1, category: "Core" }] : []
      });
      setShowAddFacilitatorModal(false);
      setNewFacilitatorForm({ name: "", email: "", phone: "", dept: "", expertise: "", courseCode: "", courseTitle: "" });
      fetchData();
    } catch (err) {
      alert("Error adding facilitator: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddAcademic = async () => {
    if (!newAcademicForm.code || !newAcademicForm.title) return alert("Code and Title are required.");
    try {
      await api.post("/academic-courses", {
        courseCode: newAcademicForm.code,
        courseTitle: newAcademicForm.title,
        programme: newAcademicForm.prog,
        semester: Number(newAcademicForm.sem || 1),
        category: newAcademicForm.cat || "Core"
      });
      setShowAddAcademicModal(false);
      setNewAcademicForm({ code: "", title: "", prog: PROGRAMMES[0], sem: 1, cat: "Core" });
      fetchData();
    } catch (err) {
      alert("Error adding academic course: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddAdmitted = async () => {
    if (!newAdmittedForm.surname || !newAdmittedForm.matricNo) return alert("Surname and Matric Number are required.");
    try {
      const payload = {
        name: `${newAdmittedForm.surname} ${newAdmittedForm.otherNames}`,
        email: newAdmittedForm.email,
        phone: newAdmittedForm.phone,
        programme: newAdmittedForm.prog,
        cohort: newAdmittedForm.cohort || "",
        status: "Admitted",
        nationality: newAdmittedForm.nationality,
        gender: newAdmittedForm.gender
      };
      await api.post("/applications", payload);
      setShowAddAdmittedModal(false);
      setNewAdmittedForm({ surname: "", otherNames: "", matricNo: "", prog: "MSc Artificial Intelligence", email: "", instEmail: "", phone: "", gender: "Male", nationality: "Nigeria" });
      fetchData();
      alert("Candidate successfully added to the Admission Pool.");
    } catch (err) {
      alert("Error adding admitted student: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseForm.title) return alert("Course title is required.");
    try {
      const body = {
        name: newCourseForm.title,
        title: newCourseForm.title,
        description: newCourseForm.description || "",
        duration: newCourseForm.duration || "",
        facilitatorName: newCourseForm.facilitatorName || "",
        startDate: newCourseForm.startDate || "",
        students: [],
        studentsCount: 0,
        status: "Active",
      };
      const data = await api.post("/short-courses", body);
      setShortCourses((prev) => [...prev, data]);
      setShowAddCourseModal(false);
      setNewCourseForm({ title: "", description: "", duration: "", facilitatorName: "", startDate: "" });
    } catch (err) {
      alert(err?.message || "Error adding course.");
    }
  };

  const handleAddEvent = async () => {
    if (!newEventForm.name) return alert("Event name/title is required.");
    try {
      const typeNorm = newEventForm.type === "Conference" ? "Conference" : "Workshop";
      const body = {
        name: newEventForm.name,
        type: typeNorm,
        date: newEventForm.date ? new Date(newEventForm.date) : new Date(),
        location: newEventForm.location || "TBD",
        description: [newEventForm.description, newEventForm.speaker ? `Speaker: ${newEventForm.speaker}` : ""].filter(Boolean).join("\n"),
        attendance: [],
      };
      const data = await api.post("/academic-events", body);
      setAcademicEvents((prev) => [...prev, data]);
      setShowAddEventModal(false);
      setNewEventForm({ name: "", type: "Workshop", date: "", location: "", speaker: "", description: "" });
    } catch (err) {
      alert(err?.message || "Error adding event.");
    }
  };

  const handleFileUpload = async (e, contextTarget = null) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();

    try {
      const ExcelJS = await import("exceljs");
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buffer = evt.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        
        const data = [];
        const headers = [];
        
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
           headers[colNumber] = cell.value?.toString().trim();
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (!header) return;
            // Resolve formula cells: ExcelJS returns {formula, result} for cells with formulas
            let val = cell.value;
            if (val !== null && typeof val === 'object') {
              if ('result' in val) val = val.result;           // formula cell → use result
              else if ('text' in val) val = val.text;          // rich-text cell → use text
              else if ('error' in val) val = null;             // error cell → null
              else val = String(val);                          // any other object → stringify
            }
            rowData[header] = val ?? '';
          });
          if (Object.keys(rowData).length > 0) data.push(rowData);
        });
        
        if (data && data.length > 0) {
           const headerString = headers.join(" ").toLowerCase();
           let listType = contextTarget || "Registry";
           let forcedCategory = null;
           if (listType.includes(":")) {
             [listType, forcedCategory] = listType.split(":");
           }
           
           if (!contextTarget) {
             if (headerString.includes("cgpa") || headerString.includes("applied") || headerString.includes("previous degree") || fileName.includes("admissions") || fileName.includes("applicant")) {
               listType = "Admissions";
             } else if (headerString.includes("matric") || headerString.includes("registered") || fileName.includes("registry") || fileName.includes("student")) {
               listType = "Registry";
             } else if (headerString.includes("employer") || headerString.includes("placement") || fileName.includes("alumni")) {
               listType = "Alumni";
             } else if (headerString.includes("expertise") || headerString.includes("specialization")) {
               listType = fileName.includes("supervisor") ? "Supervisors" : "Facilitators";
             } else if (headerString.includes("duration") || fileName.includes("course")) {
               listType = "ShortCourses";
             } else if (headerString.includes("location") || headerString.includes("workshop") || fileName.includes("event")) {
               listType = "Events";
             }
           }

           const extractProg = (fallbackProg, rowProg) => {
             const searchString = typeof fallbackProg === 'string' ? fallbackProg.toLowerCase() : "";
             const rowSearch = typeof rowProg === 'string' ? rowProg.toLowerCase() : "";
             const combined = searchString + " " + rowSearch;
             const isPhD = combined.includes("phd") || combined.includes("ph.d");
             const isMSc = combined.includes("msc") || combined.includes("m.sc");
             const prefix = isPhD ? "PhD" : "MSc";
             if (combined.includes("cybersecurity") || combined.includes("cyber security")) return `${prefix} Cybersecurity`;
             if (combined.includes("mis") || combined.includes("management information system")) return `${prefix} Management Information System`;
             if (combined.includes("artificial intelligence") || combined.includes("ai")) return `${prefix} Artificial Intelligence`;
             return "MSc Artificial Intelligence";
           };

           const extractCategory = (row) => {
             if (forcedCategory) return forcedCategory;
             const catStr = row["Category"] || row["Course Category"] || row["Cat"] || row["Type"] || "";
             const lower = String(catStr || "").toLowerCase();
             if (lower.includes("elective")) return "Elective";
             if (lower.includes("general")) return "General";
             return "Core";
           };

           const extractSemester = (semVal) => {
             const str = String(semVal || "").toLowerCase().trim();
             if (!str) return 1;
             if (str.includes("first") || str.includes("1st") || str === "1") return 1;
             if (str.includes("second") || str.includes("2nd") || str === "2") return 2;
             if (str.includes("third") || str.includes("3rd") || str === "3") return 3;
             const match = str.match(/\d+/);
             return match ? parseInt(match[0]) : 1;
           };

           const splitName = (fullName) => {
             if (!fullName) return { surname: "Unknown", otherNames: "N/A" };
             const parts = fullName.trim().split(/\s+/);
             if (parts.length === 1) return { surname: parts[0], otherNames: "N/A" };
             return { surname: parts[parts.length - 1], otherNames: parts.slice(0, -1).join(" ") };
           };

           if (listType === "Registry") {
             const newStudents = data.map((row) => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"] || row["Names"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || "");
               const prog = extractProg(fileName, row["Programme"] || row["Program"]);
               return {
                 matricNo: row["Matric Number"] || row["Matric No"] || row["ID"] || `ACE/${new Date().getFullYear()}/${Math.floor(Math.random()*10000)}`,
                 id: row["Matric Number"] || row["Matric No"] || row["ID"],
                 surname, otherNames, name: `${surname} ${otherNames}`,
                 programme: prog, sem: parseInt(row["Semester"]) || 1, level: parseInt(row["Level"]) || 800,
                 gender: row["Gender"] || row["Sex"] || "N/A",
                 status: row["Status"] || "Active",
                 email: row["Personal Email"] || row["Email"] || "",
                 personalEmail: row["Personal Email"] || row["Email"] || "",
                 instEmail: row["Institutional Email"] || row["Inst Email"] || "",
                 phone: row["Phone Number"] || row["Phone"] || "",
                 nationality: row["Nationality"] || row["Nat"] || "Unknown",
                 cohort: row["Cohort"] || ""
               };
             });
             setStudents(prev => [...newStudents, ...prev]);
             try {
               const result = await api.post("/students/bulk", { students: newStudents });
               let msg = `Imported ${newStudents.length} student records.`;
               if (result?.inserted != null) msg = `Saved: ${result.inserted} inserted; ${result.skipped || 0} skipped.`;
               if (result?.duplicateMatrics?.length) msg += ` Duplicate matrics: ${result.duplicateMatrics.slice(0, 15).join(", ")}${result.duplicateMatrics.length > 15 ? "…" : ""}.`;
               alert(msg);
               if (typeof fetchData === 'function') fetchData();
             } catch (bulkErr) { alert(bulkErr?.message || "Bulk save failed."); }
           } else if (listType === "Admissions" || listType === "AdmittedPool") {
             const isAdmittedList = fileName.includes("admitted");
             const newApps = data.map((row) => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || row["Applicant Name"] || "");
               const prog = extractProg(fileName, row["Programme"] || row["Program"]);
               return {
                 surname, otherNames, name: `${surname} ${otherNames}`, programme: prog,
                 matricNo: row["Matric Number"] || row["Matric No"] || "",
                 maidenName: row["Maiden Name"] || "",
                 homeTown: row["Home Town"] || "",
                 postalAddress: row["Postal Address"] || "",
                 mobileNumber: row["Mobile Number"] || "",
                 stateProvinceRegion: row["State/Province/Region"] || "",
                 employmentStatus: row["Employment Status"] || "",
                 firstSittingExam: row["First Sitting Exam Details"] || "",
                 firstSittingDetails: row["First Sitting Subjects & Grades"] || "",
                 secondSittingExam: row["Second Sitting Exam Details"] || "",
                 secondSittingDetails: row["Second Sitting Subjects & Grades"] || "",
                 academicQualifications: row["Academic Qualifications"] || "",
                 workExperience: row["Relevant Work Experience"] || "",
                 nationality: row["Nationality"] || "Unknown",
                 gender: row["Gender"] || "N/A",
                 appliedDate: row["Date Applied"] || new Date().toISOString(),
                 status: (listType === "AdmittedPool" || isAdmittedList) ? "Admitted" : (row["Status"] || "Pending"),
                 personalEmail: row["Email Address"] || row["Personal Email"] || row["Email"] || "",
                 instEmail: row["Institutional Email"] || row["Inst Email"] || "",
                 phone: row["Phone Number"] || row["Phone"] || "",
                 cohort: row["Cohort"] || ""
               };
             });
             setApplications(prev => [...newApps, ...prev]);
             try {
               const result = await api.post("/applications/bulk", { applications: newApps });
               let msg = `Imported ${newApps.length} candidates.`;
               if (result?.inserted != null) msg = `Saved: ${result.inserted} inserted; ${result.skipped || 0} skipped.`;
               if (result?.errors?.length) msg += `\nErrors: ${result.errors.slice(0, 5).join(", ")}${result.errors.length > 5 ? "…" : ""}`;
               alert(msg);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("UI updated locally, but server rejected bulk upload."); }
           } else if (listType === "Alumni") {
             const newAlumni = data.map((row) => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || "");
               const prog = extractProg(fileName, row["Programme"] || row["Program"]);
               return {
                 surname, otherNames, name: `${surname} ${otherNames}`,
                 id: row["Matric Number"] || row["Matric No"] || row["ID"] || "N/A",
                 matricNo: row["Matric Number"] || row["Matric No"] || "N/A",
                 programme: prog, gradYear: parseInt(row["Grad Year"]) || 2024, level: parseInt(row["Level"]) || 800,
                 gender: row["Gender"] || "N/A", nationality: row["Nationality"] || "Unknown",
                 employer: row["Employer"] || "N/A", jobRole: row["Job Role"] || row["Role"] || "N/A", engagement: "Medium",
                 personalEmail: row["Personal Email"] || row["Email"] || "",
                 instEmail: row["Inst Email"] || row["Institutional Email"] || "",
                 phone: row["Phone Number"] || row["Phone"] || "", status: "Alumni",
                 cohort: row["Cohort"] || ""
               };
             });
             setAlumni(prev => [...newAlumni, ...prev]);
             try {
               await api.post("/alumni/bulk", { alumni: newAlumni });
               alert(`Imported ${newAlumni.length} alumni.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("UI updated; backend save failed."); }
           } else if (listType === "Supervisors") {
             const newSups = data.map(row => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || "");
               return {
                 name: `${surname} ${otherNames}`, surname, otherNames,
                 username: (row["Email"] || row["Institutional Email"] || "").split("@")[0] || `sup_${Math.floor(Math.random()*10000)}`,
                 email: row["Institutional Email"] || row["Email"] || `sup_${Math.floor(Math.random()*100000)}@acetel.edu.ng`,
                 role: 'facilitator',
                 dept: row["Department"] || row["Discipline"] || "N/A", 
                 specialization: row["Expertise"] || "N/A",
                 phone: row["Phone Number"] || row["Phone"] || "N/A",
               };
             });
             try {
               await api.post("/users/bulk", { users: newSups });
               alert(`Imported ${newSups.length} supervisors/facilitators.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for supervisors."); }
           } else if (listType === "AdmissionHub") {
             const newRecords = data.map(row => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || "");
               const rawNotes = row["Rejection Notes"] || row["Deficiency Notes"] || row["Reason"] || "";
               const parsedNotes = rawNotes
                 ? rawNotes.split(/[;,|]/).map(s => s.trim()).filter(Boolean)
                 : [];
               return {
                 name: `${surname} ${otherNames}`.trim() || row["Name"] || "Unknown",
                 surname,
                 otherNames,
                 email: row["Email"] || row["Email Address"] || "",
                 phone: row["Phone"] || row["Phone Number"] || "",
                 programme: row["Programme"] || row["Program"] || "",
                 cohort: row["Cohort"] || "",
                 matricNo: row["Matric No"] || row["Matric Number"] || row["Matric"] || "",
                 admissionStatus: "Pending",
                 rejectionNotes: parsedNotes,
               };
             });
             setAdmissionHub(prev => [...newRecords.map(r => ({ ...r, id: `ah_${Date.now()}_${Math.random().toString(36).substr(2,5)}` })), ...prev]);
             try {
               const result = await api.post("/admission-hub/bulk", { records: newRecords });
               let msg = `Imported ${newRecords.length} records to Admission Hub.`;
               if (result?.created != null) msg = `Saved: ${result.created} records processed. Backend auto-matched against admitted pool.`;
               alert(msg);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for Admission Hub: " + (err?.response?.data?.message || err.message)); }
           } else if (listType === "Facilitators") {
             const newFacs = data.map(row => {
               const sName = row["Surname"] || row["Last Name"];
               const oNames = row["Other Names"] || row["First Name"];
               let { surname, otherNames } = (sName && oNames) ? { surname: sName, otherNames: oNames } : splitName(row["Full Name"] || row["Name"] || "");
               const emailVal = row["Email Address"] || row["Email"] || row["Institutional Email"] || row["Personal Email"] || row["Contact Email"] || `fac_${Math.floor(Math.random()*100000)}@acetel.edu.ng`;
               const rawUsername = emailVal.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_") || `fac_${Math.floor(Math.random()*10000)}`;
               const dept = row["Department"] || row["Discipline"] || "";
               return {
                 name: `${surname} ${otherNames}`.trim(),
                 username: rawUsername,
                 email: emailVal,
                 password: "Welcome123",
                 role: 'facilitator',
                 department: dept,
                 specialization: row["Expertise"] || row["Specialization"] || "",
                 phone: row["Phone Number"] || row["Phone"] || "",
                 programmes: dept ? [dept] : [],
                 status: 'active'
               };
             });
             setFacilitators(prev => [...newFacs.map(f => ({ ...f, id: `fac_${Date.now()}_${Math.random().toString(36).substr(2,5)}` })), ...prev]);
             try {
               const result = await api.post("/users/bulk", { users: newFacs });
               let msg = `Imported ${newFacs.length} facilitators.`;
               if (result?.created != null) msg = `Saved: ${result.created} created; ${result.failed || 0} failed.`;
               if (result?.errors?.length) msg += ` Errors: ${result.errors.slice(0, 3).join(", ")}`;
               alert(msg);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for facilitators: " + (err?.response?.data?.message || err.message)); }
           } else if (listType === "ShortCourses") {
             const newCourses = data.map(row => ({ 
               title: row["Course Title"] || row["Title"] || row["Course Name"] || row["Name"] || row["Programme"] || `Course ${Math.floor(Math.random()*100000)}`, 
               duration: row["Duration"] || row["Course Duration"] || "N/A", 
               studentsCount: parseInt(row["Students"] || row["Participants"] || row["Enrollment"] || "0") || 0,
               facilitatorName: row["Facilitator"] || row["Instructor"] || row["Trainer"] || "",
               startDate: row["Start Date"] || row["Date"] || "",
               status: "Active",
               students: [],
               participants: []
             }));
             // Optimistic UI update so cards appear immediately
             setShortCourses(prev => [...newCourses.map(c => ({ ...c, id: `sc_${Date.now()}_${Math.random().toString(36).substr(2,5)}` })), ...prev]);
             try {
               await api.post("/short-courses/bulk", { courses: newCourses });
               alert(`Imported ${newCourses.length} short courses.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for short courses: " + (err?.response?.data?.message || err.message)); }
           } else if (listType === "Academic_Courses" || listType === "AcademicPool") {
             const newCourses = data.map(row => ({
               code: (row["Course Code"] || row["Code"] || "").toUpperCase(),
               title: row["Course Title"] || row["Title"] || "Unknown",
               programme: extractProg(fileName, row["Programme"] || row["Program"]),
               sem: extractSemester(row["Semester"] || row["Sem"] || row["SEM"] || row["semester"] || row["Sems"] || row["LEVEL"] || row["Level"] || row["Semesters"] || row["Semester Name"]),
               cat: extractCategory(row),
               creditUnits: parseInt(row["Credit Units"] || row["Units"]) || 3,
               status: "Active"
             }));
             try {
               await api.post("/academic-courses/bulk", { courses: newCourses });
               alert(`Imported ${newCourses.length} course modules.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("UI updated; backend save failed."); }
           } else if (listType === "Events") {
             const newEvents = data.map(row => ({ 
               type: row["Type"] || (fileName.toLowerCase().includes("workshop") ? "Workshop" : "Conference"), 
               name: row["Name"] || row["Title"] || row["Event Name"] || row["Workshop Name"] || "Unknown", 
               date: row["Date"] || row["Event Date"] || new Date().toISOString().split("T")[0], 
               location: row["Location"] || row["Venue"] || "N/A",
               attendance: []
             }));
             // Optimistic UI update so cards appear immediately
             setAcademicEvents(prev => [...newEvents.map(e => ({ ...e, id: `ev_${Date.now()}_${Math.random().toString(36).substr(2,5)}` })), ...prev]);
             try {
               await api.post("/academic-events/bulk", { events: newEvents });
               alert(`Imported ${newEvents.length} workshops/events.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for events: " + (err?.response?.data?.message || err.message)); }
           } else if (listType === "EventAttendance") {
             const newAttendees = data.map(row => ({
               name: row["Name"] || row["Full Name"] || "Unknown",
               email: row["Email"] || row["Email Address"] || "N/A",
               phone: row["Phone"] || row["Phone Number"] || "N/A",
               status: row["Status"] || "Present"
             }));
             try {
               await api.patch(`/academic-events/${forcedCategory}/attendance`, { attendees: newAttendees });
               alert(`Imported ${newAttendees.length} attendees.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for event attendance."); }
           } else if (listType === "CourseStudents") {
             const newStudents = data.map(row => ({
               name: row["Name"] || row["Full Name"] || "Unknown",
               email: row["Email"] || row["Email Address"] || "N/A",
               phone: row["Phone"] || row["Phone Number"] || "N/A",
               role: row["Role"] || "Participant",
               status: row["Status"] || "Active"
             }));
             try {
               await api.patch(`/short-courses/${forcedCategory}/students`, { students: newStudents });
               alert(`Imported ${newStudents.length} course participants.`);
               if (typeof fetchData === 'function') fetchData();
             } catch (err) { alert("Bulk save failed for course participants."); }
           }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) { console.error(err); alert("Error parsing Excel file."); }
    e.target.value = "";
  };

  const handleExport = async (type) => {
    if (type === "administrative" || type === "administrative-pdf") {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      
      // Add Letterhead
      try {
        const img = new Image();
        img.src = "/images/letterhead.png";
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        if (img.complete && img.naturalWidth > 0) {
          doc.addImage(img, 'PNG', 0, 0, 210, 40); // Standard A4 width is 210mm
        }
      } catch (err) {
        console.warn("Letterhead image not found, skipping...");
      }

      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("Official Student Details Report", 105, 50, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 56, { align: "center" });

      const tableData = students.map(s => [
        s.name.split(" ")[0],
        s.name.split(" ").slice(1).join(" "),
        s.id,
        s.gender || "N/A",
        s.email || "N/A",
        s.instEmail || "N/A",
        s.phone || "N/A",
        s.prog,
        s.sem,
        s.status
      ]);

      autoTable(doc, {
        startY: 65,
        head: [["Surname", "Other Names", "Matric No", "Gender", "Personal Email", "Inst. Email", "Phone", "Prog", "Sem", "Status"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillStyle: '#1e3a8a', textColor: 255 },
        styles: { fontSize: 8 },
      });

      doc.save(`ACETEL_Official_Student_Details_${new Date().getFullYear()}.pdf`);
    } else if (type === "administrative-csv") {
      const headers = ["Surname", "Other Names", "Matric No", "Gender", "Personal Email", "Inst. Email", "Phone", "Prog", "Sem", "Status"];
      const rows = students.map(s => [
        `"${s.name.split(" ")[0]}"`,
        `"${s.name.split(" ").slice(1).join(" ")}"`,
        `"${s.id}"`,
        `"${s.gender || "N/A"}"`,
        `"${s.email || "N/A"}"`,
        `"${s.instEmail || "N/A"}"`,
        `"${s.phone || "N/A"}"`,
        `"${s.prog}"`,
        `"${s.sem}"`,
        `"${s.status}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `ACETEL_Official_Student_Details_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "analytics" || type === "analytics-pdf") {
      // (Rich Analytics PDF code remains same as previous implementation)
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "portrait", format: "a4" });
      const W = 210; const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const drawBar = (x, y, value, max, width, height, r, g, b) => {
        const filled = max > 0 ? Math.min((value / max) * width, width) : 0;
        doc.setFillColor(40, 52, 80); doc.rect(x, y, width, height, "F");
        doc.setFillColor(r, g, b); doc.rect(x, y, filled, height, "F");
      };
      doc.setFillColor(6, 12, 24); doc.rect(0, 0, W, 297, "F");
      doc.setFillColor(30, 58, 138); doc.rect(0, 0, W, 38, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("ACETEL ANALYTICS REPORT", W / 2, 16, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("African Centre of Excellence in Technology-Enhanced Learning", W / 2, 24, { align: "center" });
      doc.text(`Generated: ${dateStr}`, W / 2, 31, { align: "center" });
      const kpis = [
        { label: "Total Students", value: students.length, color: [59, 130, 246] },
        { label: "MSc Students", value: students.filter(s => s.prog?.includes("MSc")).length, color: [99, 102, 241] },
        { label: "PhD Students", value: students.filter(s => s.prog?.includes("PhD")).length, color: [139, 92, 246] },
        { label: "Applications", value: applications.length, color: [16, 185, 129] },
        { label: "Alumni", value: alumni.length, color: [245, 158, 11] },
        { label: "At-Risk Students", value: students.filter(s => s.remaining <= 1 || s.status === "Inactive").length, color: [239, 68, 68] },
      ];
      const cardW = 58, cardH = 28, cardGap = 8, startX = 16, startY = 46;
      kpis.forEach((k, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = startX + col * (cardW + cardGap); const y = startY + row * (cardH + cardGap);
        doc.setFillColor(20, 30, 55); doc.roundedRect(x, y, cardW, cardH, 3, 3, "F");
        doc.setDrawColor(k.color[0], k.color[1], k.color[2]); doc.setLineWidth(0.5);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, "S");
        doc.setTextColor(k.color[0], k.color[1], k.color[2]); doc.setFontSize(20); doc.setFont("helvetica", "bold");
        doc.text(String(k.value), x + cardW / 2, y + 14, { align: "center" });
        doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(k.label, x + cardW / 2, y + 22, { align: "center" });
      });
      let curY = startY + 2 * (cardH + cardGap) + 14;
      doc.setTextColor(226, 232, 240); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Student Distribution by Programme", 16, curY); curY += 7;
      const progData = (["MSc Cybersecurity", "MSc Artificial Intelligence", "MSc Management Information System", "PhD Cybersecurity", "PhD Artificial Intelligence", "PhD Management Information System"]).map(p => ({
        label: p.replace("Artificial Intelligence", "AI").replace("Management Information System", "MIS"),
        value: students.filter(s => s.prog === p).length,
      }));
      const maxProg = Math.max(...progData.map(d => d.value), 1);
      const barAreaW = W - 90;
      progData.forEach((p, i) => {
        const y = curY + i * 10; doc.setTextColor(148, 163, 184); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
        doc.text(p.label, 16, y + 4); drawBar(85, y, p.value, maxProg, barAreaW, 6, 99, 102, 241);
        doc.setTextColor(99, 102, 241); doc.text(String(p.value), 85 + barAreaW + 3, y + 5);
      });
      curY += progData.length * 10 + 10;
      doc.setTextColor(226, 232, 240); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Admissions Funnel", 16, curY); curY += 7;
      const funnelData = [
        { name: "Applied", value: applications?.length, color: [59, 130, 246] },
        { name: "Shortlisted", value: Math.floor(applications?.length * 0.8), color: [99, 102, 241] },
        { name: "Admitted", value: applications?.filter(a => a?.status === "Admitted")?.length, color: [139, 92, 246] },
        { name: "Enrolled", value: students?.length, color: [167, 139, 250] },
      ];
      const maxFunnel = Math.max(...funnelData.map(d => d.value), 1);
      funnelData.forEach((f, i) => {
        const y = curY + i * 10; doc.setTextColor(148, 163, 184); doc.setFontSize(8);
        doc.text(f.name, 16, y + 4); drawBar(55, y, f.value, maxFunnel, barAreaW + 30, 6, f.color[0], f.color[1], f.color[2]);
        doc.setTextColor(f.color[0], f.color[1], f.color[2]); doc.text(String(f.value), 55 + barAreaW + 33, y + 5);
      });
      doc.addPage(); doc.setFillColor(6, 12, 24); doc.rect(0, 0, W, 297, "F");
      doc.setFillColor(30, 58, 138); doc.rect(0, 0, W, 14, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text("ACETEL ANALYTICS — STUDENT DETAIL", W / 2, 10, { align: "center" });
      autoTable(doc, {
        startY: 20,
        head: [["Name", "Programme", "Semester", "Status", "Supervisor"]],
        body: students.map(s => [s.name, s.prog, s.sem, s.status, s.supervisor || "Unassigned"]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 7.5, textColor: [148, 163, 184], fillColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [20, 30, 55] },
        tableLineColor: [40, 52, 80], tableLineWidth: 0.2,
      });
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p); doc.setFillColor(15, 23, 42); doc.rect(0, 289, W, 8, "F");
        doc.setTextColor(71, 85, 105); doc.setFontSize(7);
        doc.text(`ACETEL SDMS | Confidential | Page ${p} of ${totalPages}`, W / 2, 294, { align: "center" });
      }
      doc.save(`ACETEL_Analytics_Report_${now.toISOString().split("T")[0]}.pdf`);
    } else if (type === "analytics-csv") {
      const exportData = [
        { Metric: "Total Students", Value: students.length },
        { Metric: "MSc Students", Value: students.filter(s => s.prog.includes("MSc")).length },
        { Metric: "PhD Students", Value: students.filter(s => s.prog.includes("PhD")).length },
        { Metric: "Applications Received", Value: applications.length },
        { Metric: "Graduated Alumni", Value: alumni.length },
      ];
      const headers = ["Metric", "Value"];
      const rows = exportData.map(d => [`"${d.Metric}"`, d.Value]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `ACETEL_Analytics_Summary_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGranularExport = async () => {
    const { target, format, prog, session, semester } = exportConfig;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    
    let exportData = [];
    let headers = [];
    let title = "";
    let fileName = "";

    if (target === "registry") {
      let filtered = [...students];
      if (prog !== "All Programmes") filtered = filtered.filter(s => s.prog === prog);
      if (session !== "All Sessions") filtered = filtered.filter(s => s.entry?.includes(session));
      if (semester !== "All Semesters") filtered = filtered.filter(s => String(s.sem) === semester);
      
      title = `${prog === "All Programmes" ? "Universal" : prog} Students Report`;
      fileName = `ACETEL_Students_${prog.replace(/ /g, "_")}`;
      headers = [["Surname", "Other Names", "Matric No", "Gender", "Email", "Prog", "Sem", "Status"]];
      exportData = filtered.map(s => [s.name.split(" ")[0], s.name.split(" ").slice(1).join(" "), s.id, s.gender || "N/A", s.email || "N/A", s.prog, s.sem, s.status]);
    } else if (target === "admissions") {
      let filtered = applications.filter(a => a.status === "Admitted");
      if (prog !== "All Programmes") filtered = filtered.filter(a => a.prog === prog);
      
      title = `Admitted Students Report (${prog})`;
      fileName = `ACETEL_Admissions_${prog.replace(/ /g, "_")}`;
      headers = [["Applicant Name", "Programme", "Prev Degree", "CGPA", "Nationality", "Date Applied"]];
      exportData = filtered.map(a => [a.name, a.prog, a.degree, a.cgpa, a.nat, a.date]);
    } else if (target === "graduated") {
      let filtered = students.filter(s => s.status === "Graduated");
      if (prog !== "All Programmes") filtered = filtered.filter(s => s.prog === prog);
      
      title = `Graduated Students Report (${prog})`;
      fileName = `ACETEL_Graduates_${prog.replace(/ /g, "_")}`;
      headers = [["Name", "Matric No", "Programme", "Grad Year", "Final CGPA", "Supervisor"]];
      exportData = filtered.map(s => [s.name, s.id, s.prog, s.gradYear, s.cgpa || "N/A", s.supervisor]);
    } else if (target === "alumni") {
      let filtered = [...alumni];
      if (prog !== "All Programmes") filtered = filtered.filter(a => a.prog === prog);
      
      title = `Official Alumni Directory (${prog})`;
      fileName = `ACETEL_Alumni_${prog.replace(/ /g, "_")}`;
      headers = [["Name", "Matric No", "Programme", "Grad Year", "Employer", "Role", "Location"]];
      exportData = filtered.map(a => [a.name, a.id, a.prog, a.gradYear, a.employer, a.role, a.location]);
    } else if (target === "facilitators") {
      let filtered = [...facilitators];
      title = "Official Facilitator Directory";
      fileName = `ACETEL_Facilitators`;
      headers = [["Name", "Department", "Expertise", "Email", "Phone", "Office"]];
      exportData = filtered.map(f => [f.name, f.dept, f.expertise, f.email, f.phone || "N/A", f.office || "N/A"]);
    } else if (target === "ecosystem") {
      title = "Short Courses & Academic Events Summary";
      fileName = `ACETEL_Ecosystem`;
      headers = [["Category", "Title", "In-Charge", "Schedule", "Metrics"]];
      const courses = shortCourses.map(c => ["Short Course", c.title, c.facilitatorName || "N/A", c.startDate || "N/A", `${c.studentsCount} Students`]);
      const events = academicEvents.map(e => [e.type, e.name, e.speaker || "N/A", e.date, `${e.attendance?.length || 0} Attendees`]);
      exportData = [...courses, ...events];
    } else if (target === "audit") {
      title = "System Audit Trail & Security Logs";
      fileName = `ACETEL_AuditTrail`;
      headers = [["Timestamp", "Action", "Target", "Reason", "Officer"]];
      exportData = auditLogs.map(l => [new Date(l.timestamp).toLocaleString(), l.action, l.targetName, l.reason, l.officer]);
    }

    if (format === "csv") {
      const csvContent = [headers[0].join(","), ...exportData.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    } else {
      const doc = new jsPDF();
      
      // Add Official Letterhead Image
      try {
        const img = new Image();
        img.src = "/images/letterhead.png";
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        if (img.complete && img.naturalWidth > 0) {
          doc.addImage(img, 'PNG', 0, 0, 210, 40);
        } else {
          // Fallback if image fails
          doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 40, "F");
          doc.setTextColor(255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
          doc.text("ACETEL", 15, 20);
          doc.setFontSize(10); doc.setFont("helvetica", "normal");
          doc.text("Africa Centre of Excellence on Technology Enhanced Learning", 15, 28);
          doc.text("National Open University of Nigeria", 15, 33);
          doc.setFillColor(0, 135, 81); doc.rect(0, 40, 210, 2, "F");
        }
      } catch (err) {
        console.warn("Letterhead image not found in granular export, using fallback.");
      }

      doc.setTextColor(40); doc.setFontSize(16);
      doc.text(title.toUpperCase(), 105, 55, { align: "center" });
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Filters: ${prog} | Session: ${session} | Semester: ${semester}`, 105, 61, { align: "center" });
      doc.text(`Official System Generated Document | ${new Date().toLocaleString()}`, 105, 66, { align: "center" });

      autoTable(doc, {
        startY: 75,
        head: headers,
        body: exportData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2, font: "helvetica" },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });

      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    setShowExportModal(false);
  };

  const handleAuditExport = async (format) => {
    if (format === 'pdf') {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("System Audit Trail Report", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });

      const tableData = auditLogs.map(l => [
        new Date(l.timestamp).toLocaleString(),
        l.action,
        `${l.targetName} (${l.targetId})`,
        l.reason,
        l.officer
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["Timestamp", "Action", "Target", "Reason", "Officer"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      });
      doc.save(`ACETEL_Audit_Trail_${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      const headers = ["Timestamp", "Action", "Target", "Reason", "Officer"];
      const rows = auditLogs.map(l => [
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.action}"`,
        `"${l.targetName} (${l.targetId})"`,
        `"${l.reason.replace(/"/g, '""')}"`,
        `"${l.officer}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `ACETEL_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Callback: append uploaded students to a specific course in state
  const handleCourseStudentsUploaded = (course, newStudents) => {
    setShortCourses(prev => prev.map(c =>
      (c.id === course.id || c.title === course.title)
        ? { ...c, students: [...(c.students || []), ...newStudents], studentsCount: (c.studentsCount || 0) + newStudents.length }
        : c
    ));
  };

  // Callback: append uploaded attendees to a specific event in state
  const handleEventAttendanceUploaded = (event, newAttendees) => {
    setAcademicEvents(prev => prev.map(e =>
      (e.id === event.id || e.name === event.name)
        ? { ...e, attendance: [...(e.attendance || []), ...newAttendees] }
        : e
    ));
  };

  const handleMessage = (recipient) => {
    const defaultMsg = recipient?.name ? `Hello ${recipient.name}, ` : "";
    const msg = prompt(`Send a message to ${recipient?.name || 'Network'}:`, defaultMsg);
    if (msg) {
      alert(`Message successfully sent to ${recipient?.name || 'Network'}.`);
    }
  };

  const handleDownloadTemplate = async (type) => {
    let headers = [];
    let filename = `ACETEL_${type}_Template.xlsx`;

    switch (type) {
      case "Registry":
        headers = [["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Institutional Email", "Personal Email", "Programme", "Level", "Semester", "Gender", "Phone", "Nationality", "Status"]];
        break;
      case "AdmittedPool":
        headers = [["S/N", "Surname", "Other Names", "Cohort", "Matric Number", "Institutional Email", "Personal Email", "Programme", "Gender", "Phone", "Nationality", "Date Admitted"]];
        break;
      case "Admissions":
      case "Applicants":
        headers = [["S/N", "Completed", "Programme of Choice", "Surname", "Other Names", "Maiden Name", "Gender", "Phone Number", "Nationality", "Home Town", "Postal Address", "Mobile Number", "Email Address", "State/Province/Region", "Employment Status", "First Sitting Exam Details", "First Sitting Subjects & Grades", "Second Sitting Exam Details", "Second Sitting Subjects & Grades", "Academic Qualifications", "Relevant Work Experience"]];
        break;
      case "Facilitators":
        headers = [["Surname", "Other Names", "Email Address", "Phone Number", "Department", "Expertise", "Course Code", "Course Title", "Programme", "Semester (1-3)", "Category (Core/Elective/General)"]];
        break;
      case "Alumni":
        headers = [["Surname", "Other Names", "Cohort", "Matric Number", "Institutional Email", "Personal Email", "Programme", "Level", "Gender", "Phone", "Nationality", "Graduation Data", "Status"]];
        break;
      case "Academic_Courses":
        headers = [["Course Code", "Course Title", "Programme", "Semester (1=First / 2=Second / 3=Third)", "Category (Core/Elective/General)"]];
        break;
      case "Short_Courses":
      case "Workshops":
        headers = [["Full Name", "Email Address", "Phone Number", "Organisation", "Role", "Status (Active/Completed/Enrolled)"]];
        break;
      default:
        headers = [["ID", "Name", "Details"]];
    }

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");
    worksheet.addRows(headers);
    
    // Auto-width columns for professional appearance
    worksheet.columns.forEach(col => { col.width = 25; });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <LoginModal isOpen={true} onClose={() => navigate('/')} />
      </div>
    );
  }

  const renderContent = () => {
    const statsReady = true; // Always render; OverviewTab and GovernanceTab use EMPTY_DASHBOARD fallback internally
    const safeStats = dashboardStats || EMPTY_DASHBOARD;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Section Header & Sub-Tabs */}
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0B3D2E", marginBottom: 4, fontFamily: "'Playfair Display', serif" }}>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
              Manage and monitor your {activeSection} data.
            </p>
          </div>

          {/* Contextual Sub-Tabs */}
          <div style={{ display: "flex", gap: 0, background: "#fff", border: "1px solid #E5E0D5", padding: 4, borderRadius: 12 }}>
            {(() => {
              const tabs = {
                dashboard: [
                  { id: 'overview', label: 'Analytics' },
                  { id: 'ai', label: 'AI Insights' }
                ],
                students: [
                  { id: 'registered', label: 'Registered' },
                  { id: 'admitted_pool', label: 'Admitted' },
                  { id: 'gaps', label: 'Alignment' },
                  { id: 'admission_hub', label: 'Admission Hub' },
                  { id: 'admissions', label: 'Applications' },
                  { id: 'alumni', label: 'Alumni' }
                ],
                academics: [
                  { id: 'courses', label: 'Courses' },
                  { id: 'facilitators', label: 'Facilitators' }
                ],
                programs: [
                  { id: 'short_courses', label: 'Short Courses' },
                  { id: 'workshops', label: 'Workshops' }
                ],
                admin: [
                  { id: 'governance', label: 'Governance' },
                  { id: 'users', label: 'Users' }
                ]
              }[activeSection] || [];

              return tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`db-subtab-btn${activeSubTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              ));
            })()}
          </div>
        </div>

        {/* Section Content */}
        {(() => {
          if (activeSection === 'dashboard') {
            if (activeSubTab === 'overview') return (
              <OverviewTab
                data={safeStats}
                onRefresh={fetchData}
                onExport={handleGlobalExport}
                shortCourses={shortCourses}
                academicEvents={academicEvents}
                user={user}
                auditLogs={auditLogs}
                onNavigate={(section, sub) => {
                  setActiveSection(section);
                  setActiveSubTab(sub);
                }}
                analyticsSummary={analyticsSummary}
                analyticsDateRange={{ from: analyticsDateFrom, to: analyticsDateTo }}
                onAnalyticsDateRangeChange={(r) => {
                  setAnalyticsDateFrom(r.from);
                  setAnalyticsDateTo(r.to);
                }}
              />
            );
            if (activeSubTab === 'ai') return <AITab data={{ students, metrics }} analyticsSummary={analyticsSummary} />;
          }

          if (activeSection === 'students') {
            if (activeSubTab === 'registered') return <RegisteredStudentsTab data={{ students }} onEdit={(item) => setEditData({ ...item, _editType: 'student' })} onDelete={setDeleteData} onHistory={handleFileUpload} onAddStudent={() => setShowAddStudentModal(true)} progFilter={studentProgFilter} setProgFilter={setStudentProgFilter} cohortFilter={studentCohortFilter} setCohortFilter={setStudentCohortFilter} onDownloadTemplate={handleDownloadTemplate} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
            if (activeSubTab === 'admission_hub') return <AdmissionHubTab
              data={{ admissionHub }}
              onBulkUpload={handleFileUpload}
              onDownloadTemplate={handleDownloadTemplate}
              onDelete={setDeleteData}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />;
            if (activeSubTab === 'admitted_pool') return <AdmittedStudentsTab data={{ applications }} onEdit={(item) => setEditData({ ...item, _editType: 'application' })} onDelete={setDeleteData} progFilter={admissionProgFilter} setProgFilter={setAdmissionProgFilter} cohortFilter={admissionCohortFilter} setCohortFilter={setAdmissionCohortFilter} onAddAdmitted={() => setShowAddAdmittedModal(true)} onBulkUpload={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
            if (activeSubTab === 'gaps') return <RegistryVsAdmissionsTab data={{ students, applications }} />;
            if (activeSubTab === 'admissions') return <AdmissionsTab data={{ applications, metrics, students }} onEdit={(item) => setEditData({ ...item, _editType: 'application' })} onDelete={setDeleteData} onHistory={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} cohortFilter={admissionCohortFilter} setCohortFilter={setAdmissionCohortFilter} onEvaluateEligibility={runAdmissionEvaluation} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
            if (activeSubTab === 'alumni') return <AlumniTab data={{ alumni }} onEdit={(item) => setEditData({ ...item, _editType: 'alumni' })} onDelete={setDeleteData} onHistory={handleFileUpload} onMessage={handleMessage} onDownloadTemplate={handleDownloadTemplate} cohortFilter={studentCohortFilter} setCohortFilter={setStudentCohortFilter} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
          }

          if (activeSection === 'academics') {
            if (activeSubTab === 'courses') return (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                 <AcademicCoursesTab category="Core" data={{ courses: academicCourses }} onEdit={(item) => setEditData({ ...item, _editType: 'course_module' })} onDelete={setDeleteData} onAddCourse={(cat) => { setNewAcademicForm({ ...newAcademicForm, cat }); setShowAddAcademicModal(true); }} onDownloadTemplate={handleDownloadTemplate} onBulkUpload={handleFileUpload} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
                 <AcademicCoursesTab category="Elective" data={{ courses: academicCourses }} onEdit={(item) => setEditData({ ...item, _editType: 'course_module' })} onDelete={setDeleteData} onAddCourse={(cat) => { setNewAcademicForm({ ...newAcademicForm, cat }); setShowAddAcademicModal(true); }} onDownloadTemplate={handleDownloadTemplate} onBulkUpload={handleFileUpload} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
                 <AcademicCoursesTab category="General" data={{ courses: academicCourses }} onEdit={(item) => setEditData({ ...item, _editType: 'course_module' })} onDelete={setDeleteData} onAddCourse={(cat) => { setNewAcademicForm({ ...newAcademicForm, cat }); setShowAddAcademicModal(true); }} onDownloadTemplate={handleDownloadTemplate} onBulkUpload={handleFileUpload} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
              </div>
            );
            if (activeSubTab === 'facilitators') return <FacilitatorsTab data={{ facilitators }} onEdit={(item) => setEditData({ ...item, _editType: 'facilitator', facilitatorCoursesJson: JSON.stringify(item.facilitatorCourses || [], null, 2) })} onDelete={setDeleteData} onHistory={handleFileUpload} onAddUser={() => setShowAddFacilitatorModal(true)} onDownloadTemplate={handleDownloadTemplate} onAddCoordinator={() => setShowAddCoordinatorModal(true)} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
          }

          if (activeSection === 'programs') {
            if (activeSubTab === 'short_courses') return <ShortCoursesTab data={{ shortCourses }} onBulkUpload={handleFileUpload} onAddCourse={() => setShowAddCourseModal(true)} onEdit={(item, type) => setEditData({ ...item, _editType: type })} onDelete={setDeleteData} onAddParticipant={(c) => { setTargetHub({ ...c, type: 'course' }); setShowAddParticipantModal(true); }} onDownloadTemplate={handleDownloadTemplate} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
            if (activeSubTab === 'workshops') return <WorkshopsTab data={{ academicEvents }} onBulkUpload={handleFileUpload} onAddEvent={() => setShowAddEventModal(true)} onEdit={(item, type) => setEditData({ ...item, _editType: type })} onDelete={setDeleteData} onAddParticipant={(e) => { setTargetHub({ ...e, type: 'event' }); setShowAddParticipantModal(true); }} onDownloadTemplate={handleDownloadTemplate} analyticsSummary={analyticsSummary} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
          }

          if (activeSection === 'admin') {
            if (activeSubTab === 'governance') return <GovernanceTab data={{ ...safeStats, cronStats }} auditLogs={auditLogs} />;
            if (activeSubTab === 'users') return <UserManagementTab users={users} onRefresh={fetchData} />;
            if (activeSubTab === 'audit_trail') return <AuditTrailTab logs={auditLogs} />;
          }

          return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Section under construction...</div>;
        })()}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4F6F3",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      color: "#1F2937",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap');
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C9A227; border-radius: 10px; }
        * { box-sizing: border-box; }

        .premium-card {
          background: #ffffff;
          border: 1px solid #E5E0D5;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 14px;
        }
        .premium-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11,61,46,0.08);
        }

        .db-nav-tab-btn {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .db-nav-tab-btn:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.08); }
        .db-nav-tab-btn.active { background: rgba(201,162,39,0.18); color: #C9A227; }

        .db-subtab-btn {
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: #9CA3AF;
          font-size: 13px;
          font-weight: 600;
          padding: 13px 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .db-subtab-btn:hover { color: #0B3D2E; }
        .db-subtab-btn.active { color: #0B3D2E; border-bottom-color: #C9A227; }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.99) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dash { animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* --- TOP NAVIGATION: Deep Forest Green --- */}
      <header style={{
        position: "sticky", top: 0, zIndex: 1100,
        background: "#0B3D2E",
        height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 40px",
      }}>
        {/* Left: Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "#C9A227", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CrossfadeLogo size={22} invert={false} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "0.02em" }}>ACETEL</div>
        </div>

        {/* Center: Main Nav Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "students", label: "Students" },
            { id: "academics", label: "Academics" },
            { id: "programs", label: "Programs" },
            { id: "admin", label: "Administration", adminOnly: true },
          ].map(nav => {
            if (nav.adminOnly && user?.role !== 'admin') return null;
            const isActive = activeSection === nav.id;
            return (
              <button
                key={nav.id}
                className={`db-nav-tab-btn${isActive ? ' active' : ''}`}
                onClick={() => {
                  setActiveSection(nav.id);
                  if (nav.id === 'dashboard') setActiveSubTab('overview');
                  if (nav.id === 'students') setActiveSubTab('registered');
                  if (nav.id === 'academics') setActiveSubTab('courses');
                  if (nav.id === 'programs') setActiveSubTab('short_courses');
                  if (nav.id === 'admin') setActiveSubTab('governance');
                }}
              >
                {nav.label}
              </button>
            );
          })}
        </div>

        {/* Right: Notifications + User */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Bell size={16} />
            {notifications.some(n => !n.read) && (
              <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, background: "#C9A227", borderRadius: "50%", border: "1.5px solid #0B3D2E" }} />
            )}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 16, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#C9A227", color: "#0B3D2E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
              {user?.name?.charAt(0) || "A"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{user?.name || "Admin"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,162,39,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{user?.role || "Staff"}</div>
            </div>
            <button onClick={logout} style={{ marginLeft: 4, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 6, padding: "5px 10px", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>LOGOUT</button>
          </div>
        </div>
      </header>

      {/* --- SEARCH BAR: White strip --- */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E0D5", padding: "10px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={16} style={{ color: "#9CA3AF", flexShrink: 0 }} />
        <div style={{ position: "relative", flex: 1, maxWidth: 560 }}>
          <input
            type="text"
            placeholder="Search students, courses, facilitators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "9px 14px",
              borderRadius: 8, border: "1px solid #E5E0D5",
              background: "#F4F6F3", fontSize: 13, fontWeight: 500,
              outline: "none", transition: "border-color 0.2s",
              fontFamily: "'DM Sans', sans-serif", color: "#374151"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0B3D2E"}
            onBlur={(e) => e.target.style.borderColor = "#E5E0D5"}
          />
          {searchQuery.length > 1 && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: 10, border: "1px solid #E5E0D5", boxShadow: "0 8px 24px rgba(11,61,46,0.1)", zIndex: 1200, padding: 6 }}>
              {students.filter(s => (s.name || "").toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(s => (
                <div key={s.id} onClick={() => { setActiveSection("students"); setActiveSubTab("registered"); setSearchQuery(""); }}
                  style={{ padding: "9px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F4F6F3"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E8F4EE", color: "#1F7A63", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(s.name || "?").charAt(0)}</div>
                  <div>
                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                    <span style={{ color: "#9CA3AF", fontSize: 11, marginLeft: 6 }}>({s.matricNo || s.studentId})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "28px 40px",
        minHeight: "calc(100vh - 130px)",
        width: "100%",
        display: "block"
      }}>
        {(() => {
          try {
            return renderContent();
          } catch (err) {
            console.error("Content Render Error:", err);
            return (
              <div style={{ padding: 40, background: "#fff", borderRadius: 16, border: "1px solid #fee2e2", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#991b1b", marginBottom: 8 }}>Dashboard Rendering Error</div>
                <div style={{ fontSize: 14, color: "#b91c1c" }}>{err.message}</div>
                <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 20px", background: "#991b1b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Reload System</button>
              </div>
            );
          }
        })()}
      </main>

        {/* MODALS */}
        {deleteData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>🗑️ Delete Record</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 20, fontWeight: 500, lineHeight: 1.5 }}>
                {deleteData._bulk 
                  ? `You are about to move ${deleteData.ids.length} selected items to the Recycle Bin.`
                  : `You are about to move ${deleteData.name || deleteData.title || "this item"} to the Recycle Bin.`
                } Please provide a mandatory reason for the audit trail.
              </div>
              <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Reason for deletion..." rows={3} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#1e293b", fontSize: 13, outline: "none", marginBottom: 20, resize: "none", fontWeight: 500 }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => {setDeleteData(null); setDeleteReason("");}} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleDeleteSubmit} style={{ background: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Move to Bin</button>
              </div>
            </div>
          </div>
        )}

        {restoreData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid rgba(0,135,81,0.2)", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#008751", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>♻️ Restore Record</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 20, fontWeight: 500, lineHeight: 1.5 }}>You are about to restore <b>{restoreData.name || restoreData.title}</b> from the Recycle Bin. Please provide a mandatory reason.</div>
              <textarea value={restoreReason} onChange={e => setRestoreReason(e.target.value)} placeholder="Reason for restoration..." rows={3} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#1e293b", fontSize: 13, outline: "none", marginBottom: 20, resize: "none", fontWeight: 500 }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => {setRestoreData(null); setRestoreReason("");}} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleRestoreSubmit} style={{ background: "#008751", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Restore Record</button>
              </div>
            </div>
          </div>
        )}

        {editData && editForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28, maxWidth: 500, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>📝 Edit Record</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {editForm._editType === 'course' ? (
                  // Ecosystem Course
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Course Title</label>
                      <input value={editForm.title || ""} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Duration</label>
                      <input value={editForm.duration || ""} onChange={e => setEditForm({...editForm, duration: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                  </>
                ) : editForm._editType === 'event' ? (
                  // Ecosystem Event
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Event Name</label>
                      <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Location</label>
                      <input value={editForm.location || ""} onChange={e => setEditForm({...editForm, location: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                  </>
                ) : editForm._editType === 'supervisor' ? (
                  // Supervisor
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
                      <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Expertise</label>
                      <input value={editForm.expertise || ""} onChange={e => setEditForm({...editForm, expertise: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Max Student Quota</label>
                      <input value={editForm.max || ""} type="number" onChange={e => setEditForm({...editForm, max: parseInt(e.target.value) || 0})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                  </>
                ) : editForm._editType === 'facilitator' ? (
                  // Facilitator
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
                      <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Department / Discipline</label>
                      <input value={editForm.dept || ""} onChange={e => setEditForm({...editForm, dept: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Office Details</label>
                      <input value={editForm.office || ""} onChange={e => setEditForm({...editForm, office: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Course attachments (JSON)</label>
                      <textarea
                        value={editForm.facilitatorCoursesJson || "[]"}
                        onChange={e => setEditForm({ ...editForm, facilitatorCoursesJson: e.target.value })}
                        rows={6}
                        placeholder={`[{"courseCode":"CIT801","programme":"MSc Artificial Intelligence","semester":1,"category":"Core"}]`}
                        style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 12, outline: "none", fontWeight: 500, fontFamily: "ui-monospace, monospace" }}
                      />
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>Semester: 1 = First, 2 = Second, 3 = Third. Category must be Core, Elective, or General.</div>
                    </div>
                  </>
                ) : editForm._editType === 'application' ? (
                  // Admissions / Applications
                  <>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
                      <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Programme of Choice</label>
                      <select value={editForm.prog || ""} onChange={e => setEditForm({...editForm, prog: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 700 }}>
                        {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Intake cohort</label>
                      <select value={editForm.cohort || ""} onChange={e => setEditForm({ ...editForm, cohort: e.target.value })} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 700 }}>
                        <option value="">— Select cohort —</option>
                        {ACETEL_COHORTS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Prior degree CGPA</label>
                      <input type="number" step={0.01} min={0} max={5} value={editForm.cgpa ?? ""} onChange={e => setEditForm({ ...editForm, cgpa: e.target.value === "" ? undefined : parseFloat(e.target.value) })} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 700 }} />
                    </div>
                    <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["paymentReceiptUploaded", "Payment receipt uploaded"],
                        ["bscMscCertificatesComplete", "BSc/MSc certificates verified"],
                        ["oLevelSatisfactory", "O'level requirements satisfied"],
                        ["researchProposalPass", "Research proposal passed assessment"],
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, fontWeight: 600, color: "#334155" }}>
                          <input type="checkbox" checked={!!editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.checked })} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Admission Status *</label>
                      <select 
                        value={editForm.status || "Pending"} 
                        onChange={e => {
                          const newStatus = e.target.value;
                          const nextForm = { ...editForm, status: newStatus };
                          if (newStatus !== "Not Admitted") nextForm.nonAdmissionReason = "";
                          setEditForm(nextForm);
                        }} 
                        style={{ width: "100%", background: "#f8fafc", border: `2px solid ${editForm.status === 'Admitted' ? "#008751" : editForm.status === 'Not Admitted' ? "#dc2626" : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px", color: "#0f172a", fontSize: 13, outline: "none", fontWeight: 800 }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Not Admitted">Not Admitted</option>
                      </select>
                    </div>

                    {editForm.status === 'Not Admitted' && (
                      <div style={{ gridColumn: "span 2", animation: "fadeInScale 0.3s ease-out" }}>
                        <label style={{ fontSize: 11, color: "#dc2626", fontWeight: 800, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Reason(s) for non-admission *</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px" }}>
                          {NON_ADMISSION_REASONS.map((reason) => (
                            <label key={reason} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, fontWeight: 600, color: "#991b1b", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={(editForm.nonAdmissionReasons || []).includes(reason)}
                                onChange={() => {
                                  const cur = editForm.nonAdmissionReasons || [];
                                  const next = cur.includes(reason) ? cur.filter((x) => x !== reason) : [...cur, reason];
                                  setEditForm({
                                    ...editForm,
                                    nonAdmissionReasons: next,
                                    nonAdmissionReason: next.join(" | "),
                                  });
                                }}
                              />
                              <span>{reason}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Student / Alumni / General
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
                      <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Programme</label>
                      <input value={editForm.prog || ""} onChange={e => setEditForm({...editForm, prog: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }} />
                    </div>
                    {editForm.sem !== undefined && (
                      <div>
                        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Semester</label>
                        <select 
                          value={editForm.sem} 
                          onChange={e => setEditForm({...editForm, sem: parseInt(e.target.value)})} 
                          style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }}
                        >
                          {Array.from({ length: (editForm.prog || "").includes("PhD") ? 12 : 6 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>Semester {num}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
                      <select value={editForm.status || "Active"} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#1e293b", fontSize: 13, outline: "none", fontWeight: 600 }}>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Graduated">Graduated / Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <textarea value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="Reason for this modification..." rows={3} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#1e293b", fontSize: 13, outline: "none", marginBottom: 24, resize: "none", fontWeight: 500 }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => {setEditData(null); setEditForm(null); setEditReason("");}} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Discard</button>
                <button onClick={handleEditSubmit} style={{ background: "#1e3a8a", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 800 }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {studentHistoryData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a", fontFamily: "'Syne', sans-serif" }}>👁️ Audit History: {studentHistoryData.name || studentHistoryData.title}</div>
                <button onClick={() => setStudentHistoryData(null)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, width: 38, height: 38, color: "#64748b", fontSize: 18, cursor: "pointer", fontWeight: 800 }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {auditLogs.filter(l => l.targetId === studentHistoryData.id).map((l, i) => (
                  <div key={i} style={{ padding: "18px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)", borderLeft: `5px solid ${l.action === "DELETE" ? "#ef4444" : l.action === "EDIT" ? "#f59e0b" : "#008751"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: l.action === "DELETE" ? "#dc2626" : l.action === "EDIT" ? "#d97706" : "#008751", textTransform: "uppercase", letterSpacing: 0.5 }}>{l.action}</span>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{new Date(l.timestamp).toLocaleString()} by {l.officer}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5, fontWeight: 500 }}>{l.reason}</div>
                  </div>
                ))}
                {auditLogs.filter(l => l.targetId === studentHistoryData.id).length === 0 && <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "40px 0", fontWeight: 500 }}>No recorded actions for this student.</div>}
              </div>
            </div>
          </div>
        )}

        {showAuditModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(30,58,138,0.2)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, maxWidth: 960, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a", fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>🕒 System Audit Trail</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button onClick={() => handleAuditExport('csv')} style={{ background: "rgba(0,135,81,0.08)", border: "1px solid rgba(0,135,81,0.2)", borderRadius: 8, padding: "8px 16px", color: "#008751", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📥 Export CSV</button>
                  <button onClick={() => handleAuditExport('pdf')} style={{ background: "rgba(30,58,138,0.08)", border: "1px solid rgba(30,58,138,0.2)", borderRadius: 8, padding: "8px 16px", color: "#1e3a8a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📄 Export PDF</button>
                  <button onClick={handleWipeAllData} style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "8px 16px", color: "#dc2626", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🚨 WIPE SYSTEM DATA</button>
                  <button onClick={() => setShowAuditModal(false)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 34, height: 34, color: "#64748b", fontSize: 18, cursor: "pointer", fontWeight: 700, marginLeft: 8 }}>×</button>
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>TIMESTAMP</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>ACTION</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>TARGET</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>REASON</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>OFFICER</th>
                    </tr>
                  </thead>
                  <tbody>
                  {auditLogs.slice(0, 50).map((l, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 16px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>{new Date(l.timestamp).toLocaleString()}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: l.action === "DELETE" ? "#dc2626" : l.action === "EDIT" ? "#d97706" : "#008751", background: l.action === "DELETE" ? "#fef2f2" : l.action === "EDIT" ? "#fefce8" : "#f0fdf4", padding: "4px 8px", borderRadius: 6, border: `1px solid ${l.action === "DELETE" ? "#fecaca" : l.action === "EDIT" ? "#fef08a" : "#d1fae5"}`, textTransform: "uppercase" }}>{l.action}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{l.targetName}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>{l.targetId}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", fontWeight: 500, maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.reason}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#1e3a8a", fontWeight: 700 }}>{l.officer}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No audit records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showBinModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 32, maxWidth: 900, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>🗑️ Recycle Bin</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button onClick={() => {setRecycleBin([]); setRefreshKey(prev=>prev+1);}} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 16px", color: "#dc2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Empty Bin</button>
                  <button onClick={() => setShowBinModal(false)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 34, height: 34, color: "#64748b", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>DELETED AT</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>NAME / ID</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>DELETED BY</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>REASON</th>
                      <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                  {recycleBin.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 16px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>{new Date(b._deletedAt).toLocaleString()}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{b.name || b.title}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>{b.id || b._id}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#1e3a8a", fontWeight: 700 }}>{b._officer}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", fontWeight: 500 }}>{b._reason}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setRestoreData(b)} style={{ fontSize: 10, padding: "6px 10px", background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 6, color: "#008751", cursor: "pointer", fontWeight: 800 }}>RESTORE</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recycleBin.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Recycle bin is empty.</td></tr>}
                  </tbody>
                </table>
                {recycleBin.length === 0 && <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "60px 0", fontWeight: 500 }}>Recycle bin is empty.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── ADD SHORT COURSE HUB MODAL ── */}
        {showAddCourseModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddCourseModal(false)}>
            <div style={{ width: 480, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Register New Short Course" subtitle="Manually add a professional training course" theme="light" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                {[["title", "Course Title"], ["duration", "Duration"], ["facilitatorName", "Facilitator Name"], ["startDate", "Start Date"]].map(([f, l]) => (
                  <div key={f}>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>{l}</label>
                    <input 
                      value={newCourseForm[f]} 
                      onChange={e => setNewCourseForm({ ...newCourseForm, [f]: e.target.value })}
                      type={f === "startDate" ? "date" : "text"}
                      placeholder={`Enter ${l.toLowerCase()}...`}
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Description</label>
                  <textarea 
                    value={newCourseForm.description}
                    onChange={e => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                    placeholder="Briefly describe the course objectives..."
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", height: 80, resize: "none", fontSize: 13, fontWeight: 500 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddCourseModal(false)} style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 0", color: "#64748b", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleAddCourse} style={{ flex: 1, background: "#1e3a8a", border: "none", borderRadius: 10, padding: "12px 0", color: "#fff", cursor: "pointer", fontWeight: 800 }}>Confirm Registration</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD ACADEMIC COURSE MODAL ── */}
        {showAddAcademicModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddAcademicModal(false)}>
            <div style={{ width: 500, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title={`Add ${newAcademicForm.cat} Course`} subtitle="Official academic module registration" theme="light" />
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Code</label>
                    <input value={newAcademicForm.code} onChange={e => setNewAcademicForm({...newAcademicForm, code: e.target.value})} placeholder="e.g. AI-801" style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Module Title</label>
                    <input value={newAcademicForm.title} onChange={e => setNewAcademicForm({...newAcademicForm, title: e.target.value})} placeholder="Full course name..." style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }} />
                  </div>
                </div>
                <div>
                   <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Programme</label>
                   <select value={newAcademicForm.prog} onChange={e => setNewAcademicForm({...newAcademicForm, prog: e.target.value})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }}>
                      {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div>
                   <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Semester</label>
                   <select value={newAcademicForm.sem} onChange={e => setNewAcademicForm({...newAcademicForm, sem: parseInt(e.target.value)})} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }}>
                      {[1, 2, 3].map(s => <option key={s} value={s}>Semester {s}</option>)}
                   </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddAcademicModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, color: "#64748b", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleAddAcademic} style={{ flex: 1, padding: "12px", background: "#1e3a8a", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800 }}>Add Module</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD PARTICIPANT MODAL ── */}
        {showAddParticipantModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddParticipantModal(false)}>
            <div style={{ width: 450, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Add Participant" subtitle={`Enrolling into: ${targetHub?.title || targetHub?.name}`} theme="light" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                {[["name", "Full Name"], ["email", "Email Address"], ["phone", "Phone Number"], ["organisation", "Organisation/Role"]].map(([f, l]) => (
                  <div key={f}>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{l}</label>
                    <input 
                      value={newParticipantForm[f]} 
                      onChange={e => setNewParticipantForm({...newParticipantForm, [f]: e.target.value})} 
                      placeholder={`Enter ${l.toLowerCase()}...`} 
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }} 
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddParticipantModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, color: "#64748b", fontWeight: 700 }}>Cancel</button>
                <button 
                  onClick={async () => {
                    const hub = targetHub;
                    const participant = { ...newParticipantForm, id: Date.now(), enrolled: true, status: 'Active' };
                    try {
                      if (hub.type === 'course') {
                        await api.patch(`/short-courses/${hub.id}/students`, { students: [participant] });
                      } else {
                        await api.patch(`/academic-events/${hub.id}/attendance`, { attendees: [participant] });
                      }
                      setShowAddParticipantModal(false);
                      setNewParticipantForm({ name: "", email: "", phone: "", organisation: "", role: "Participant", status: "Active" });
                      fetchData();
                    } catch (err) {
                      alert("Error adding participant: " + (err?.response?.data?.message || err.message));
                    }
                  }} 
                  style={{ flex: 1, padding: "12px", background: "#008751", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800 }}
                >
                  Confirm Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD FACILITATOR MODAL ── */}
        {showAddFacilitatorModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddFacilitatorModal(false)}>
            <div style={{ width: 550, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Register New Facilitator" subtitle="Add academic staff member to the institution" theme="light" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                {[["name", "Full Name"], ["email", "Email Address"], ["phone", "Phone Number"], ["dept", "Department"], ["expertise", "Expertise"], ["courseCode", "Course Code"], ["courseTitle", "Course Title"]].map(([f, l]) => (
                  <div key={f} style={{ gridColumn: f === "courseTitle" ? "span 2" : "auto" }}>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{l}</label>
                    <input 
                      value={newFacilitatorForm[f]} 
                      onChange={e => setNewFacilitatorForm({...newFacilitatorForm, [f]: e.target.value})} 
                      placeholder={`Enter ${l.toLowerCase()}...`} 
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }} 
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddFacilitatorModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, color: "#64748b", fontWeight: 700 }}>Cancel</button>
                <button 
                  onClick={handleAddFacilitator} 
                  style={{ flex: 1, padding: "12px", background: "#008751", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800 }}
                >
                  Register Facilitator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD EVENT MODAL ── */}
        {showAddEventModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddEventModal(false)}>
            <div style={{ width: 480, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Schedule Academic Event" subtitle="Add Workshop or Conference details" theme="light" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Event Type</label>
                  <select 
                    value={newEventForm.type}
                    onChange={e => setNewEventForm({ ...newEventForm, type: e.target.value })}
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>
                {["name", "date", "location", "speaker"].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>{f === "name" ? "Title/Topic" : f.charAt(0).toUpperCase() + f.slice(1)}</label>
                    <input 
                      value={newEventForm[f]} 
                      onChange={e => setNewEventForm({ ...newEventForm, [f]: e.target.value })}
                      type={f === "date" ? "date" : "text"}
                      placeholder={`Enter event ${f}...`}
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Description</label>
                  <textarea 
                    value={newEventForm.description}
                    onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                    placeholder="Outline event agenda or scope..."
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", height: 80, resize: "none", fontSize: 13, fontWeight: 500 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddEventModal(false)} style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 0", color: "#64748b", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleAddEvent} style={{ flex: 1, background: "#1e3a8a", border: "none", borderRadius: 10, padding: "12px 0", color: "#fff", cursor: "pointer", fontWeight: 800 }}>Post Event</button>
              </div>
            </div>
          </div>
        )}

        {showAddStudentModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddStudentModal(false)}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 36, maxWidth: 600, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Register New Student" subtitle="Add high-fidelity record manually to institutional database" theme="light" />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Surname</label>
                    <input 
                      value={newStudentForm.surname}
                      onChange={e => setNewStudentForm({ ...newStudentForm, surname: e.target.value })}
                      placeholder="e.g. ADEOYE"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Other Names</label>
                    <input 
                      value={newStudentForm.otherNames}
                      onChange={e => setNewStudentForm({ ...newStudentForm, otherNames: e.target.value })}
                      placeholder="e.g. John Oluwaseun"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Matric Number</label>
                    <input 
                      value={newStudentForm.matric}
                      onChange={e => setNewStudentForm({ ...newStudentForm, matric: e.target.value })}
                      placeholder="ACE/2026/1024"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Study Level</label>
                    <select 
                      value={newStudentForm.level}
                      onChange={e => setNewStudentForm({ ...newStudentForm, level: parseInt(e.target.value) })}
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    >
                      {[100, 200, 300, 400, 500, 800, 900].map(lv => <option key={lv} value={lv}>{lv} Level</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Study Programme</label>
                  <select 
                    value={newStudentForm.prog}
                    onChange={e => setNewStudentForm({ ...newStudentForm, prog: e.target.value })}
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                  >
                    {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Cohort</label>
                  <input 
                    value={newStudentForm.cohort}
                    onChange={e => setNewStudentForm({ ...newStudentForm, cohort: e.target.value })}
                    placeholder="e.g. 2026/2027"
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Personal Email</label>
                    <input 
                      value={newStudentForm.email}
                      onChange={e => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                      placeholder="user@example.com"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Institutional Email</label>
                    <input 
                      value={newStudentForm.instEmail}
                      onChange={e => setNewStudentForm({ ...newStudentForm, instEmail: e.target.value })}
                      placeholder="user@acetel.edu.ng"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Nationality</label>
                    <input 
                      value={newStudentForm.nationality}
                      onChange={e => setNewStudentForm({ ...newStudentForm, nationality: e.target.value })}
                      placeholder="Nigeria"
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: 0.5 }}>Gender</label>
                    <select 
                      value={newStudentForm.gender}
                      onChange={e => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddStudentModal(false)} style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 0", color: "#64748b", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleAddStudent} style={{ flex: 1, background: "#008751", border: "none", borderRadius: 10, padding: "12px 0", color: "#fff", cursor: "pointer", fontWeight: 800 }}>Complete Registration</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD ADMITTED STUDENT MODAL ─────────────────────────────────── */}
        {showAddAdmittedModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddAdmittedModal(false)}>
            <div style={{ background: "#fff", border: "1px solid #E5E0D5", borderRadius: 20, padding: 36, maxWidth: 600, width: "100%", boxShadow: "0 25px 50px -12px rgba(11,61,46,0.25)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ borderBottom: "2px solid #C9A227", paddingBottom: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Admission Pool</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0B3D2E", fontFamily: "'Playfair Display', serif", margin: 0 }}>Add Admitted Student</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Manually add a confirmed admitted candidate to the pool</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Surname *</label>
                    <input value={newAdmittedForm.surname} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, surname: e.target.value })} placeholder="e.g. ADEOYE" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Other Names</label>
                    <input value={newAdmittedForm.otherNames} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, otherNames: e.target.value })} placeholder="e.g. John Oluwaseun" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Matric Number *</label>
                    <input value={newAdmittedForm.matricNo} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, matricNo: e.target.value })} placeholder="ACE/2026/1024" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Gender</label>
                    <select value={newAdmittedForm.gender} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, gender: e.target.value })} style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Programme of Study</label>
                  <select value={newAdmittedForm.prog} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, prog: e.target.value })} style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }}>
                    {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Personal Email</label>
                    <input value={newAdmittedForm.email} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, email: e.target.value })} placeholder="user@example.com" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Institutional Email</label>
                    <input value={newAdmittedForm.instEmail} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, instEmail: e.target.value })} placeholder="user@acetel.edu.ng" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Phone Number</label>
                    <input value={newAdmittedForm.phone} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, phone: e.target.value })} placeholder="+234 800 000 0000" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0B3D2E", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>Nationality</label>
                    <input value={newAdmittedForm.nationality} onChange={e => setNewAdmittedForm({ ...newAdmittedForm, nationality: e.target.value })} placeholder="Nigeria" style={{ width: "100%", background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "12px 14px", color: "#111827", outline: "none", fontSize: 13, fontWeight: 500 }} onFocus={e => e.target.style.borderColor="#0B3D2E"} onBlur={e => e.target.style.borderColor="#E5E0D5"} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                <button onClick={() => setShowAddAdmittedModal(false)} style={{ flex: 1, background: "#F4F6F3", border: "1px solid #E5E0D5", borderRadius: 10, padding: "13px 0", color: "#6B7280", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                <button onClick={handleAddAdmitted} style={{ flex: 1, background: "#0B3D2E", border: "none", borderRadius: 10, padding: "13px 0", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  ✓ Add to Admission Pool
                </button>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowExportModal(false)}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 36, maxWidth: 520, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Customize Export Report" subtitle={`Generating ${exportConfig.target.toUpperCase()} as ${exportConfig.format.toUpperCase()}`} theme="light" />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
                 <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", letterSpacing: 0.5 }}>Select Report Content</label>
                  <select 
                    value={exportConfig.target} 
                    onChange={e => setExportConfig({ ...exportConfig, target: e.target.value })}
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 700, marginBottom: 20 }}
                  >
                    <option value="registry">Registered Students List</option>
                    <option value="admissions">Admitted Students Records</option>
                    <option value="alumni">Alumni</option>
                    <option value="courses">Core course</option>
                    <option value="electives">Elective courses</option>
                    <option value="general">General courses</option>
                    <option value="facilitators">Academic Facilitators List</option>
                    <option value="short-courses">Short Courses Registry</option>
                    <option value="ecosystem">Workshops and Conferences</option>
                  </select>

                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", letterSpacing: 0.5 }}>Output Format</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["pdf", "csv"].map(f => (
                      <button 
                        key={f}
                        onClick={() => setExportConfig({ ...exportConfig, format: f })}
                        style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 800, textTransform: "uppercase", transition: "all 0.2s",
                          background: exportConfig.format === f ? (f === 'pdf' ? "#1e3a8a" : "#008751") : "#f8fafc",
                          borderColor: exportConfig.format === f ? "transparent" : "#e2e8f0",
                          color: exportConfig.format === f ? "#fff" : "#64748b"
                        }}
                      >
                        {f} Document
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block", letterSpacing: 0.5 }}>Study Programme</label>
                    <select value={exportConfig.prog} onChange={e => setExportConfig({ ...exportConfig, prog: e.target.value })} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}>
                      <option value="All Programmes">All Programmes</option>
                      {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block", letterSpacing: 0.5 }}>Academic Intake</label>
                    <select value={exportConfig.session} onChange={e => setExportConfig({ ...exportConfig, session: e.target.value })} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}>
                      <option value="All Sessions">All Intakes</option>
                      {ACETEL_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block", letterSpacing: 0.5 }}>Semester Level</label>
                  <select value={exportConfig.semester} onChange={e => setExportConfig({ ...exportConfig, semester: e.target.value })} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", color: "#0f172a", outline: "none", fontSize: 13, fontWeight: 500 }}>
                    <option value="All Semesters">All Semesters</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                <button onClick={() => setShowExportModal(false)} style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 0", color: "#64748b", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                <button onClick={handleGranularExport} style={{ flex: 2, background: "#1e3a8a", border: "none", borderRadius: 12, padding: "14px 0", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Generate Official Report</button>
              </div>
            </div>
          </div>
        )}
        {/* ── ADD COORDINATOR MODAL ── */}
        {showAddCoordinatorModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddCoordinatorModal(false)}>
            <div style={{ width: 450, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <SectionHeader title="Appoint Programme Coordinator" subtitle="Assign academic leadership for a programme" theme="light" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                {[["name", "Full Name"], ["email", "Email Address"], ["phone", "Phone Number"], ["programme", "Target Programme"], ["date", "Appointment Date"]].map(([f, l]) => (
                  <div key={f}>
                    <label style={{ fontSize: 11, color: "#0f172a", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{l}</label>
                    <input 
                      type={f === "date" ? "date" : "text"}
                      value={newCoordinatorForm[f]} 
                      onChange={e => setNewCoordinatorForm({...newCoordinatorForm, [f]: e.target.value})} 
                      placeholder={`Enter ${l.toLowerCase()}...`} 
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }} 
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setShowAddCoordinatorModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, color: "#64748b", fontWeight: 700 }}>Cancel</button>
                <button 
                  onClick={() => {
                    alert(`Coordinator ${newCoordinatorForm.name} appointed for ${newCoordinatorForm.programme}`);
                    setShowAddCoordinatorModal(false);
                    setNewCoordinatorForm({ name: "", email: "", phone: "", programme: "", date: "" });
                  }} 
                  style={{ flex: 1, padding: "12px", background: "#3b82f6", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800 }}
                >
                  Confirm Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }



