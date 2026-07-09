import React, { useEffect } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function Toast({ toast, setToast }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  const type = toast.type || "success";

  // 1. Centralize type configuration parameters
  const TYPE_CONFIGS = {
    error: {
      title: "Error",
      icon: <XCircle size={18} strokeWidth={2.5} />,
      iconClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-50/95 border-red-200 dark:bg-[#1a1517]/95 dark:border-red-900/30",
      titleClass: "text-red-800 dark:text-red-300",
      msgClass: "text-red-600 dark:text-red-400/80",
    },
    warning: {
      title: "Warning",
      icon: <AlertTriangle size={18} strokeWidth={2.5} />,
      iconClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50/95 border-amber-200 dark:bg-[#1c1912]/95 dark:border-amber-900/30",
      titleClass: "text-amber-800 dark:text-amber-300",
      msgClass: "text-amber-600 dark:text-amber-400/80",
    },
    success: {
      title: "Success",
      icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50/95 border-emerald-200 dark:bg-[#0c1912]/95 dark:border-emerald-900/30",
      titleClass: "text-emerald-800 dark:text-emerald-300",
      msgClass: "text-emerald-600 dark:text-emerald-400/80",
    },
  };

  const currentConfig = TYPE_CONFIGS[type] || TYPE_CONFIGS.success;

  return (
    <div className="fixed top-5 right-5 z-[9999] animate-[slideIn_.25s_ease-out]">
      <div
        className={`min-w-[320px] max-w-md px-4 py-3.5 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-sm transition-colors ${currentConfig.bgClass}`}
      >
        {/* Status Indicator Icon Block */}
        <div className={`mt-0.5 shrink-0 ${currentConfig.iconClass}`}>
          {currentConfig.icon}
        </div>

        {/* Text Payload Meta Container */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold tracking-wide ${currentConfig.titleClass}`}>
            {currentConfig.title}
          </div>

          <div className={`text-xs font-medium mt-1 leading-relaxed break-words ${currentConfig.msgClass}`}>
            {toast.message}
          </div>
        </div>

        {/* Dismiss Trigger Control */}
        <button
          onClick={() => setToast(null)}
          aria-label="Dismiss notification alert prompt"
          className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mt-0.5 shrink-0"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}