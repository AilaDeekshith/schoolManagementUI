// src/api/apiService.js
const BASE_URL = "http://localhost:8080/api";

async function request(method, path, body = null) {
  const token = localStorage.getItem("token");
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const authAPI = {
  login:          (data) => request("POST", "/auth/login", data),
  changePassword: (data) => request("POST", "/auth/change-password", data),
};

export const studentAPI = {
  getAll:         ()           => request("GET",    "/students"),
  getById:        (id)         => request("GET",    `/students/${id}`),
  create:         (data)       => request("POST",   "/students", data),
  update:         (id, data)   => request("PUT",    `/students/${id}`, data),
  delete:         (id)         => request("DELETE", `/students/${id}`),
  getByClass:     (cls)        => request("GET",    `/students/class/${cls}`),
  getByStatus:    (s)          => request("GET",    `/students/status/${s}`),
  getByFeeStatus: (s)          => request("GET",    `/students/fee-status/${s}`),
  search:         (name)       => request("GET",    `/students/search?name=${encodeURIComponent(name)}`),
  countActive:    ()           => request("GET",    "/students/count/active"),
};

export const teacherAPI = {
  getAll:       ()           => request("GET",    "/teachers"),
  getById:      (id)         => request("GET",    `/teachers/${id}`),
  create:       (data)       => request("POST",   "/teachers", data),
  update:       (id, data)   => request("PUT",    `/teachers/${id}`, data),
  delete:       (id)         => request("DELETE", `/teachers/${id}`),
  getBySubject: (s)          => request("GET",    `/teachers/subject/${s}`),
  getByStatus:  (s)          => request("GET",    `/teachers/status/${s}`),
  getByClass:   (cls)        => request("GET",    `/teachers/class/${cls}`),
  search:       (name)       => request("GET",    `/teachers/search?name=${encodeURIComponent(name)}`),
};

export const admissionAPI = {
  getAll:       ()           => request("GET",    "/admissions"),
  getById:      (id)         => request("GET",    `/admissions/${id}`),
  create:       (data)       => request("POST",   "/admissions", data),
  update:       (id, data)   => request("PUT",    `/admissions/${id}`, data),
  delete:       (id)         => request("DELETE", `/admissions/${id}`),
  approve:      (id)         => request("PATCH",  `/admissions/${id}/approve`),
  reject:       (id)         => request("PATCH",  `/admissions/${id}/reject`),
  getByStatus:  (s)          => request("GET",    `/admissions/status/${s}`),
  getByClass:   (cls)        => request("GET",    `/admissions/class/${cls}`),
  search:       (name)       => request("GET",    `/admissions/search?name=${encodeURIComponent(name)}`),
  countPending: ()           => request("GET",    "/admissions/count/pending"),
};

export const classAPI = {
  getAll:        ()             => request("GET",    "/classes"),
  getById:       (id)           => request("GET",    `/classes/${id}`),
  getByName:     (name)         => request("GET",    `/classes/name/${name}`),
  create:        (data)         => request("POST",   "/classes", data),
  update:        (id, data)     => request("PUT",    `/classes/${id}`, data),
  delete:        (id)           => request("DELETE", `/classes/${id}`),
  assignTeacher: (cid, tid)     => request("PATCH",  `/classes/${cid}/assign-teacher/${tid}`),
  getAvailable:  ()             => request("GET",    "/classes/available"),
};

// Timetable slot assignments (subject + teacher per day/period)
export const timetableAPI = {
  getAll:           ()         => request("GET",    "/timetable"),
  getById:          (id)       => request("GET",    `/timetable/${id}`),
  create:           (data)     => request("POST",   "/timetable", data),
  update:           (id, data) => request("PUT",    `/timetable/${id}`, data),
  delete:           (id)       => request("DELETE", `/timetable/${id}`),
  getByClass:       (cls)      => request("GET",    `/timetable/class/${cls}`),
  getByClassAndDay: (cls, day) => request("GET",    `/timetable/class/${cls}/day/${day}`),
  getByTeacher:     (tid)      => request("GET",    `/timetable/teacher/${tid}`),
  getTeacherDay:    (tid, day) => request("GET",    `/timetable/teacher/${tid}/day/${day}`),
};

// Timetable period structure (periods, timings, breaks) — NEW
export const periodAPI = {
  getByClass:   (cls)          => request("GET",    `/timetable/periods/${cls}`),
  saveForClass: (cls, periods) => request("POST",   `/timetable/periods/${cls}`, periods),
  update:       (id, data)     => request("PUT",    `/timetable/periods/entry/${id}`, data),
  deleteAll:    (cls)          => request("DELETE", `/timetable/periods/${cls}`),
};

export const feesAPI = {
  getAll:         ()                          => request("GET",    "/fees"),
  getById:        (id)                        => request("GET",    `/fees/${id}`),
  create:         (data)                      => request("POST",   "/fees", data),
  update:         (id, data)                  => request("PUT",    `/fees/${id}`, data),
  delete:         (id)                        => request("DELETE", `/fees/${id}`),
  collectPayment: (id, amount, method, txnId) => request("POST",
    `/fees/${id}/collect?amount=${amount}&method=${method}${txnId ? `&transactionId=${encodeURIComponent(txnId)}` : ""}`),
  getByStudent:   (sid)                       => request("GET",    `/fees/student/${sid}`),
  getByStatus:    (s)                         => request("GET",    `/fees/status/${s}`),
  getByYear:      (year)                      => request("GET",    `/fees/year/${year}`),
  getSummary:     ()                          => request("GET",    "/fees/summary"),
};

export const userMgmtAPI = {
  getAll:       ()           => request("GET",    "/users"),
  getById:      (id)         => request("GET",    `/users/${id}`),
  create:       (data)       => request("POST",   "/users", data),
  update:       (id, data)   => request("PUT",    `/users/${id}`, data),
  updateStatus: (id, status) => request("PATCH",  `/users/${id}/status?status=${status}`),
  delete:       (id)         => request("DELETE", `/users/${id}`),
  search:       (name)       => request("GET",    `/users/search?name=${encodeURIComponent(name)}`),
};

export const configAPI = {
  // School Profile
  getProfile:    ()         => request("GET", "/config/profile"),
  saveProfile:   (data)     => request("PUT", "/config/profile", data),

  // Grades
  getGrades:     ()         => request("GET",    "/config/grades"),
  createGrade:   (data)     => request("POST",   "/config/grades", data),
  deleteGrade:   (id)       => request("DELETE", `/config/grades/${id}`),

  // Sections
  addSection:    (gid, letter) => request("POST",   `/config/grades/${gid}/sections`, { letter }),
  deleteSection: (sid)         => request("DELETE", `/config/sections/${sid}`),

  // Subjects
  getSubjects:    ()         => request("GET",    "/config/subjects"),
  createSubject:  (data)     => request("POST",   "/config/subjects", data),
  updateSubject:  (id, data) => request("PUT",    `/config/subjects/${id}`, data),
  deleteSubject:  (id)       => request("DELETE", `/config/subjects/${id}`),

  // Fee Structure
  getFeeStructures:    ()         => request("GET",    "/config/fee-structure"),
  createFeeStructure:  (data)     => request("POST",   "/config/fee-structure", data),
  updateFeeStructure:  (id, data) => request("PUT",    `/config/fee-structure/${id}`, data),
  deleteFeeStructure:  (id)       => request("DELETE", `/config/fee-structure/${id}`),

  // Holidays
  getHolidays:    ()         => request("GET",    "/config/holidays"),
  createHoliday:  (data)     => request("POST",   "/config/holidays", data),
  updateHoliday:  (id, data) => request("PUT",    `/config/holidays/${id}`, data),
  deleteHoliday:  (id)       => request("DELETE", `/config/holidays/${id}`),
};

export const classLayoutAPI = {
  updateLayout: (id, data)                      => request("PUT",    `/classes/${id}/layout`, data),
  getSeats:     (id)                            => request("GET",    `/classes/${id}/seats`),
  assignSeat:   (id, row, col, seat, studentId) => request("PUT",    `/classes/${id}/seats/${row}/${col}/${seat}`, { studentId }),
  unassignSeat: (id, row, col, seat)            => request("DELETE", `/classes/${id}/seats/${row}/${col}/${seat}`),
};

export const attendanceAPI = {
  save:           (data)                  => request("POST",  "/attendance", data),
  getByClassDate: (className, date)       => request("GET",   `/attendance/class/${encodeURIComponent(className)}/date/${date}`),
  getByStudent:   (studentId, from, to)   => {
    let url = `/attendance/student/${studentId}`;
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to)   params.push(`to=${to}`);
    if (params.length) url += `?${params.join("&")}`;
    return request("GET", url);
  },
  getClassSummary: (className, from, to) => request("GET",   `/attendance/class/${encodeURIComponent(className)}/summary?from=${from}&to=${to}`),
};

export const examAPI = {
  getAll:             ()           => request("GET",    "/exams"),
  getById:            (id)         => request("GET",    `/exams/${id}`),
  create:             (data)       => request("POST",   "/exams", data),
  update:             (id, data)   => request("PUT",    `/exams/${id}`, data),
  delete:             (id)         => request("DELETE", `/exams/${id}`),
  updateStatus:       (id, status) => request("PATCH",  `/exams/${id}/status?status=${status}`),
  getByClass:         (cls)        => request("GET",    `/exams/class/${cls}`),
  getByStatus:        (s)          => request("GET",    `/exams/status/${s}`),
  getBySubject:       (sub)        => request("GET",    `/exams/subject/${sub}`),
  getUpcoming:        ()           => request("GET",    "/exams/upcoming"),
  getUpcomingByClass: (cls)        => request("GET",    `/exams/upcoming/class/${cls}`),
  getByDateRange:     (from, to)   => request("GET",    `/exams/range?from=${from}&to=${to}`),
};