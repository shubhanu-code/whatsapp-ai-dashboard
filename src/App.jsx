import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Plus,
  Trash2,
  Send,
  Bot,
  User,
  CheckCircle2,
  SquareCode
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPLY_MODES = new Set(['rules', 'ai', 'smart']);

const INITIAL_RULES = [];

const INITIAL_CONTACTS = [];

const ContactManager = ({ contacts, setContacts, rules, setRules }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappId, setWhatsappId] = useState('');

  const saveContacts = async (updatedContacts) => {
    const response = await fetch(
      "http://localhost:5000/contacts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedContacts)
      }
    );

  };

  const saveAllowedContacts = async (updatedContacts) => {
    const allowed = updatedContacts
      .filter(c => c.botEnabled && c.whatsappId)
      .map(c => c.whatsappId);

    await fetch(
      `${API_BASE}/allowed-contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allowed)
      }
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    const updatedContacts = [
      ...contacts,
      {
        id: Date.now().toString(),
        name,
        phone,
        whatsappId,
        botEnabled: false
      }
    ];
    setContacts(updatedContacts);
    await saveContacts(updatedContacts);
    setName('');
    setPhone('');
    setWhatsappId('');
  };

  const handleDelete = async (id) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    const updatedRules = rules.map(r => r.targetContact === id ? { ...r, targetContact: 'all' } : r);

    setContacts(updatedContacts);
    setRules(updatedRules);

    await Promise.all([
      saveContacts(updatedContacts),
      saveAllowedContacts(updatedContacts),
      fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRules)
      })
    ]);
  };

  const toggleBot = async (id) => {
    const updated = contacts.map(c =>
      c.id === id ? { ...c, botEnabled: !c.botEnabled } : c
    );

    setContacts(updated);

    await Promise.all([
      saveContacts(updated),
      saveAllowedContacts(updated)
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight border-b border-slate-200 pb-4">Contact Manager</h2>

      <div className="bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-[15px] font-semibold text-slate-700 mb-4">Add New Contact</h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3.5">
          <input
            type="text" placeholder="Contact Name" value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all placeholder-slate-400"
          />
          <input
            type="text" placeholder="Phone Number (e.g. +1234567890)" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all placeholder-slate-400"
          />
          <input
            type="text"
            placeholder="WhatsApp ID"
            value={whatsappId}
            onChange={(e) => setWhatsappId(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all"
          />
          <button type="submit" className="bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-700/10">
            <Plus size={16} /> Add Contact
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Bot</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400 font-medium">No contacts found. Add one above.</td>
              </tr>
            ) : contacts.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#008069] flex items-center justify-center font-semibold">
                      <User size={15} />
                    </div>
                    {c.name}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">{c.phone}</td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleBot(c.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.botEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.botEnabled ? "ON" : "OFF"}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button 
                    type="button"
                    onClick={() => handleDelete(c.id)} 
                    className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 active:scale-95 transition-all">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RuleBuilder = ({ rules, setRules, contacts }) => {
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState('contains');
  const [targetContact, setTargetContact] = useState('all');
  const [reply, setReply] = useState('');
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!keyword || !reply) return;

    const updatedRules = [
      ...rules,
      {
        id: Date.now().toString(),
        keyword: keyword.toLowerCase(),
        matchType,
        targetContact,
        reply,
        isActive: true
      }
    ];

    setRules(updatedRules);

    await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules)
    });

    setKeyword('');
    setReply('');
    setTargetContact('all');
  };

  const toggleRule = async (id) => {
    const updatedRules = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRules(updatedRules);
    await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules)
    });
  };

  const deleteRule = async (id) => {
    const updatedRules = rules.filter(r => r.id !== id);
    setRules(updatedRules);
    await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules)
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight border-b border-slate-200 pb-4">Auto-Reply Rules</h2>

      <div className="bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-[15px] font-semibold text-slate-700 mb-4">Create New Rule</h3>
        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Trigger Keyword</label>
              <input
                type="text" placeholder="e.g. 'pricing' or 'hi'" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Match Type</label>
              <select
                value={matchType} onChange={(e) => setMatchType(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all text-slate-700 cursor-pointer"
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains Word</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Condition (Who to reply to)</label>
              <select
                value={targetContact} onChange={(e) => setTargetContact(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all text-slate-700 cursor-pointer"
              >
                <option value="all">Everyone (All Contacts & Unknown)</option>
                {contacts.map(c => <option key={c.id} value={c.id}>Only {c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Auto-Reply Message</label>
            <textarea
              placeholder="Type the message the bot will send..." value={reply} onChange={(e) => setReply(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all resize-none placeholder-slate-400"
            ></textarea>
          </div>
          <button type="submit" className="bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm w-full md:w-auto">
            <Plus size={16} /> Save Rule
          </button>
        </form>
      </div>

      <div className="grid gap-3.5">
        {rules.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-lg border border-slate-200/60 text-sm text-slate-400 font-medium">
            No active rules. Create one to start automating replies.
          </div>
        ) : rules.map(rule => {
          const targetName = rule.targetContact === 'all' ? 'Everyone' : (contacts.find(c => c.id === rule.targetContact)?.name || 'Unknown Contact');
          return (
            <div key={rule.id} className={`bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all ${!rule.isActive && 'opacity-55 grayscale-[30%]'}`}>
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-50 text-[#008069] px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100 font-mono">
                    IF {rule.matchType === 'exact' ? 'EXACT' : 'CONTAINS'}: "{rule.keyword}"
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Users size={12} className="text-slate-400" /> Applies to: <b className="text-slate-600 font-semibold">{targetName}</b>
                  </span>
                </div>
                <div className="bg-[#f0f2f5]/70 text-[#111b21] p-3 rounded-xl text-[14px] flex gap-2.5 border border-slate-100">
                  <Bot size={16} className="text-[#008069] shrink-0 mt-0.5" />
                  <p className="italic">"{rule.reply}"</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 mt-1 md:mt-0">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                    rule.isActive
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/40'
                      : 'bg-emerald-50 text-[#008069] hover:bg-emerald-100/80 border border-emerald-200/40'
                  }`}
                >
                  {rule.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 active:scale-95 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
        'http://localhost:5000/ai-reply',
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
            <span>Add contacts and enable the bot for approved WhatsApp IDs inside the <span className="text-emerald-600 font-bold">Contacts</span> tab.</span>
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
          <ContactManager contacts={contacts} setContacts={setContacts} rules={rules} setRules={setRules} />
        )}
        {activeTab === 'rules' && (
          <RuleBuilder rules={rules} setRules={setRules} contacts={contacts} />
        )}
        {activeTab === 'simulator' && (
          <ChatSimulator rules={rules} contacts={contacts} setStats={setStats} replyMode={replyMode} setReplyMode={setReplyMode} />
        )}
      </main>
    </div>
  );
}