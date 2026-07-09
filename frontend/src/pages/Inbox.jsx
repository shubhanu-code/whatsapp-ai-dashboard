import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Bot, Search, Send, Pin, Star, Image, Video, FileText, Mic } from "lucide-react";
import { API_BASE, getConversations, getMessages, sendMessage } from "../services/api";
import socket from "../services/socket";

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDIA_TYPES = {
  "[PHOTO]":         { icon: Image,    color: "text-emerald-500", label: "Photo" },
  "[VIDEO]":         { icon: Video,    color: "text-purple-500",  label: "Video" },
  "[VOICE MESSAGE]": { icon: Mic,      color: "text-sky-500",     label: "Voice Message" },
  "[DOCUMENT]":      { icon: FileText, color: "text-amber-500",  label: "Document" },
  "[STICKER]":       { icon: Image,    color: "text-pink-500",    label: "Sticker" },
};

const MEDIA_PREVIEWS = {
  "[PHOTO]":         "📷 Photo",
  "[VIDEO]":         "🎥 Video",
  "[VOICE MESSAGE]": "🎵 Voice Message",
  "[DOCUMENT]":      "📄 Document",
  "[STICKER]":       "😀 Sticker",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateLabel(date) {
  const msgDate   = new Date(date);
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (msgDate.toDateString() === today.toDateString())     return "Today";
  if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return msgDate.toLocaleDateString();
}

function formatConversationTime(date) {
  const msgDate   = new Date(date);
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (msgDate.toDateString() === today.toDateString()) {
    return msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return msgDate.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function renderMediaMessage(message) {
  const media = MEDIA_TYPES[message];
  if (!media) return message;
  const Icon = media.icon;
  return (
    <div className="flex items-center gap-2 italic">
      <Icon size={16} className={`${media.color} shrink-0`} />
      <span>{media.label}</span>
    </div>
  );
}

// ── Reusable UI components ────────────────────────────────────────────────────

function Avatar({ name, darkMode, size = "w-11 h-11" }) {
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold shrink-0 ${
        darkMode
          ? "bg-[#d8fdd2] text-[#00684a]"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {name?.charAt(0)}
    </div>
  );
}

function ContextMenuButton({ onClick, darkMode, hoverClass, textClass = "", children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 ${textClass} ${
        darkMode ? hoverClass.dark : hoverClass.light
      }`}
    >
      {children}
    </button>
  );
}

// Enforce safe boundary checks for window edges
function FloatingMenu({ x, y, darkMode, children }) {
  const adjustedX = window.innerWidth - x < 240 ? x - 220 : x;
  const adjustedY = window.innerHeight - y < 200 ? y - 160 : y;

  return (
    <div
      className={`fixed z-50 border rounded-xl shadow-xl py-2 min-w-[220px] ${
        darkMode
          ? "bg-[#202c33] border-[#2a3942] text-white"
          : "bg-white border-slate-200"
      }`}
      style={{ left: adjustedX, top: adjustedY }}
    >
      {children}
    </div>
  );
}

const MessageList = React.memo(function MessageList({ messages, darkMode, onContextMenu }) {
  return (
    <>
      {messages.map((msg, index) => {
        const prevMsg      = index > 0 ? messages[index - 1] : null;
        const sameSender   = prevMsg?.direction === msg.direction;
        const currentDate  = formatDateLabel(msg.timestamp);
        const previousDate = prevMsg ? formatDateLabel(prevMsg.timestamp) : null;
        const showDateSep  = currentDate !== previousDate;
        const isOutgoing   = msg.direction === "outgoing";
        const isMedia      = msg.message in MEDIA_TYPES;

        return (
          <React.Fragment key={msg.id}>
            {showDateSep && (
              <div className="flex justify-center my-4">
                <div
                  className={`px-4 py-1 rounded-full text-xs shadow-sm ${
                    darkMode
                      ? "bg-[#202c33] text-slate-300"
                      : "bg-white/80 text-slate-600"
                  }`}
                >
                  {currentDate}
                </div>
              </div>
            )}

            <div
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu({ x: e.clientX, y: e.clientY, message: msg });
              }}
              className={`flex w-full min-w-0 mb-0 ${isOutgoing ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] min-w-0 px-4 py-2 mt-[2px] shadow-sm flex items-end justify-between gap-2 ${
                  sameSender
                    ? "rounded-2xl"
                    : isOutgoing
                    ? "rounded-2xl rounded-tr-none"
                    : "rounded-2xl rounded-tl-none"
                } ${
                  isOutgoing
                    ? darkMode
                      ? "bg-[#005c4b] text-white rounded-tr-none shadow-lg"
                      : "bg-[#d9fdd3] rounded-tr-none"
                    : darkMode
                    ? "bg-[#202c33]/80 backdrop-blur-sm text-white rounded-tl-none"
                    : "bg-white rounded-tl-none"
                }`}
              >
                <div className="break-words [overflow-wrap:anywhere] min-w-0">
                  {isMedia ? renderMediaMessage(msg.message) : msg.message}
                </div>

                <span
                  className={`text-[12px] font-medium whitespace-nowrap ${
                    darkMode ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour:   "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

const Inbox = ({ darkMode }) => {
  const [conversations,        setConversations]        = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages,             setMessages]             = useState([]);
  const [replyText,            setReplyText]            = useState("");
  const [searchTerm,           setSearchTerm]           = useState("");
  const [contextMenu,          setContextMenu]          = useState(null);
  const [messageMenu,          setMessageMenu]          = useState(null);
  const [deleteConfirm,        setDeleteConfirm]        = useState(null);

  const messagesEndRef       = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef          = useRef(null);
  const selectedConversationRef = useRef(null);
  const refreshTimerRef      = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Handle auto-growing input height based on lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyText]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setMessageMenu(null);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 150) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    getConversations().then(setConversations).catch(console.error);
  }, []);

  // Fixed closure implementation for reliable cross-chat real-time syncing
  useEffect(() => {
    const refreshNow = async () => {
      try {
        const updated = await getConversations();
        setConversations(updated);
        
        const current = selectedConversationRef.current;
        if (current) {
          const data = await getMessages(current.phoneNumber);
          setMessages(data);

          const matchedActiveChat = updated.find(
            (c) => c.phoneNumber === current.phoneNumber
          );

          if (matchedActiveChat) {
            setSelectedConversation(matchedActiveChat);
          }
        }
      } catch (err) {
        console.error("Failed to sync socket update:", err);
      }
    };

    const handler = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(refreshNow, 300);
    };

    socket.on("new_message", handler);
    return () => {
      socket.off("new_message", handler);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ── Chat actions ─────────────────────────────────────────────────────────────

  async function loadMessages(phoneNumber) {
    const data = await getMessages(phoneNumber);
    setMessages(data);
  }

  async function refreshConversations() {
    const updated = await getConversations();
    setConversations(updated);
  }

  async function sendReply() {
    if (!selectedConversation || !replyText.trim()) return;
    try {
      const textToSend = replyText;
      setReplyText(""); // Reset layout instantly for snappy feel
      await sendMessage(selectedConversation.phoneNumber, textToSend);
      await loadMessages(selectedConversation.phoneNumber);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendReply();
    }
  }

  async function chatAction(url, method = "POST") {
    await fetch(`${API_BASE}${url}`, { method });
    await refreshConversations();
    setContextMenu(null);
  }

  async function selectConversation(conv) {
    setSelectedConversation(conv);
    await Promise.all([
      fetch(`${API_BASE}/messages/read/${conv.phoneNumber}`, { method: "POST" }),
      loadMessages(conv.phoneNumber),
    ]);
    await refreshConversations();
  }

  async function togglePin(phoneNumber) {
    await chatAction(`/chats/pin/${phoneNumber}`);
  }

  async function toggleFavorite(phoneNumber) {
    await chatAction(`/chats/favorite/${phoneNumber}`);
  }

  async function markUnread(phoneNumber) {
    await chatAction(`/messages/unread/${phoneNumber}`);
  }

  async function deleteMessage(messageId) {
    try {
      await fetch(`${API_BASE}/chats/message/${messageId}`, { method: "DELETE" });
      await loadMessages(selectedConversation.phoneNumber);
      setMessageMenu(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteChat(phoneNumber) {
    try {
      await fetch(`${API_BASE}/messages/${phoneNumber}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.phoneNumber !== phoneNumber));
      if (selectedConversation?.phoneNumber === phoneNumber) {
        setSelectedConversation(null);
        setMessages([]);
      }
      setContextMenu(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conv) => !conv.phoneNumber?.includes("@g.us"))
      .filter((conv) => {
        const search = searchTerm.toLowerCase();
        return (
          (conv.contactName || "").toLowerCase().includes(search) ||
          (conv.lastMessage  || "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [conversations, searchTerm]);

  const openMessageMenu = useCallback((menu) => setMessageMenu(menu), []);

  return (
    <>
      <div className="space-y-4">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-slate-800"}`}>
          Inbox
        </h1>

        <div
          className={`h-[700px] transition-all duration-300 rounded-2xl overflow-hidden shadow-sm flex border ${
            darkMode ? "bg-[#202c33] border-[#2a3942]" : "bg-white border-slate-100 shadow-sm"
          }`}
        >
          {/* Left panel */}
          <div
            className={`w-[32%] min-w-0 transition-all duration-300 flex flex-col border-r ${
              darkMode ? "bg-[#111b21] border-[#2a3942]" : "bg-white border-slate-100"
            }`}
          >
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chats..."
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm ${
                    darkMode
                      ? "bg-[#202c33] text-white placeholder:text-slate-400"
                      : "bg-slate-50 border border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className={`px-4 py-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {filteredConversations.length} chats
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.phoneNumber === conv.phoneNumber;
                return (
                  <div
                    key={conv.phoneNumber}
                    onClick={() => selectConversation(conv)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, conversation: conv });
                    }}
                    className={`border-b cursor-pointer transition-all duration-200 hover:translate-x-1 ${
                      darkMode ? "border-[#1a252d]" : "border-slate-100"
                    } ${
                      isSelected
                        ? darkMode
                          ? "bg-[#202c33] shadow-[inset_4px_0_0_#25D366]"
                          : "bg-[#f0fdf4] shadow-[inset_4px_0_0_#25D366]"
                        : darkMode
                        ? "hover:bg-[#202c33]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3 px-4 py-4 min-h-[80px] items-start">
                      <Avatar name={conv.contactName} darkMode={darkMode} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
                            <div className="flex items-center gap-2">
                              {conv.pinned && (
                                <Pin size={14} className="text-orange-400" fill="currentColor" />
                              )}
                              {conv.favorite && (
                                <Star size={14} className="text-yellow-400" fill="currentColor" />
                              )}
                              <span>{conv.contactName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[13px] font-medium whitespace-nowrap ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                              {formatConversationTime(conv.timestamp)}
                            </span>
                            {conv.unreadCount > 0 && (
                              <div className="min-w-[22px] h-[22px] rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center">
                                {conv.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`text-[14px] truncate mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {MEDIA_PREVIEWS[conv.lastMessage] ?? conv.lastMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className={`flex-1 min-w-0 flex flex-col ${darkMode ? "bg-[#0b141a]" : "bg-[#efeae2]"}`}>
            {!selectedConversation ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bot size={70} />
                <h3 className="font-semibold text-lg mt-4">WhatsApp Inbox</h3>
                <p className="text-[15px]">Select a conversation to view messages</p>
              </div>
            ) : (
              <>
                <div className={`px-4 py-3 flex items-center gap-3 ${darkMode ? "bg-[#202c33]" : "bg-white border-b border-slate-200"}`}>
                  <Avatar name={selectedConversation.contactName} darkMode={darkMode} />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
                      {selectedConversation.contactName}
                    </h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? "bg-[#25D366]/20 text-[#25D366]" : "bg-emerald-100 text-emerald-700"}`}>
                      WhatsApp Contact
                    </span>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6"
                  style={{
                    backgroundColor: darkMode ? "#0b141a" : undefined,
                    backgroundImage: darkMode
                      ? "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
                      : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundSize: darkMode ? "30px 30px" : "auto",
                  }}
                >
                  <MessageList
                    messages={messages}
                    darkMode={darkMode}
                    onContextMenu={openMessageMenu}
                  />
                  <div ref={messagesEndRef} />
                </div>

                <div className={`p-3 border-t flex gap-3 items-end ${darkMode ? "bg-[#202c33] border-[#2a3942]" : "bg-white border-slate-200"}`}>
                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send • Shift+Enter for newline)"
                    rows={1}
                    className={`flex-1 border rounded-xl px-4 py-2.5 resize-none max-h-[120px] overflow-y-auto outline-none text-sm leading-relaxed ${
                      darkMode
                        ? "bg-[#2a3942] border-[#3b4a54] text-white placeholder:text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                  <button
                    onClick={sendReply}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#008069] hover:bg-[#006e5a] text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conversation right-click context menu */}
      {contextMenu && (
        <FloatingMenu x={contextMenu.x} y={contextMenu.y} darkMode={darkMode}>
          <ContextMenuButton
            onClick={() => togglePin(contextMenu.conversation.phoneNumber)}
            darkMode={darkMode}
            hoverClass={{
              dark:  contextMenu.conversation.pinned ? "hover:bg-orange-900/30 text-orange-400" : "hover:bg-[#2a3942]",
              light: contextMenu.conversation.pinned ? "hover:bg-orange-50 text-orange-600"     : "hover:bg-slate-100",
            }}
          >
            {contextMenu.conversation.pinned ? "📍 Unpin Chat" : "📌 Pin Chat"}
          </ContextMenuButton>

          <ContextMenuButton
            onClick={() => toggleFavorite(contextMenu.conversation.phoneNumber)}
            darkMode={darkMode}
            hoverClass={{ dark: "hover:bg-yellow-900/30 text-yellow-300", light: "hover:bg-yellow-50" }}
          >
            {contextMenu.conversation.favorite ? "⭐ Remove Favorite" : "⭐ Favorite"}
          </ContextMenuButton>

          <ContextMenuButton
            onClick={() => markUnread(contextMenu.conversation.phoneNumber)}
            darkMode={darkMode}
            hoverClass={{ dark: "hover:bg-[#2a3942]", light: "hover:bg-slate-100" }}
          >
            👁 Mark Unread
          </ContextMenuButton>

          <ContextMenuButton
            onClick={() => {
              setDeleteConfirm(contextMenu.conversation);
              setContextMenu(null);
            }}
            darkMode={darkMode}
            hoverClass={{ dark: "hover:bg-red-900/30 text-red-400", light: "hover:bg-red-50 text-red-600" }}
          >
            🗑 Delete Chat
          </ContextMenuButton>
        </FloatingMenu>
      )}

      {/* Message right-click context menu */}
      {messageMenu && (
        <FloatingMenu x={messageMenu.x} y={messageMenu.y} darkMode={darkMode}>
          <ContextMenuButton
            onClick={() => {
              navigator.clipboard.writeText(messageMenu.message.message);
              setMessageMenu(null);
            }}
            darkMode={darkMode}
            hoverClass={{ dark: "hover:bg-[#2a3942]", light: "hover:bg-slate-100" }}
          >
            📋 Copy Message
          </ContextMenuButton>

          <ContextMenuButton
            onClick={() => deleteMessage(messageMenu.message.id)}
            darkMode={darkMode}
            hoverClass={{ dark: "hover:bg-red-900/30 text-red-400", light: "hover:bg-red-50 text-red-600" }}
          >
            🗑 Delete Message
          </ContextMenuButton>
        </FloatingMenu>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className={`rounded-2xl p-6 w-[400px] shadow-xl ${darkMode ? "bg-[#111b21] text-white" : "bg-white"}`}>
            <h3 className="text-lg font-semibold">Delete Chat</h3>
            <p className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Delete conversation with <span className="font-medium">{deleteConfirm.contactName}</span>?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 rounded-xl border ${
                  darkMode
                    ? "border-[#3b4a54] bg-[#202c33] text-white hover:bg-[#2a3942]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteChat(deleteConfirm.phoneNumber)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Inbox;