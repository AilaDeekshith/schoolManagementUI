// access.js — client-side module access helpers (RBAC)
// Permissions come from the login response and are cached on authUser in
// localStorage as: permissions: [{ module, canRead, canWrite }]

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Maps an API path (without the /api prefix) to a module id.
// Order matters — more specific prefixes first.
const PATH_MODULE = [
  ["/students", "students"],
  ["/teachers", "teachers"],
  ["/admissions", "admissions"],
  ["/attendance", "classes"],
  ["/timetable", "classes"],
  ["/classes", "classes"],
  ["/fees", "fees"],
  ["/exam-seating", "exams"],
  ["/exam-schedule", "exams"],
  ["/exam-results", "exams"],
  ["/exams", "exams"],
  ["/syllabi", "syllabus"],
  ["/syllabus", "syllabus"],
  ["/notices", "dashboard"],
  ["/student-users", "configuration"],
  ["/users", "configuration"],
  ["/config", "configuration"],
];

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser")) || {};
  } catch {
    return {};
  }
}

export function isAdmin(user = currentUser()) {
  return ADMIN_ROLES.includes(user?.role);
}

export function moduleForPath(path = "") {
  const p = path.split("?")[0];
  for (const [prefix, mod] of PATH_MODULE) {
    if (p === prefix || p.startsWith(prefix + "/")) return mod;
  }
  return null;
}

export function canRead(module, user = currentUser()) {
  if (isAdmin(user)) return true;
  if (module === "dashboard") return true; // landing page is always visible
  const p = (user?.permissions || []).find((x) => x.module === module);
  return !!(p && p.canRead);
}

export function canWrite(module, user = currentUser()) {
  if (isAdmin(user)) return true;
  const p = (user?.permissions || []).find((x) => x.module === module);
  return !!(p && p.canWrite);
}

// Filter a list of module ids down to those the current user may view.
export function filterAllowed(moduleIds, user = currentUser()) {
  if (isAdmin(user)) return moduleIds;
  return moduleIds.filter((id) => canRead(id, user));
}
