// App.jsx  –  root component that wires everything together
import { useState, useEffect } from "react";
import { theme } from "./theme";

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
import Configuration from "./pages/Configuration";
import Attendance    from "./pages/Attendance";
import Login         from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

const PAGES = {
  dashboard:     Dashboard,
  students:      Students,
  teachers:      Teachers,
  admissions:    Admissions,
  timetable:     Timetable,
  fees:          Fees,
  exams:         Exams,
  attendance:    Attendance,
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

  // Listen for session-expiry events dispatched by apiService
  useEffect(() => {
    const handler = () => { setAuthUser(null); setNeedsPwChange(false); };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

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
  };

  const renderPage = () => {
    if (active === "classes") {
      if (selectedClass) {
        return (
          <ClassroomLayout
            classId={selectedClass.id}
            className={selectedClass.name}
            onBack={() => setSelectedClass(null)}
          />
        );
      }
      return <Classes onSelectClass={(cls) => setSelectedClass({ id: cls.id, name: cls.name })} />;
    }
    const Page = PAGES[active];
    return <Page />;
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
    }}>
      {/* ── Sidebar ── */}
      <Sidebar
        active={active}
        setActive={handleSetActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar active={active} user={authUser} onLogout={handleLogout} />

        {/* Page content — no padding when showing classroom layout */}
        {active === "classes" && selectedClass ? (
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
