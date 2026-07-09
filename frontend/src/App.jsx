import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Send,
  Bot,
  SquareCode,
  Sun,
  Moon,
  Settings2,
  BarChart3
} from 'lucide-react';

import Inbox from "./pages/Inbox.jsx";
import Contacts from "./pages/Contacts.jsx";
import Rules from "./pages/Rules.jsx";
import Simulator from './pages/Simulator';
import Overview from "./pages/Overview";
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPLY_MODES = new Set(['rules', 'ai', 'smart']);

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ messagesSent: 0, messagesReceived: 0 });
  const [replyMode, setReplyMode] = useState("smart");
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Theme Choice
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Unified Dashboard Polling Poller
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [rulesRes, contactsRes, settingsRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE}/rules`),
          fetch(`${API_BASE}/contacts`),
          fetch(`${API_BASE}/settings`),
          fetch(`${API_BASE}/analytics`)
        ]);

        const [savedRules, savedContacts, savedSettings, analytics] = await Promise.all([
          rulesRes.json(),
          contactsRes.json(),
          settingsRes.json(),
          analyticsRes.json()
        ]);

        if (Array.isArray(savedRules)) setRules(savedRules);
        if (Array.isArray(savedContacts)) setContacts(savedContacts);
        
        if (savedSettings && REPLY_MODES.has(savedSettings.replyMode)) {
          setReplyMode(savedSettings.replyMode);
        }

        if (analytics) {
          setStats({
            messagesSent: analytics.messagesSent || 0,
            messagesReceived: analytics.messagesReceived || 0
          });
        }
      } catch (err) {
        console.warn("Could not fetch sync data from backend service cluster:", err);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update Reply Mode on Server Settings Persistence Layer
  const handleReplyModeChange = async (newMode) => {
    if (!REPLY_MODES.has(newMode)) return;
    setReplyMode(newMode);
    try {
      await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMode: newMode })
      });
      showToast(`Reply mode changed to ${newMode}`);
    } catch (err) {
      console.error("Failed to persist updated auto-reply mode configuration state:", err);
      showToast("Failed to save mode change to database.", "error");
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'rules', label: 'Auto-Reply Rules', icon: SquareCode },
    { id: 'simulator', label: 'Chat Simulator', icon: Smartphone },
    { id: 'inbox', label: 'Inbox', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings2 }
  ];

  return (
    <div className={`
      ${darkMode ? "dark" : ""} 
      min-h-screen flex flex-col md:flex-row font-sans antialiased transition-colors duration-300
      ${darkMode ? "bg-[#0b141a] text-white" : "bg-[#f8f9fa] text-slate-800"}
    `}>
      <Toast toast={toast} setToast={setToast} />
      
      {/* Mobile Top Header Viewport */}
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

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Panel Viewport Window Container */}
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto ${darkMode ? "bg-[#0b141a]" : ""}`}>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
              darkMode 
                ? "bg-[#202c33] text-white hover:bg-[#2a3942]" 
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        {activeTab === 'overview' && (
          <Overview
            darkMode={darkMode}
            rules={rules}
            contacts={contacts}
            stats={stats}
            replyMode={replyMode}
            setReplyMode={handleReplyModeChange}
          />
        )}
        
        {activeTab === 'contacts' && (
          <Contacts
            darkMode={darkMode}
            contacts={contacts}
            setContacts={setContacts}
            rules={rules}
            setRules={setRules}
            showToast={showToast}
          />
        )}

        {activeTab === 'rules' && (
          <Rules 
            darkMode={darkMode} 
            rules={rules} 
            setRules={setRules} 
            contacts={contacts} 
            showToast={showToast}
          />
        )}

        {activeTab === 'simulator' && (
          <Simulator 
            darkMode={darkMode} 
            rules={rules} 
            contacts={contacts} 
            setStats={setStats} 
            replyMode={replyMode} 
          />
        )}

        {activeTab === 'inbox' && <Inbox darkMode={darkMode} />}
        {activeTab === 'analytics' && <Analytics darkMode={darkMode} />}
        {activeTab === 'settings' && <Settings darkMode={darkMode} showToast={showToast} />}
      </main>
    </div>
  );
}