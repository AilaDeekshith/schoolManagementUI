export const students = [
  { id: "S001", name: "Ananya Reddy",  class: "10-A", roll: 1,  gender: "Female", dob: "2009-03-14", guardian: "Ravi Reddy",    contact: "9876543210", status: "Active",   fees: "Paid"    },
  { id: "S002", name: "Rohan Sharma",  class: "9-B",  roll: 5,  gender: "Male",   dob: "2010-07-22", guardian: "Suresh Sharma", contact: "9123456780", status: "Active",   fees: "Pending" },
  { id: "S003", name: "Priya Nair",    class: "8-A",  roll: 3,  gender: "Female", dob: "2011-01-09", guardian: "Latha Nair",    contact: "9988776655", status: "Active",   fees: "Paid"    },
  { id: "S004", name: "Kiran Kumar",   class: "10-B", roll: 12, gender: "Male",   dob: "2009-11-30", guardian: "Vijay Kumar",   contact: "9876001234", status: "Inactive", fees: "Overdue" },
  { id: "S005", name: "Sneha Patel",   class: "7-C",  roll: 8,  gender: "Female", dob: "2012-05-17", guardian: "Meena Patel",   contact: "9001234567", status: "Active",   fees: "Paid"    },
];

export const teachers = [
  { id: "T001", name: "Dr. Rekha Iyer",  subject: "Mathematics", classes: "10-A, 9-B",  exp: "12 yrs", contact: "9812345670", email: "rekha@school.in", status: "Active"   },
  { id: "T002", name: "Mr. Arun Menon",  subject: "Physics",     classes: "10-A, 10-B", exp: "8 yrs",  contact: "9723456781", email: "arun@school.in",  status: "Active"   },
  { id: "T003", name: "Ms. Deepa Rao",   subject: "English",     classes: "8-A, 7-C",   exp: "6 yrs",  contact: "9634567892", email: "deepa@school.in", status: "Active"   },
  { id: "T004", name: "Mr. Sunil Tiwari",subject: "History",     classes: "9-B, 8-A",   exp: "15 yrs", contact: "9545678903", email: "sunil@school.in", status: "On Leave" },
];

export const admissions = [
  { id: "A2024001", name: "Arjun Verma", applyClass: "6-A",  date: "2024-03-10", status: "Approved",     guardian: "Anil Verma",   contact: "9911223344" },
  { id: "A2024002", name: "Divya Singh", applyClass: "9-A",  date: "2024-03-15", status: "Pending",       guardian: "Sanjay Singh", contact: "9822334455" },
  { id: "A2024003", name: "Rahul Das",   applyClass: "7-B",  date: "2024-03-18", status: "Under Review",  guardian: "Mohan Das",    contact: "9733445566" },
  { id: "A2024004", name: "Kavya Nair",  applyClass: "10-A", date: "2024-03-20", status: "Rejected",      guardian: "Suresh Nair",  contact: "9644556677" },
];

export const timetableData = {
  Monday:    ["Mathematics", "Physics",     "English",     "History",     "—BREAK—", "Chemistry",   "P.E.",      "Computer"],
  Tuesday:   ["English",     "Chemistry",   "Mathematics", "P.E.",        "—BREAK—", "Physics",     "History",   "Art"     ],
  Wednesday: ["Physics",     "History",     "Chemistry",   "Mathematics", "—BREAK—", "English",     "Computer",  "P.E."    ],
  Thursday:  ["Chemistry",   "Mathematics", "P.E.",        "English",     "—BREAK—", "History",     "Art",       "Physics" ],
  Friday:    ["History",     "English",     "Physics",     "Chemistry",   "—BREAK—", "Mathematics", "P.E.",      "Computer"],
};

export const timePeriods = [
  "8:00–8:45", "8:45–9:30", "9:30–10:15", "10:15–11:00",
  "11:00–11:30", "11:30–12:15", "12:15–1:00", "1:00–1:45",
];

export const classList = [
  { name: "10-A", strength: 42, classTeacher: "Dr. Rekha Iyer",   room: "201", monitor: "Ananya Reddy" },
  { name: "10-B", strength: 40, classTeacher: "Mr. Arun Menon",   room: "202", monitor: "Kiran Kumar"  },
  { name: "9-B",  strength: 45, classTeacher: "Mr. Sunil Tiwari", room: "105", monitor: "Rohan Sharma" },
  { name: "8-A",  strength: 38, classTeacher: "Ms. Deepa Rao",    room: "103", monitor: "Priya Nair"   },
  { name: "7-C",  strength: 36, classTeacher: "Ms. Deepa Rao",    room: "101", monitor: "Sneha Patel"  },
];

