// toast.js — tiny global toast bus. Import { toast } anywhere and call
// toast.error(msg) / toast.success(msg) / toast.info(msg) / toast.warning(msg).
// A single <Toaster /> mounted at the app root renders them.

let listeners = [];
let counter = 0;

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

function emit(type, message, opts = {}) {
  const id = ++counter;
  const item = { id, type, message: String(message ?? ""), duration: opts.duration ?? 4200 };
  listeners.forEach((l) => l(item));
  return id;
}

export const toast = {
  success: (m, o) => emit("success", m, o),
  error:   (m, o) => emit("error", m, o),
  info:    (m, o) => emit("info", m, o),
  warning: (m, o) => emit("warning", m, o),
};
