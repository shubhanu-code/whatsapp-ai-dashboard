import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  LineChart,
  MessageSquareText,
  MessagesSquare,
  User,
  X,
  CheckCircle2,
  Circle,
  Phone,
  Clock,
  Sparkles,
  MessageCircle,
  Cpu,
  CalendarDays,
  Database,
  TrendingUp,
} from "lucide-react";

import { API_BASE } from "../../services/api";
import AITab from "./AITab";
import AnalyticsTab from "./AnalyticsTab";
import LoadingSkeleton from "./LoadingSkeleton";
import MemoryTab from "./MemoryTab";
import MessagesTab from "./MessagesTab";
import OverviewTab from "./OverviewTab";
import TimelineTab from "./TimelineTab";

// ─── Unchanged business logic ─────────────────────────────────────────────────

const requestCache = new Map();
const pendingRequests = new Map();

const TABS = [
  { id: "overview",  label: "Overview",  icon: User             },
  { id: "messages",  label: "Messages",  icon: MessagesSquare   },
  { id: "analytics", label: "Analytics", icon: LineChart         },
  { id: "ai",        label: "AI",        icon: Bot              },
  { id: "memory",    label: "Memory",    icon: BrainCircuit     },
  { id: "timeline",  label: "Timeline",  icon: MessageSquareText},
];

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function initials(name = "Unknown") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

async function fetchIntelligence(phoneNumber) {
  if (requestCache.has(phoneNumber)) return requestCache.get(phoneNumber);
  if (pendingRequests.has(phoneNumber)) return pendingRequests.get(phoneNumber);

  const request = fetch(
    `${API_BASE}/contacts/${encodeURIComponent(phoneNumber)}/intelligence`
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Failed to load contact intelligence");
      const data = await response.json();
      requestCache.set(phoneNumber, data);
      return data;
    })
    .finally(() => pendingRequests.delete(phoneNumber));

  pendingRequests.set(phoneNumber, request);
  return request;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const tk = {
  // Surfaces
  deepBg:   "#0b141a",
  cardBg:   "#111b21",
  surface:  "#182229",
  border:   "#202c33",
  // Text
  textPrimary: "#e9edef",
  textMuted:   "#8696a0",
  // Accent
  green:    "#25D366",
  teal:     "#128C7E",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ─── Score computation (derived from real data, no invented values) ───────────

function computeScore(data, overview) {
  if (!data) return null;
  const messages  = data?.messages?.total         ?? 0;
  const aiReplies = data?.messages?.aiReplies     ?? 0;
  const convDays  = overview?.conversationDays    ?? 0;
  const memOn     = Boolean(data?.memory?.enabled ?? data?.memory?.status === "active");

  const pts = Math.min(messages  / 5,  40)
            + Math.min(aiReplies / 3,  30)
            + Math.min(convDays  / 10, 20)
            + (memOn ? 10 : 0);

  return Math.max(0, Math.min(100, Math.round(pts)));
}

function scoreLabel(score) {
  if (score === null) return "—";
  if (score >= 90)   return "Excellent";
  if (score >= 80)   return "Strong";
  if (score >= 60)   return "Active";
  if (score >= 40)   return "Developing";
  return "Getting Started";
}

function scoreTint(score) {
  if (score === null) return { text: "text-[#8696a0]", ring: "rgba(134,150,160,0.25)" };
  if (score >= 80)    return { text: "text-[#25D366]", ring: "rgba(37,211,102,0.25)"  };
  if (score >= 60)    return { text: "text-blue-400",  ring: "rgba(96,165,250,0.25)"  };
  if (score >= 40)    return { text: "text-amber-400", ring: "rgba(251,191,36,0.25)"  };
  return              { text: "text-rose-400",          ring: "rgba(248,113,113,0.25)" };
}

// ─── Primitive components ─────────────────────────────────────────────────────

function StatusBadge({ active, activeLabel, inactiveLabel, darkMode }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11px] font-semibold tracking-wider uppercase select-none";

  if (active) {
    return (
      <span className={cx(base, "bg-[#25D366]/10 text-[#25D366] ring-1 ring-[#25D366]/20")}>
        <CheckCircle2 size={10} strokeWidth={2.5} />
        {activeLabel}
      </span>
    );
  }
  return (
    <span className={cx(base, darkMode
      ? "bg-white/[0.05] text-[#8696a0] ring-1 ring-white/10"
      : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
    )}>
      <Circle size={10} strokeWidth={2} />
      {inactiveLabel}
    </span>
  );
}

