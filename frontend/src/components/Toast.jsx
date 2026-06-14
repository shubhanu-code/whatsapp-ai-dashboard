import { X } from "lucide-react";

export default function Toast({
  toast,
  setToast
}) {

  if (!toast) return null;

  return (
    <div
            className="
              fixed top-5 right-5 z-[9999]
              animate-[slideIn_.25s_ease-out]
            "
          >
            <div
              className={`
                min-w-[320px]
                max-w-md
                px-4 py-3
                rounded-2xl
                shadow-xl
                border
                flex items-start gap-3
                backdrop-blur-sm
                ${
                  toast.type === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-200"
                }
              `}
            >

              <div className="mt-0.5">

                {toast.type === "error" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    ❌
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    ✅
                  </div>
                )}

              </div>

              <div className="flex-1">

                <div
                  className={`
                    text-sm font-semibold
                    ${
                      toast.type === "error"
                        ? "text-red-700"
                        : "text-emerald-700"
                    }
                  `}
                >
                  {toast.type === "error"
                    ? "Error"
                    : "Success"}
                </div>

                <div
                  className={`
                    text-sm mt-0.5
                    ${
                      toast.type === "error"
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  `}
                >
                  {toast.message}
                </div>

              </div>

              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>

            </div>
          </div>
  );
}
