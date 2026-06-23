import { useState, useEffect, useRef } from 'react';
import { Bot, Send } from 'lucide-react';
import { API_BASE } from '../services/api';

export default function Simulator({rules,contacts,setStats,replyMode,setReplyMode,darkMode}) {
  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'bot', text: 'Simulator ready. Send a message to test your rules.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputText, setInputText] = useState('');
  const [impersonatePhone, setImpersonatePhone] = useState('unknown');
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
        rule.targetContact === impersonatePhone;
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
          Chat Simulator
        </h1>
        <div
          className={`
            flex items-center gap-3 p-1.5 px-3 rounded-xl border shadow-sm
            ${
              darkMode
                ? "bg-[#111b21] border-[#202c33]"
                : "bg-white border-slate-200"
            }
          `}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulate As:</span>
          <select
            value={impersonatePhone} onChange={(e) => setImpersonatePhone(e.target.value)}
            className="px-2 py-1 border-0 rounded-lg text-sm font-medium focus:ring-0 outline-none bg-transparent text-slate-700 cursor-pointer"
          >
            <option value="unknown">Unknown Number</option>
            {contacts.map(c =>
              <option
                key={c.phoneNumber}
                value={c.phoneNumber}
              >
                {c.name}
              </option>
            )}
          </select>
        </div>
      </div>

      <div
        className={`
          flex-1 rounded-lg overflow-hidden border shadow-sm flex flex-col relative
          ${
            darkMode
              ? "bg-[#0b141a] border-[#202c33]"
              : "bg-[#efeae2] border-slate-200/80"
          }
        `}
      >
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
          className={`
            flex-1 overflow-y-auto p-6 space-y-3.5
            ${
              darkMode
                ? "bg-[#0b141a]"
                : ""
            }
          `}
          style={{
            backgroundImage: darkMode
              ? "radial-gradient(circle at center, rgba(255,255,255,0.03) 1px, transparent 1px)"
              : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundSize: darkMode ? "24px 24px" : "auto"
          }}
        >
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl px-3.5 py-2 shadow-sm relative text-[14.5px] leading-normal ${
                msg.sender === 'user'
                  ? (
                      darkMode
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                    )
                  : (
                      darkMode
                        ? 'bg-[#202c33] text-white rounded-tl-none'
                        : 'bg-white text-[#111b21] rounded-tl-none'
                    )
              }`}>
                <p>{msg.text}</p>
                <span className="text-[10px] text-slate-400 block text-right mt-1 font-mono tracking-tighter">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div
          className={`
            p-3.5 border-t z-10
            ${
              darkMode
                ? "bg-[#202c33] border-[#2a3942]"
                : "bg-[#f0f2f5] border-slate-200/60"
            }
          `}
        >
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
}