function MetaItem({ icon: Icon, value, darkMode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={13} strokeWidth={2} className={darkMode ? "text-[#8696a0] shrink-0" : "text-slate-400 shrink-0"} />
      <span className={cx(
        "text-[13px] truncate",
        darkMode ? "text-[#8696a0]" : "text-slate-500"
      )}>
        {value}
      </span>
    </div>
  );
}

function KpiCard({ icon: Icon, value, label, iconColor, darkMode }) {
  return (
    <div className={cx(
      "flex flex-col gap-3 rounded-xl border p-4 transition-shadow duration-200 hover:shadow-lg",
      darkMode
        ? "border-[#202c33] bg-[#182229] hover:shadow-black/30"
        : "border-slate-200 bg-white hover:shadow-slate-200/80"
    )}>
      <div className={cx(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        darkMode ? "bg-white/[0.05]" : "bg-slate-100"
      )}>
        <Icon size={15} strokeWidth={2} className={iconColor} />
      </div>
      <div>
        <div className={cx(
          "text-[26px] font-bold leading-none tracking-tight tabular-nums",
          darkMode ? "text-[#e9edef]" : "text-slate-900"
        )}>
          {value ?? "—"}
        </div>
        <div className={cx(
          "mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          darkMode ? "text-[#8696a0]" : "text-slate-400"
        )}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ text, darkMode }) {
  return (
    <div className={cx(
      "rounded-xl border p-5",
      darkMode
        ? "border-[#202c33] bg-[#182229]"
        : "border-slate-200 bg-white"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-[#25D366] shrink-0" />
        <span className={cx(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          darkMode ? "text-[#8696a0]" : "text-slate-400"
        )}>
          AI Summary
        </span>
      </div>
      <p className={cx(
        "text-[14px] leading-relaxed",
        darkMode ? "text-[#e9edef]" : "text-slate-700"
      )}>
        "{text}"
      </p>
      <p className={cx(
        "mt-3 text-[11px]",
        darkMode ? "text-[#8696a0]/60" : "text-slate-400"
      )}>
        Generated automatically from conversation history
      </p>
    </div>
  );
}

function IntelligencePanel({ score, label, tint, data, overview, memEnabled, darkMode }) {
  const panelRows = [
    { label: "Messages",         value: data?.messages?.total         ?? "—", icon: MessageCircle },
    { label: "AI Replies",       value: data?.messages?.aiReplies     ?? "—", icon: Bot           },
    { label: "Conversation Days",value: overview?.conversationDays    ?? "—", icon: CalendarDays  },
    { label: "Models Used",      value: data?.ai?.overview?.modelsUsed ?? "—", icon: Cpu          },
    { label: "Memory",           value: memEnabled ? "Enabled" : "Disabled",  icon: Database      },
  ];

  return (
    <div className={cx(
      "flex h-full flex-col rounded-xl border overflow-hidden",
      darkMode
        ? "border-[#202c33] bg-[#182229]"
        : "border-slate-200 bg-white"
    )}>
      {/* Score block */}
      <div className={cx(
        "flex flex-col items-center justify-center gap-1 px-5 py-6 border-b",
        darkMode ? "border-[#202c33]" : "border-slate-100"
      )}>
        <div
          className={cx("text-[52px] font-bold leading-none tabular-nums", tint.text)}
          style={{ textShadow: `0 0 32px ${tint.ring}` }}
        >
          {score ?? "—"}
        </div>
        <div className={cx(
          "mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
          darkMode ? "text-[#8696a0]" : "text-slate-400"
        )}>
          Contact Intelligence
        </div>
        <div className={cx("text-[13px] font-semibold mt-0.5", tint.text)}>
          {label}
        </div>
      </div>

      {/* Stat rows */}
      <div className="flex flex-col divide-y flex-1"
        style={{ borderColor: darkMode ? tk.border : "#f1f5f9" }}
      >
        {panelRows.map(({ label: rowLabel, value, icon: Icon }) => (
          <div
            key={rowLabel}
            className={cx(
              "flex items-center justify-between px-5 py-3.5",
              darkMode ? "divide-[#202c33]" : "divide-slate-100"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={13} strokeWidth={2} className={darkMode ? "text-[#8696a0]" : "text-slate-400"} />
              <span className={cx(
                "text-[13px]",
                darkMode ? "text-[#8696a0]" : "text-slate-500"
              )}>
                {rowLabel}
              </span>
            </div>
            <span className={cx(
              "text-[13px] font-semibold tabular-nums",
              darkMode ? "text-[#e9edef]" : "text-slate-800"
            )}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer badge */}
      <div className={cx(
        "px-5 py-4 border-t",
        darkMode ? "border-[#202c33]" : "border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-[#25D366]" />
          <span className={cx(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            darkMode ? "text-[#8696a0]" : "text-slate-400"
          )}>
            Intelligence Score
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContactIntelligenceModal({ contact, onClose, darkMode }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData]           = useState(null);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(Boolean(contact?.phoneNumber));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!contact?.phoneNumber) return;
      setLoading(true);
      setError("");
      try {
        const intelligence = await fetchIntelligence(contact.phoneNumber);
        if (!cancelled) setData(intelligence);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Unable to load contact intelligence right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [contact?.phoneNumber]);

  const tabContent = useMemo(() => {
    const props = { data, darkMode };
    switch (activeTab) {
      case "messages":  return <MessagesTab  {...props} />;
      case "analytics": return <AnalyticsTab {...props} />;
      case "ai":        return <AITab        {...props} />;
      case "memory":    return <MemoryTab    {...props} />;
      case "timeline":  return <TimelineTab  {...props} />;
      default:          return <OverviewTab  {...props} />;
    }
  }, [activeTab, data, darkMode]);

  if (!contact) return null;

  const overview   = data?.overview || contact || {};
  const memEnabled = Boolean(data?.memory?.enabled ?? data?.memory?.status === "active");
  const score      = computeScore(data, overview);
  const label      = scoreLabel(score);
  const tint       = scoreTint(score);

  // Shared surface classes
  const shell = darkMode
    ? "bg-[#0b141a] border-[#202c33] text-[#e9edef]"
    : "bg-white border-slate-200 text-slate-900";

  const headerBg = darkMode ? "bg-[#0b141a]" : "bg-white";
  const borderCol = darkMode ? "border-[#202c33]" : "border-slate-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}
    >
      {/* ── Modal shell ─────────────────────────────────────────────────────── */}
      <div
        className={cx(
          "relative flex flex-col max-h-[92vh] w-full max-w-[1160px]",
          "overflow-hidden rounded-[24px] border",
          shell
        )}
        style={{
          boxShadow: darkMode
            ? "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* Accent stripe */}
        <div
          className="absolute inset-x-0 top-0 h-[2px] z-20"
          style={{ background: "linear-gradient(90deg,#25D366,#128C7E 60%,transparent)" }}
        />

        {/* ── Fixed header ─────────────────────────────────────────────────── */}
        <header className={cx(
          "relative z-10 flex-none border-b px-6 pt-5 pb-2",
          headerBg, borderCol
        )}>
          {/* Two-column profile grid */}
          <div className="flex items-start gap-5">

            {/* ── Left column ──────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-5 min-w-0">

              {/* Avatar + identity row */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="
                    flex
                    h-[68px]
                    w-[68px]
                    items-center
                    justify-center
                    rounded-2xl
                    text-[24px]
                    font-bold
                    text-[#25D366]
                    "
                    style={{
                      background: darkMode
                        ? "linear-gradient(135deg,rgba(37,211,102,0.14),rgba(18,140,126,0.08))"
                        : "linear-gradient(135deg,rgba(37,211,102,0.10),rgba(18,140,126,0.06))",
                      boxShadow:
                      "0 10px 30px rgba(37,211,102,.08),0 0 0 1px rgba(37,211,102,.20)",
                    }}
                  >
                    {initials(overview.name)}
                  </div>
                </div>

                {/* Name, badges, meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={cx(
                      "text-[30px] font-bold tracking-[-0.04em] leading-none",
                      darkMode ? "text-[#e9edef]" : "text-slate-900"
                    )}>
                      {overview.name || "Unknown"}
                    </h2>
                    <StatusBadge active={overview.botEnabled}        activeLabel="Bot On"    inactiveLabel="Bot Off"       darkMode={darkMode} />
                    <StatusBadge active={Boolean(overview.aiProfile)} activeLabel="AI Active" inactiveLabel="No AI Profile" darkMode={darkMode} />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {overview.relationship && (
                      <div
                        className={cx(
                          "inline-flex w-fit rounded-full px-3 py-1.5 text-[12px] font-semibold",
                          darkMode
                            ? "bg-[#202c33] text-[#25D366]"
                            : "bg-emerald-50 text-[#128C7E]"
                        )}
                      >
                        {overview.relationship}
                      </div>
                    )}
                    <MetaItem   icon={Phone}       value={overview.phoneNumber || contact.phoneNumber}      darkMode={darkMode} />
                    <MetaItem   icon={Clock}       value={`Last active ${formatDate(overview.lastMessage)}`} darkMode={darkMode} />
                  </div>
                </div>
              </div> 

            
            </div>

            

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close contact intelligence"
              className={cx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
                darkMode
                  ? "text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* ── Pill tab bar ─────────────────────────────────────────────────── */}
          <nav
            className={cx("mt-5 flex gap-1 overflow-x-auto border-t pt-3 pb-1", borderCol)}
            aria-label="Contact intelligence sections"
          >
            {TABS.map(({ id, label: tabLabel, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cx(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all duration-150",
                    active
                      ? "bg-[#25D366]/10 text-[#25D366] shadow-sm"
                      : darkMode
                        ? "text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  {tabLabel}
                </button>
              );
            })}
          </nav>
        </header>

        {/* ── Scrollable content ───────────────────────────────────────────── */}
        <main className={cx(
          "flex-1 overflow-y-auto",
          darkMode ? "bg-[#0f171d]" : "bg-slate-50"
        )}>
          <div className="min-h-full px-6 py-7 lg:px-8 lg:py-5">
            {/* KPI grid — only rendered after data loads */}
              {data && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KpiCard
                    icon={MessageCircle}
                    value={data?.messages?.total}
                    label="Messages"
                    iconColor="text-[#25D366]"
                    darkMode={darkMode}
                  />
                  <KpiCard
                    icon={Bot}
                    value={data?.messages?.aiReplies}
                    label="AI Replies"
                    iconColor="text-violet-400"
                    darkMode={darkMode}
                  />
                  <KpiCard
                    icon={CalendarDays}
                    value={overview.conversationDays != null ? `${overview.conversationDays}d` : "—"}
                    label="Duration"
                    iconColor="text-blue-400"
                    darkMode={darkMode}
                  />
                  <KpiCard
                    icon={Cpu}
                    value={data?.ai?.overview?.modelsUsed}
                    label="Models Used"
                    iconColor="text-amber-400"
                    darkMode={darkMode}
                  />
                </div>
              )}
            {/* Conversation Summary */}
              {data?.summary?.text && (
                <div className="max-w-4xl">
                  <SummaryCard
                    text={data.summary.text}
                    darkMode={darkMode}
                  />
                </div>
              )}
            {/* ── Right column — Intelligence panel ────────────────────────── */}
            <div className="hidden xl:flex w-[290px] shrink-0 flex-col self-stretch">
              {loading ? (
                <div className={cx(
                  "flex-1 rounded-xl border animate-pulse",
                  darkMode ? "border-[#202c33] bg-[#182229]" : "border-slate-200 bg-slate-50"
                )} />
              ) : data ? (
                <IntelligencePanel
                  score={score}
                  label={label}
                  tint={tint}
                  data={data}
                  overview={overview}
                  memEnabled={memEnabled}
                  darkMode={darkMode}
                />
              ) : null}
            </div>

            {loading && <LoadingSkeleton darkMode={darkMode} />}

            {!loading && error && (
              <div className={cx(
                "rounded-xl border p-5",
                darkMode
                  ? "border-rose-500/20 bg-rose-500/8 text-rose-300"
                  : "border-rose-200 bg-rose-50 text-rose-600"
              )}>
                <p className="text-[14px] font-medium">Something went wrong</p>
                <p className={cx("mt-1 text-[13px]", darkMode ? "text-rose-400/70" : "text-rose-400")}>
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && data && tabContent}
          </div>
        </main>
      </div>
    </div>
  );
}