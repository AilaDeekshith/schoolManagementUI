// App.jsx  –  root component that wires everything together
import { useState, useEffect, useMemo } from "react";
import { theme } from "./theme";
import { configAPI } from "./api/apiService";
import { filterAllowed } from "./access";
import { MODULES } from "./data/mockData";

// Layout components
import Sidebar from "./components/Sidebar";
import TopBar  from "./components/TopBar";
import Toaster from "./components/Toaster";

// Page components
import Dashboard     from "./pages/Dashboard";
import Students      from "./pages/Students";
import Teachers      from "./pages/Teachers";
import Admissions    from "./pages/Admissions";
import Timetable     from "./pages/Timetable";
import Classes       from "./pages/Classes";
import ClassroomLayout from "./pages/ClassroomLayout";
import Fees          from "./pages/Fees";
import FeesDashboard  from "./pages/FeesDashboard";
import Exams         from "./pages/Exams";
import ExamSeating   from "./pages/ExamSeating";
import ExamTimetable from "./pages/ExamTimetable";
import ExamMarksSection from "./pages/ExamMarksSection";
import Configuration from "./pages/Configuration";
import Syllabus      from "./pages/Syllabus";
import SyllabusDashboard from "./pages/SyllabusDashboard";
import Attendance    from "./pages/Attendance";
import Login         from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import StudentProfile from "./pages/StudentProfile";

const PAGES = {
  dashboard:     Dashboard,
  students:      Students,
  teachers:      Teachers,
  admissions:    Admissions,
  fees:          Fees,
  exams:         Exams,
  syllabus:      Syllabus,
  configuration: Configuration,
};

// Returns false for a missing/malformed/expired JWT.
function isJwtValid(token) {
  try {
    const claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !claims.exp || claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function loadStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const raw   = localStorage.getItem("authUser");
    if (token && raw && isJwtValid(token)) return JSON.parse(raw);
  } catch {}
  // Stale / expired session — clear it so the login page is shown, not the dashboard.
  localStorage.removeItem("token");
  localStorage.removeItem("authUser");
  return null;
}

export default function App() {
  const [authUser, setAuthUser] = useState(loadStoredAuth);
  const [needsPwChange, setNeedsPwChange] = useState(false);

  const [active, setActive]             = useState("dashboard");
  // Active sub-section per grouped module (Configuration, Exams).
  const [subSections, setSubSections]   = useState({ configuration: "profile", exams: "exams", classes: "classes", syllabus: "dashboard", fees: "list" });
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [selectedClass, setSelectedClass] = useState(null); // { id, name }
  const [selectedStudent, setSelectedStudent] = useState(null); // student profile row
  const [schoolProfile, setSchoolProfile] = useState(null);

  // Listen for session-expiry events dispatched by apiService
  useEffect(() => {
    const handler = () => { setAuthUser(null); setNeedsPwChange(false); };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // Fetch school profile once logged in; also cache branding for the Login page
  useEffect(() => {
    if (!authUser) return;
    configAPI.getProfile().then(p => {
      if (p) {
        setSchoolProfile(p);
        // Cache minimal branding so Login page can show it before auth
        localStorage.setItem("schoolBranding", JSON.stringify({
          schoolName:    p.schoolName    || "",
          logoBase64:    p.logoBase64    || "",
        }));
      }
    }).catch(() => {});
  }, [authUser]);

  // Allow Configuration page to propagate profile changes back up
  const handleProfileSaved = (updated) => {
    setSchoolProfile(updated);
    if (updated) {
      localStorage.setItem("schoolBranding", JSON.stringify({
        schoolName:    updated.schoolName    || "",
        logoBase64:    updated.logoBase64    || "",
      }));
    }
  };

  const allowedIds = useMemo(
    () => filterAllowed(MODULES.map((m) => m.id), authUser),
    [authUser],
  );

  const handleLogin = (data) => {
    setAuthUser(data);
    if (!data.passwordChanged) setNeedsPwChange(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    setAuthUser(null);
    setNeedsPwChange(false);
  };

  if (!authUser) return <Login onLogin={handleLogin} />;
  if (needsPwChange) return <ChangePassword user={authUser} onDone={() => setNeedsPwChange(false)} />;

  const handleSetActive = (page) => {
    if (!allowedIds.includes(page)) return; // block modules the user can't access
    setActive(page);
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  // If the active module isn't permitted (e.g. after a permission change), fall back.
  const safeActive = allowedIds.includes(active) ? active : "dashboard";

  const renderPage = () => {
    if (safeActive === "classes") {
      if (subSections.classes === "timetable")  return <Timetable />;
      if (subSections.classes === "attendance") return <Attendance />;
      if (selectedStudent) {
        return (
          <StudentProfile
            student={selectedStudent}
            onBack={() => setSelectedStudent(null)}
            backLabel="Back to Classroom"
          />
        );
      }
      if (selectedClass) {
        return (
          <ClassroomLayout
            classId={selectedClass.id}
            className={selectedClass.name}
            onBack={() => setSelectedClass(null)}
            onStudentClick={(student) => setSelectedStudent(student)}
          />
        );
      }
      return <Classes onSelectClass={(cls) => setSelectedClass({ id: cls.id, name: cls.name })} />;
    }
    if (safeActive === "configuration") return <Configuration section={subSections.configuration} onProfileSaved={handleProfileSaved} />;
    if (safeActive === "exams") {
      const sub = subSections.exams;
      if (sub === "examTimetable") return <ExamTimetable />;
      if (sub === "examMarks")     return <ExamMarksSection />;
      if (sub === "examSeating")   return <ExamSeating />;
      return <Exams onNavigate={handleSetActive} />;
    }
    if (safeActive === "syllabus") {
      return subSections.syllabus === "manage" ? <Syllabus /> : <SyllabusDashboard />;
    }
    if (safeActive === "fees") {
      return subSections.fees === "dashboard" ? <FeesDashboard /> : <Fees />;
    }
    const Page = PAGES[safeActive];
    return <Page onNavigate={handleSetActive} />;
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
    }}>
      {/* ── TopBar — full width ── */}
      <TopBar active={safeActive} user={authUser} onLogout={handleLogout} schoolProfile={schoolProfile} />

      {/* ── Body: sidebar + page ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar
          active={safeActive}
          setActive={handleSetActive}
          allowedIds={allowedIds}
          subSections={subSections}
          onSubSection={(moduleId, subId) => { setSubSections((prev) => ({ ...prev, [moduleId]: subId })); handleSetActive(moduleId); }}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Page content — no padding when showing classroom layout */}
        {safeActive === "classes" && selectedClass && !selectedStudent ? (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {renderPage()}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 28px 28px" }}>
            {renderPage()}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}
