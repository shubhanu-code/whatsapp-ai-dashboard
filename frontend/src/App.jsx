import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Send,
  Bot,
  User,
  CheckCircle2,
  SquareCode,
  X
} from 'lucide-react';
import Inbox from "./pages/Inbox.jsx";
import Contacts from "./pages/Contacts.jsx";
import Rules from "./pages/Rules.jsx";
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPLY_MODES = new Set(['rules', 'ai', 'smart']);

const INITIAL_RULES = [];

const INITIAL_CONTACTS = [];





const ChatSimulator = ({ rules, contacts, setStats, replyMode, setReplyMode }) => {
  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'bot', text: 'Simulator ready. Send a message to test your rules.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputText, setInputText] = useState('');
  const [impersonateId, setImpersonateId] = useState('unknown');
  const chatEndRef = useRef(null);

  const replyModeRef = useRef(replyMode);
  useEffect(() => {
    replyModeRef.current = replyMode;
  }, [replyMode]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function generateAIReply(text) {

    try {

      const response = await fetch(
        `${API_BASE}/ai-reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: text
          })
        }
      );

      const data = await response.json();

      return data.reply;

    } catch (err) {

      console.error(
        'AI REQUEST ERROR:',
        err
      );

      return 'Sorry, AI is unavailable.';
    }
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setStats(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }));
    setInputText('');

    setTimeout(() => evaluateRules(userMsg.text), 600);
  };

  const evaluateRules = async (text) => {
    
    const lowerText = text.toLowerCase();
    const currentMode = replyModeRef.current;

    if (currentMode === "ai") {
      const aiReply = await generateAIReply(text);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, botMsg]);
      setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
      return;
    }

    const matchedRule = rules.find(rule => {
      if (!rule.isActive) return false;
      const conditionMet =
        !rule.targetContact ||
        rule.targetContact === 'all' ||
        rule.targetContact === impersonateId;
      if (!conditionMet) return false;
      if (rule.matchType === 'exact') {
        return lowerText === rule.keyword;
      } else {
        return lowerText.includes(rule.keyword);
      }
    });

    if (!matchedRule && currentMode === "smart") {
      const aiReply = await generateAIReply(text);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, botMsg]);
      setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
      return;
    }

    if (matchedRule) {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: matchedRule.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chat Simulator</h2>
        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulate As:</span>
          <select
            value={impersonateId} onChange={(e) => setImpersonateId(e.target.value)}
            className="px-2 py-1 border-0 rounded-lg text-sm font-medium focus:ring-0 outline-none bg-transparent text-slate-700 cursor-pointer"
          >
            <option value="unknown">Unknown Number</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-[#efeae2] rounded-lg overflow-hidden border border-slate-200/80 shadow-sm flex flex-col relative">
        <div className="bg-[#008069] text-white px-6 py-3.5 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
              <Bot size={22} className="text-emerald-100" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] leading-tight">WhatsApp Auto-Bot</h3>
              <p className="text-xs text-emerald-200/90 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#00e676] inline-block animate-pulse"></span>
                online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">

              <div className="px-3 py-1.5 rounded-lg bg-[#006e5a] text-white text-xs font-semibold">
                {replyMode.toUpperCase()}
              </div>

            </div>
            
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-opacity-40"
          style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}
        >
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl px-3.5 py-2 shadow-sm relative text-[14.5px] leading-normal ${
                msg.sender === 'user'
                  ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                  : 'bg-white text-[#111b21] rounded-tl-none'
              }`}>
                <p>{msg.text}</p>
                <span className="text-[10px] text-slate-400 block text-right mt-1 font-mono tracking-tighter">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-[#f0f2f5] p-3.5 border-t border-slate-200/60 z-10">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message to test rules..."
              className="flex-1 px-4 py-2.5 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#008069]/20 shadow-sm text-sm bg-white placeholder-slate-400 text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-11 h-11 bg-[#008069] hover:bg-[#006e5a] active:scale-95 disabled:bg-slate-300 disabled:scale-100 text-white rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  useEffect(() => {
    console.log("APP MOUNTED");
  }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [stats, setStats] = useState({ messagesSent: 0, messagesReceived: 0 });
  const [replyMode, setReplyMode] = useState("smart");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [rulesRes, contactsRes, allowedRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/rules`),
          fetch(`${API_BASE}/contacts`),
          fetch(`${API_BASE}/allowed-contacts`),
          fetch(`${API_BASE}/settings`)
        ]);

        const [savedRules, savedContacts, allowedContacts, savedSettings] = await Promise.all([
          rulesRes.json(),
          contactsRes.json(),
          allowedRes.json(),
          settingsRes.json()
        ]);

        if (Array.isArray(savedRules)) {
          setRules(savedRules);
        }

        const allowedSet = new Set(Array.isArray(allowedContacts) ? allowedContacts : []);
        const baseContacts = Array.isArray(savedContacts) && savedContacts.length > 0
          ? savedContacts
          : INITIAL_CONTACTS;

        setContacts(baseContacts.map(contact => ({
          ...contact,
          botEnabled: Boolean(contact.whatsappId && allowedSet.has(contact.whatsappId))
        })));

        if (REPLY_MODES.has(savedSettings?.replyMode)) {
          setReplyMode(savedSettings.replyMode);
        }
      } catch (err) {
        console.warn("Could not fetch dashboard data from backend:", err);
      }
    };

    loadDashboardData();
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'rules', label: 'Auto-Reply Rules', icon: SquareCode },
    { id: 'simulator', label: 'Chat Simulator', icon: Smartphone },
    { id: 'inbox', label: 'Inbox', icon: Send }
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight pb-2">Dashboard Overview</h2>
      
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
        <div className="bg-[#f8f9fa] p-5 rounded-xl border border-slate-200/40 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Rules</p>
            <p className="text-3xl font-extrabold text-slate-800">{rules.filter(r => r.isActive).length}</p>
          </div>
          <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100">
            <SquareCode size={22} />
          </div>
        </div>

        <div className="bg-[#f8f9fa] p-5 rounded-xl border border-slate-200/40 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Saved Contacts</p>
            <p className="text-3xl font-extrabold text-slate-800">{contacts.length}</p>
          </div>
          <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-[#f8f9fa] p-5 rounded-xl border border-slate-200/40 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bot Replies Sent</p>
            <p className="text-3xl font-extrabold text-slate-800">{stats.messagesSent}</p>
          </div>
          <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100">
            <Bot size={22} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6">
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight mb-5">
          AI Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Reply Mode
            </label>

            <select
              value={replyMode}
              onChange={async (e) => {
                const mode = e.target.value;

                setReplyMode(mode);

                const response = await fetch(`${API_BASE}/settings`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    replyMode: mode,
                  })
                });
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="rules">Rules Only</option>
              <option value="ai">AI Only</option>
              <option value="smart">Smart Mode</option>
            </select>
          </div>

        </div>
      </div>
      {/* Quick Start Guide Card Section */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 space-y-4">
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
          Quick Start Guide
        </h3>
        <ul className="space-y-3.5 text-slate-600 text-sm">
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans text-slate-800 antialiased">
        {toast && (
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
        )}
      
      {/* Mobile Header Block */}
      <div className="md:hidden bg-[#075e54] text-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <Bot size={20} /> Bot Manager
        </div>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-[#054d44] border-0 text-white text-xs font-semibold rounded-lg outline-none p-2 cursor-pointer"
        >
          {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* Styled Functional Sidebar Container */}
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

      {/* Primary Window Viewing Arena */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'contacts' && (
          <Contacts
            contacts={contacts}
            setContacts={setContacts}
            rules={rules}
            setRules={setRules}
            showToast={(message, type = "success") => {

              setToast({
                message,
                type
              });

              setTimeout(() => {
                setToast(null);
              }, 3000);

            }}
          />
        )}
        {activeTab === 'rules' && (
          <Rules rules={rules} setRules={setRules} contacts={contacts} />
        )}
        {activeTab === 'simulator' && (
          <ChatSimulator rules={rules} contacts={contacts} setStats={setStats} replyMode={replyMode} setReplyMode={setReplyMode} />
        )}
        {activeTab === 'inbox' && (
          <Inbox />
        )}
      </main>
    </div>
  );
}