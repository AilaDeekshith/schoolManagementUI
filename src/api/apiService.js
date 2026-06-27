const BASE_URL = "http://localhost:8080/api";

// ── Generic fetch wrapper ─────────────────────────────────────
async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  // 204 No Content (DELETE) — return null
  if (res.status === 204) return null;

  return res.json();
}

// ── Students ──────────────────────────────────────────────────
export const studentAPI = {
  getAll:          ()           => request("GET",    "/students"),
  getById:         (id)         => request("GET",    `/students/${id}`),
  create:          (data)       => request("POST",   "/students", data),
  update:          (id, data)   => request("PUT",    `/students/${id}`, data),
  delete:          (id)         => request("DELETE", `/students/${id}`),
  getByClass:      (className)  => request("GET",    `/students/class/${className}`),
  getByStatus:     (status)     => request("GET",    `/students/status/${status}`),
  getByFeeStatus:  (feeStatus)  => request("GET",    `/students/fee-status/${feeStatus}`),
  search:          (name)       => request("GET",    `/students/search?name=${encodeURIComponent(name)}`),
  countActive:     ()           => request("GET",    "/students/count/active"),
};

// ── Teachers ──────────────────────────────────────────────────
export const teacherAPI = {
  getAll:      ()           => request("GET",    "/teachers"),
  getById:     (id)         => request("GET",    `/teachers/${id}`),
  create:      (data)       => request("POST",   "/teachers", data),
  update:      (id, data)   => request("PUT",    `/teachers/${id}`, data),
  delete:      (id)         => request("DELETE", `/teachers/${id}`),
  getBySubject:(subject)    => request("GET",    `/teachers/subject/${subject}`),
  getByStatus: (status)     => request("GET",    `/teachers/status/${status}`),
  getByClass:  (className)  => request("GET",    `/teachers/class/${className}`),
  search:      (name)       => request("GET",    `/teachers/search?name=${encodeURIComponent(name)}`),
};

// ── Admissions ────────────────────────────────────────────────
export const admissionAPI = {
  getAll:      ()         => request("GET",    "/admissions"),
  getById:     (id)       => request("GET",    `/admissions/${id}`),
  create:      (data)     => request("POST",   "/admissions", data),
  update:      (id, data) => request("PUT",    `/admissions/${id}`, data),
  delete:      (id)       => request("DELETE", `/admissions/${id}`),
  approve:     (id)       => request("PATCH",  `/admissions/${id}/approve`),
  reject:      (id)       => request("PATCH",  `/admissions/${id}/reject`),
  getByStatus: (status)   => request("GET",    `/admissions/status/${status}`),
  getByClass:  (cls)      => request("GET",    `/admissions/class/${cls}`),
  search:      (name)     => request("GET",    `/admissions/search?name=${encodeURIComponent(name)}`),
  countPending:()         => request("GET",    "/admissions/count/pending"),
};

// ── Classes ───────────────────────────────────────────────────
export const classAPI = {
  getAll:          ()               => request("GET",    "/classes"),
  getById:         (id)             => request("GET",    `/classes/${id}`),
  getByName:       (name)           => request("GET",    `/classes/name/${name}`),
  create:          (data)           => request("POST",   "/classes", data),
  update:          (id, data)       => request("PUT",    `/classes/${id}`, data),
  delete:          (id)             => request("DELETE", `/classes/${id}`),
  assignTeacher:   (classId, tid)   => request("PATCH",  `/classes/${classId}/assign-teacher/${tid}`),
  getAvailable:    ()               => request("GET",    "/classes/available"),
};

// ── Timetable ─────────────────────────────────────────────────
export const timetableAPI = {
  getAll:          ()             => request("GET",    "/timetable"),
  getById:         (id)           => request("GET",    `/timetable/${id}`),
  create:          (data)         => request("POST",   "/timetable", data),
  update:          (id, data)     => request("PUT",    `/timetable/${id}`, data),
  delete:          (id)           => request("DELETE", `/timetable/${id}`),
  getByClass:      (className)    => request("GET",    `/timetable/class/${className}`),
  getByClassAndDay:(cls, day)     => request("GET",    `/timetable/class/${cls}/day/${day}`),
  getByTeacher:    (teacherId)    => request("GET",    `/timetable/teacher/${teacherId}`),
  getTeacherDay:   (tid, day)     => request("GET",    `/timetable/teacher/${tid}/day/${day}`),
};

// ── Fees ──────────────────────────────────────────────────────
export const feesAPI = {
  getAll:          ()                             => request("GET",    "/fees"),
  getById:         (id)                           => request("GET",    `/fees/${id}`),
  create:          (data)                         => request("POST",   "/fees", data),
  update:          (id, data)                     => request("PUT",    `/fees/${id}`, data),
  delete:          (id)                           => request("DELETE", `/fees/${id}`),
  collectPayment:  (id, amount, method, txnId)    => request("POST",
    `/fees/${id}/collect?amount=${amount}&method=${method}${txnId ? `&transactionId=${txnId}` : ""}`),
  getByStudent:    (studentId)                    => request("GET",    `/fees/student/${studentId}`),
  getByStatus:     (status)                       => request("GET",    `/fees/status/${status}`),
  getByYear:       (year)                         => request("GET",    `/fees/year/${year}`),
  getSummary:      ()                             => request("GET",    "/fees/summary"),
};

// ── Exams ─────────────────────────────────────────────────────
export const examAPI = {
  getAll:          ()           => request("GET",    "/exams"),
  getById:         (id)         => request("GET",    `/exams/${id}`),
  create:          (data)       => request("POST",   "/exams", data),
  update:          (id, data)   => request("PUT",    `/exams/${id}`, data),
  delete:          (id)         => request("DELETE", `/exams/${id}`),
  updateStatus:    (id, status) => request("PATCH",  `/exams/${id}/status?status=${status}`),
  getByClass:      (className)  => request("GET",    `/exams/class/${className}`),
  getByStatus:     (status)     => request("GET",    `/exams/status/${status}`),
  getBySubject:    (subject)    => request("GET",    `/exams/subject/${subject}`),
  getUpcoming:     ()           => request("GET",    "/exams/upcoming"),
  getUpcomingByClass:(cls)      => request("GET",    `/exams/upcoming/class/${cls}`),
  getByDateRange:  (from, to)   => request("GET",    `/exams/range?from=${from}&to=${to}`),
};