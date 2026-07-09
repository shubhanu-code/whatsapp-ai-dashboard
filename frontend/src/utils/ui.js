export const card = (darkMode) =>
  darkMode
    ? "bg-[#111b21] border-[#202c33]"
    : "bg-white border-slate-200";

export const cardSecondary = (darkMode) =>
  darkMode
    ? "bg-[#0f1a20] border-[#202c33]"
    : "bg-slate-50 border-slate-200";

export const heading = (darkMode) =>
  darkMode
    ? "text-white"
    : "text-slate-900";

export const text = (darkMode) =>
  darkMode
    ? "text-slate-300"
    : "text-slate-700";

export const muted = (darkMode) =>
  darkMode
    ? "text-slate-400"
    : "text-slate-500";