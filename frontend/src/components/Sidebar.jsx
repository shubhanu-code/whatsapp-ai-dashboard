import React from "react";
import { Bot, Sun, Moon } from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  navItems = [],
  darkMode,
  setDarkMode,
}) {
  return (
    <div
      className={`hidden md:flex w-64 flex-col justify-between p-4 shrink-0 border-r transition-colors ${
        darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/70"
      }`}
    >
      <div className="space-y-6">
        {/* Main App Title Wrapper */}
        <div
          className={`flex items-center gap-3 px-2 py-3 border-b transition-colors ${
            darkMode ? "border-[#202c33]" : "border-slate-100"
          }`}
        >
          <div className="w-9 h-9 bg-[#e3f7f2] text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Bot size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              className={`font-bold text-[15px] tracking-tight leading-none ${
                darkMode ? "text-white" : "text-slate-800"
              }`}
            >
              WhatsApp Bot Manager
            </h1>
            <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase block mt-1">
              Workspace Panel
            </span>
          </div>
        </div>

        {/* Nav Links Stack */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? darkMode
                      ? "bg-[#202c33] text-[#25D366]"
                      : "bg-[#e3f7f2] text-emerald-600"
                    : darkMode
                    ? "text-slate-300 hover:bg-[#202c33] hover:text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {IconComponent && (
                  <IconComponent size={18} strokeWidth={isSelected ? 2.5 : 2} />
                )}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Panel Metadata & Action Controls */}
      <div
        className={`space-y-4 pt-4 px-2 border-t transition-colors ${
          darkMode ? "border-[#202c33]" : "border-slate-100"
        }`}
      >
        {/* Profile/Developer Metadata Info */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-slate-400">Developed by</span>
          <span className="text-[13px] font-bold text-emerald-600">Shubhanu Chatterjee</span>
        </div>

        {/* Live Theme Toggle Selector and Engine Status Layout */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-[11px] font-semibold text-slate-500">Gateway Connected</span>
          </div>

          <button
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle system interface surface color theme"
            className={`p-2 rounded-xl border transition-all ${
              darkMode
                ? "bg-[#202c33] border-[#303d45] text-amber-400 hover:text-amber-300"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {darkMode ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}