export const fees = [
  { id: "S001", name: "Ananya Reddy", class: "10-A", total: 45000, paid: 45000, due: 0,     status: "Paid"    },
  { id: "S002", name: "Rohan Sharma", class: "9-B",  total: 42000, paid: 21000, due: 21000, status: "Pending" },
  { id: "S003", name: "Priya Nair",   class: "8-A",  total: 40000, paid: 40000, due: 0,     status: "Paid"    },
  { id: "S004", name: "Kiran Kumar",  class: "10-B", total: 45000, paid: 0,     due: 45000, status: "Overdue" },
  { id: "S005", name: "Sneha Patel",  class: "7-C",  total: 38000, paid: 38000, due: 0,     status: "Paid"    },
];

export const exams = [
  { id: "E001", name: "Unit Test 1",   class: "All", date: "2024-04-10", subject: "Mathematics",  maxMarks: 50,  status: "Completed" },
  { id: "E002", name: "Mid Term Exam", class: "All", date: "2024-05-15", subject: "All Subjects", maxMarks: 100, status: "Upcoming"  },
  { id: "E003", name: "Unit Test 2",   class: "All", date: "2024-06-12", subject: "Physics",      maxMarks: 50,  status: "Scheduled" },
  { id: "E004", name: "Final Exam",    class: "All", date: "2024-11-20", subject: "All Subjects", maxMarks: 100, status: "Scheduled" },
];

// Sub-sections shown under the Configuration module in the sidebar.
export const CONFIG_SECTIONS = [
  { id: "profile",      label: "School Profile",    icon: "🏫" },
  { id: "grades",       label: "Grades & Sections", icon: "📚" },
  { id: "subjects",     label: "Subjects",          icon: "📖" },
  { id: "academicYears", label: "Academic Years",   icon: "📆" },
  { id: "feeStructure", label: "Fee Structure",     icon: "💰" },
  { id: "templates",    label: "Templates",   icon: "🧾" },
  { id: "calendar",     label: "Academic Calendar", icon: "📅" },
  { id: "users",        label: "Users",             icon: "👤" },
];

// Sub-sections shown under the Exams module in the sidebar.
export const EXAM_SECTIONS = [
  { id: "exams",         label: "Exams",                icon: "📝" },
  { id: "examTimetable", label: "Exam Timetable",       icon: "🗓" },
  { id: "examMarks",     label: "Enter Marks",          icon: "✍️" },
  { id: "examSeating",   label: "Seating Arrangement",  icon: "🪑" },
];

// Sub-sections shown under the Classes module in the sidebar.
export const CLASS_SECTIONS = [
  { id: "classes",    label: "Class Rooms",    icon: "🏫" },
  { id: "timetable",  label: "Timetable",  icon: "🗓" },
  { id: "attendance", label: "Attendance", icon: "✅" },
];

// Sub-sections shown under the Syllabus module in the sidebar.
export const SYLLABUS_SECTIONS = [
  { id: "dashboard", label: "Dashboard",        icon: "📊" },
  { id: "manage",    label: "Manage Syllabus",  icon: "📚" },
];

// Sub-sections shown under the Fees module in the sidebar.
export const FEES_SECTIONS = [
  { id: "dashboard", label: "Dashboard",   icon: "📊" },
  { id: "list",      label: "Fee Records", icon: "💳" },
];

export const MODULES = [
  { id: "dashboard",     label: "Dashboard",     icon: "⊞" },
  { id: "students",      label: "Students",      icon: "🎓" },
  { id: "teachers",      label: "Teachers",      icon: "👩‍🏫" },
  { id: "admissions",    label: "Admissions",    icon: "📋" },
  { id: "classes",       label: "Classes",       icon: "🏫" },
  { id: "fees",          label: "Fees",          icon: "💳" },
  { id: "exams",         label: "Exams",         icon: "📝" },
  { id: "syllabus",      label: "Syllabus",      icon: "📚" },
  { id: "configuration", label: "Configuration", icon: "⚙️" },
];

