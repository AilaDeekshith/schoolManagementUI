// App.jsx  –  root component that wires everything together
import { useState } from "react";
import { theme } from "./theme";

// Layout components
import Sidebar from "./components/Sidebar";
import TopBar  from "./components/TopBar";

// Page components
import Dashboard from "./pages/Dashboard";
import Students  from "./pages/Students";
import Teachers  from "./pages/Teachers";
import Admissions from "./pages/Admissions";
import Timetable from "./pages/Timetable";
import Classes   from "./pages/Classes";
import Fees      from "./pages/Fees";
import Exams     from "./pages/Exams";

const PAGES = {
  dashboard:  Dashboard,
  students:   Students,
  teachers:   Teachers,
  admissions: Admissions,
  timetable:  Timetable,
  classes:    Classes,
  fees:       Fees,
  exams:      Exams,
};

export default function App() {
  const [active, setActive]     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const Page = PAGES[active];

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
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar active={active} />

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <Page />
        </div>
      </div>
    </div>
  );
}