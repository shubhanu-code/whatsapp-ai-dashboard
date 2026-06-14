import { Bot } from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  navItems
}) {

  return (
    <div className="hidden md:flex w-64 bg-white border-r border-slate-200/70 flex-col justify-between p-4 shrink-0">
            <div className="space-y-6">
              {/* Main App Title Wrapper */}
              <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-[#e3f7f2] text-emerald-600 rounded-xl flex items-center justify-center">
                  <Bot size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="font-bold text-[15px] text-slate-800 tracking-tight leading-none">WhatsApp Bot Manager</h1>
                  <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase block mt-1">Workspace Panel</span>
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
                          ? 'bg-[#e3f7f2] text-emerald-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <IconComponent size={18} strokeWidth={isSelected ? 2.5 : 2} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
    
            {/* Bottom Panel Metadata branding block */}
            <div className="space-y-3 pt-4 border-t border-slate-100 px-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-slate-400">Developed by</span>
                <span className="text-[13px] font-bold text-emerald-600">Shubhanu Chatterjee</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-slate-500">Gateway Engine Connected</span>
              </div>
            </div>
          </div>
  );

}