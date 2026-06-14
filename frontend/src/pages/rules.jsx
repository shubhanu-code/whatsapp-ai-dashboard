import { useState } from "react";
import {
  Plus,
  Trash2,
  Users,
  Bot
} from "lucide-react";

import { API_BASE } from "../services/api";

export default function Rules({rules,setRules,contacts}) {
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState('contains');
  const [targetContact, setTargetContact] = useState('all');
  const [reply, setReply] = useState('');
  const handleAddRule = async (e) => {
      e.preventDefault();
      if (!keyword || !reply) return;

      // 1. Create the new rule object
      const newRule = {
        id: Date.now().toString(),
        keyword: keyword.toLowerCase(),
        matchType,
        targetContact,
        reply,
        isActive: true
      };

      const updatedRules = [...rules, newRule];

      // 2. Optimistically update the UI so it feels instantly responsive
      setRules(updatedRules);
      
      // Clear inputs immediately for good UX
      setKeyword('');
      setReply('');
      setTargetContact('all');

      // 3. Try to save to the backend
      try {
        const response = await fetch(`${API_BASE}/rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRules)
        });

        // Throw an error if the server returns a bad status (like 500 or 404)
        if (!response.ok) {
          throw new Error(`Failed to save. Status: ${response.status}`);
        }

      } catch (error) {
        console.error("Error saving rule:", error);
        
        // 4. If it fails, revert the UI back to how it was before they clicked save
        setRules(rules);
        
        // Restore their typed inputs so they don't have to retype everything
        setKeyword(newRule.keyword);
        setReply(newRule.reply);
        setTargetContact(newRule.targetContact);
        
        alert("Failed to save the rule to the server. Please check your connection and try again.");
      }
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
}