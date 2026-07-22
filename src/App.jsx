// App.jsx  –  root component that wires everything together
import { useState, useEffect } from "react";
import { theme } from "./theme";
import { configAPI } from "./api/apiService";

// Layout components
import Sidebar from "./components/Sidebar";
import TopBar  from "./components/TopBar";

// Page components
import Dashboard     from "./pages/Dashboard";
import Students      from "./pages/Students";
import Teachers      from "./pages/Teachers";
import Admissions    from "./pages/Admissions";
import Timetable     from "./pages/Timetable";
import Classes       from "./pages/Classes";
import ClassroomLayout from "./pages/ClassroomLayout";
import Fees          from "./pages/Fees";
import Exams         from "./pages/Exams";
import ExamSeating   from "./pages/ExamSeating";
import Configuration from "./pages/Configuration";
import Syllabus      from "./pages/Syllabus";
import Attendance    from "./pages/Attendance";
import Login         from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import StudentProfile from "./pages/StudentProfile";

const PAGES = {
  dashboard:     Dashboard,
  students:      Students,
  teachers:      Teachers,
  admissions:    Admissions,
  timetable:     Timetable,
  fees:          Fees,
  exams:         Exams,
  examSeating:   ExamSeating,
  attendance:    Attendance,
  syllabus:      Syllabus,
  configuration: Configuration,
};

function loadStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const raw   = localStorage.getItem("authUser");
    if (token && raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function App() {
  const [authUser, setAuthUser] = useState(loadStoredAuth);
  const [needsPwChange, setNeedsPwChange] = useState(false);

  const [active, setActive]             = useState("dashboard");
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
    setActive(page);
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  const renderPage = () => {
    if (active === "classes") {
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
    if (active === "configuration") return <Configuration onProfileSaved={handleProfileSaved} />;
    const Page = PAGES[active];
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
      <TopBar active={active} user={authUser} onLogout={handleLogout} schoolProfile={schoolProfile} />

      {/* ── Body: sidebar + page ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar
          active={active}
          setActive={handleSetActive}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Page content — no padding when showing classroom layout */}
        {active === "classes" && selectedClass && !selectedStudent ? (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {renderPage()}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
            {renderPage()}
          </div>
        )}
      </div>
    </div>
  );
}
