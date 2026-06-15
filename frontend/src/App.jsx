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
  Sun,
  Moon,
  X
} from 'lucide-react';

import Inbox from "./pages/Inbox.jsx";
import Contacts from "./pages/Contacts.jsx";
import Rules from "./pages/Rules.jsx";
import Simulator from './pages/Simulator';
import Overview from "./pages/Overview";
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPLY_MODES = new Set(['rules', 'ai', 'smart']);

const INITIAL_RULES = [];

const INITIAL_CONTACTS = [];


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
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");



  useEffect(() => {
    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  
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

  return (
    <div
      className={`
        min-h-screen
        flex
        flex-col
        md:flex-row
        font-sans
        antialiased
        transition-colors
        duration-300
        ${
          darkMode
            ? "bg-[#0b141a] text-white"
            : "bg-[#f8f9fa] text-slate-800"
        }
      `}
    >
        <Toast
          toast={toast}
          setToast={setToast}
        />
      
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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Primary Window Viewing Arena */}
      <main
      
        className={`
          flex-1
          p-6
          md:p-8
          overflow-y-auto
          ${
            darkMode
              ? "bg-[#0b141a]"
              : ""
          }
        `}
      >
        <div className="flex justify-end mb-4">

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className={`
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              transition-all
              ${
                darkMode
                  ? "bg-[#202c33] text-white hover:bg-[#2a3942]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }
            `}
          >

            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            <span>
              {darkMode
                ? "Light Mode"
                : "Dark Mode"}
            </span>

          </button>

        </div>
        {activeTab === 'overview' && <Overview
                                        rules={rules}
                                        contacts={contacts}
                                        stats={stats}
                                        replyMode={replyMode}
                                        setReplyMode={setReplyMode}
                                      />}
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
          <Simulator rules={rules} contacts={contacts} setStats={setStats} replyMode={replyMode} setReplyMode={setReplyMode} />
        )}
        {activeTab === 'inbox' && (
          <Inbox
            darkMode={darkMode}
          />
        )}
      </main>
    </div>
  );
}