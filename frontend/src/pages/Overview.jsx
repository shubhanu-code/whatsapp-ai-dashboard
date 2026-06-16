import {
    Bot,
    Users,
    SquareCode,
    CheckCircle2
} from "lucide-react";

import { API_BASE } from "../services/api";

export default function Overview({
    rules,
    contacts,
    stats,
    replyMode,
    setReplyMode,
    darkMode
}) {
    return (
    
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <h1
                className={`
                    text-3xl
                    font-bold
                    mb-8
                    ${
                    darkMode
                        ? "text-white"
                        : "text-slate-800"
                    }
                `}
                >
                Dashboard Overview
                </h1>
            
            {/* WhatsApp AI Banner Component */}
            <div className="bg-gradient-to-r from-emerald-600 to-[#075e54] text-white p-7 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="relative z-10 max-w-xl">
                <h3 className="font-bold text-2xl tracking-wide">
                    WhatsApp AI Dashboard
                </h3>
                <p className="text-white/80 text-sm mt-1.5 font-medium">
                    AI-Powered WhatsApp Automation Platform
                </p>
                <div className="mt-6 text-xs text-white/60 font-medium tracking-wide">
                    Developed by Shubhanu Chatterjee
                </div>
                </div>
                
                {/* Subtle Decorative Background Wave Icon */}
                <div className="absolute right-6 bottom-0 top-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Bot size={180} strokeWidth={1} />
                </div>
            </div>

            {/* Grid Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div
                    className={`
                        p-5
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-between
                        ${
                        darkMode
                            ? "bg-[#111b21] border-[#202c33]"
                            : "bg-[#f8f9fa] border-slate-200/40"
                        }
                    `}
                    >
                <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Rules</p>
                    <p
                        className={`
                            text-3xl
                            font-extrabold
                            ${
                            darkMode
                                ? "text-white"
                                : "text-slate-800"
                            }
                        `}
                        >
                        {rules.filter(r => r.isActive).length}
                        </p>
                </div>
                <div
                    className={`
                        p-3
                        rounded-xl
                        border
                        ${
                        darkMode
                            ? "bg-[#202c33] border-[#2a3942] text-emerald-400"
                            : "bg-white border-slate-100 text-emerald-600"
                        }
                    `}
                    >
                    <SquareCode size={22} />
                </div>
                </div>

                <div
                    className={`
                        p-5
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-between
                        ${
                        darkMode
                            ? "bg-[#111b21] border-[#202c33]"
                            : "bg-[#f8f9fa] border-slate-200/40"
                        }
                    `}
                    >
                <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Saved Contacts</p>
                    <p
                        className={`
                            text-3xl
                            font-extrabold
                            ${
                            darkMode
                                ? "text-white"
                                : "text-slate-800"
                            }
                        `}
                        >
                        {contacts.length}
                        </p>
                </div>
                <div
                    className={`
                        p-3
                        rounded-xl
                        border
                        ${
                        darkMode
                            ? "bg-[#202c33] border-[#2a3942] text-emerald-400"
                            : "bg-white border-slate-100 text-emerald-600"
                        }
                    `}
                    >
                    <Users size={22} />
                </div>
                </div>

                <div
                    className={`
                        p-5
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-between
                        ${
                        darkMode
                            ? "bg-[#111b21] border-[#202c33]"
                            : "bg-[#f8f9fa] border-slate-200/40"
                        }
                    `}
                    >
                <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bot Replies Sent</p>
                    <p
                        className={`
                            text-3xl
                            font-extrabold
                            ${
                            darkMode
                                ? "text-white"
                                : "text-slate-800"
                            }
                        `}
                        >
                        {stats.messagesSent}
                        </p>
                </div>
                <div
                    className={`
                        p-3
                        rounded-xl
                        border
                        ${
                        darkMode
                            ? "bg-[#202c33] border-[#2a3942] text-emerald-400"
                            : "bg-white border-slate-100 text-emerald-600"
                        }
                    `}
                    >
                    <Bot size={22} />
                </div>
                </div>
            </div>
            <div
                className={`
                    rounded-2xl
                    border
                    shadow-sm
                    p-6
                    ${
                    darkMode
                        ? "bg-[#111b21] border-[#202c33]"
                        : "bg-white border-slate-200/50"
                    }
                `}
                >
                <h3
                    className={`
                        text-[15px]
                        font-bold
                        tracking-tight
                        mb-5
                        ${
                        darkMode
                            ? "text-white"
                            : "text-slate-800"
                        }
                    `}
                    >
                AI Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                    <label
                        className={`
                            block
                            text-xs
                            font-bold
                            uppercase
                            tracking-wider
                            mb-2
                            ${
                            darkMode
                                ? "text-slate-300"
                                : "text-slate-500"
                            }
                        `}
                        >
                    Reply Mode
                    </label>

                    <select
                    value={replyMode}
                    onChange={async (e) => {
                        const mode = e.target.value;

                        setReplyMode(mode);

                        await fetch(`${API_BASE}/settings`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            replyMode: mode,
                        })
                        });
                    }}
                    className={`
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        border
                        font-medium
                        ${
                            darkMode
                            ? "bg-[#202c33] border-[#2a3942] text-white"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }
                        `}
                    >
                    <option value="rules">Rules Only</option>
                    <option value="ai">AI Only</option>
                    <option value="smart">Smart Mode</option>
                    </select>
                </div>

                </div>
            </div>
            {/* Quick Start Guide Card Section */}
            <div
                className={`
                    rounded-2xl
                    border
                    shadow-sm
                    p-6
                    space-y-4
                    ${
                    darkMode
                        ? "bg-[#111b21] border-[#202c33]"
                        : "bg-white border-slate-200/50"
                    }
                `}
                >
                <h3
                    className={`
                        text-[15px]
                        font-bold
                        tracking-tight
                        ${
                        darkMode
                            ? "text-white"
                            : "text-slate-800"
                        }
                    `}
                    >
                Quick Start Guide
                </h3>
                <ul
                    className={`
                        space-y-3.5
                        text-sm
                        ${
                        darkMode
                            ? "text-slate-300"
                            : "text-slate-600"
                        }
                    `}
                    >
                <li className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                    <span>Add contacts and enable the bot for approved contacts in the <span className="text-emerald-600 font-bold">Contacts</span> tab.</span>
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                    <span>Create keyword-based automations in <span className="text-emerald-600 font-bold">Auto-Reply Rules</span> for instant responses.</span>
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                    <span>Choose between <span className="text-emerald-600 font-bold">Rules Mode</span> , <span className="text-emerald-600 font-bold">AI Mode</span> , or <span className="text-emerald-600 font-bold">Smart Mode</span> to control how the bot responds.</span>
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                    <span>Smart Mode automatically uses Groq AI whenever no matching rule is found.</span>
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                    <span>Monitor activity and test conversations directly from the dashboard before going live.</span>
                </li>
                </ul>
            </div>
            </div>
    );
}

