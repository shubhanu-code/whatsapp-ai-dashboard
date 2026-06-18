import React, { useState, useEffect, useRef} from "react";
import {
  Bot,
  Search,
  Send,
  Pin,
  Star,
  Image,
  Video,
  FileText,
  Mic,
  Sticker
} from "lucide-react";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../services/api";
import socket from "../services/socket";

const Inbox = ({darkMode}) => {
  const [selectedConversation,setSelectedConversation] = useState(null);
  const [messages,setMessages] =useState([]);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu,setContextMenu] =useState(null);
  const [messageMenu,setMessageMenu] =useState(null);
  const loadMessages = async (
    contactId
  ) => {

    const data =
      await getMessages(contactId);
    setMessages(data);

  };

  useEffect(() => {

    const closeMenu = () => {
      setContextMenu(null);
      setMessageMenu(null);
    };

    window.addEventListener(
      "click",
      closeMenu
    );

    return () =>
      window.removeEventListener(
        "click",
        closeMenu
      );

  }, []);
  useEffect(() => {

    const container =
      messagesContainerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    if (distanceFromBottom < 150) {

      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth"
      });

    }

  }, [messages]);

  const sendReply = async () => {

    if (
      !selectedConversation ||
      !replyText.trim()
    ) {
      return;
    }

    try {

      await sendMessage(
        selectedConversation.contactId,
        replyText
      );

      await loadMessages(
        selectedConversation.contactId
      );

      setReplyText("");

    } catch (err) {

      console.error(err);

    }

  };
  const togglePin = async (
    contactId
  ) => {

    try {

      await fetch(
        `http://localhost:5000/chats/pin/${contactId}`,
        {
          method: "POST"
        }
      );

      const updated =
        await getConversations();

      setConversations(updated);

      setContextMenu(null);

    } catch (err) {

      console.error(err);

    }

  };

  const toggleFavorite = async (
    contactId
  ) => {

    try {

      await fetch(
        `http://localhost:5000/chats/favorite/${contactId}`,
        {
          method: "POST"
        }
      );

      const updated =
        await getConversations();

      setConversations(updated);

      setContextMenu(null);

    } catch (err) {

      console.error(err);

    }

  };

  const markUnread = async (
    contactId
  ) => {

    try {

      await fetch(
        `http://localhost:5000/messages/unread/${contactId}`,
        {
          method: "POST"
        }
      );

      const updated =
        await getConversations();

      setConversations(updated);

      setContextMenu(null);

    } catch (err) {

      console.error(err);

    }

  };


  const deleteMessage = async (
    messageId
  ) => {

    try {

      await fetch(
        `http://localhost:5000/chats/message/${messageId}`,
        {
          method: "DELETE"
        }
      );

      await loadMessages(
        selectedConversation.contactId
      );

      setMessageMenu(null);

    } catch (err) {

      console.error(err);

    }

  };
  const deleteChat = async (contactId) => {
    try {

      await fetch(
        `http://localhost:5000/messages/${contactId}`,
        {
          method: "DELETE"
        }
      );

      const updated =
        await getConversations();

      setConversations(updated);

      setSelectedConversation(null);

      setContextMenu(null);

    } catch (err) {

      console.error(err);

    }

  };

  const [conversations, setConversations] =
    useState([]);

  useEffect(() => {
    getConversations()
    .then(setConversations)
    .catch(console.error);

  }, []);

  useEffect(() => {

    const handler = async () => {

      const updated =
        await getConversations();

      setConversations(updated);

      if (
        selectedConversation
      ) {

        await loadMessages(
          selectedConversation.contactId
        );

      }

    };

    socket.on(
      "new_message",
      handler
    );

    return () => {

      socket.off(
        "new_message",
        handler
      );

    };

  }, [selectedConversation]);


  const filteredConversations =
    conversations
      .filter(conv => {

        const search =
          searchTerm.toLowerCase();

        return (

          conv.contactName
            ?.toLowerCase()
            .includes(search)

          ||

          conv.lastMessage
            ?.toLowerCase()
            .includes(search)

        );

      })
      .sort((a, b) => {

        // Keep pinned chats on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Newest message first
        return (
          new Date(b.timestamp) -
          new Date(a.timestamp)
        );

      });
  const handleDeleteChat = async (contactId) => {

    await deleteChat(contactId);

    setConversations(
      conversations.filter(
        c => c.contactId !== contactId
      )
    );

    if (
      selectedConversation?.contactId === contactId
    ) {
      setSelectedConversation(null);
      setMessages([]);
    }

  };
  const formatDateLabel = (date) => {

    const msgDate =
      new Date(date);

    const today =
      new Date();

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const msgDay =
      msgDate.toDateString();

    if (
      msgDay ===
      today.toDateString()
    ) {
      return "Today";
    }

    if (
      msgDay ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return msgDate.toLocaleDateString();
  };

  const formatConversationTime = (date) => {

    const msgDate = new Date(date);

    const today = new Date();

    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      msgDate.toDateString() ===
      today.toDateString()
    ) {

      return msgDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

    }

    if (
      msgDate.toDateString() ===
      yesterday.toDateString()
    ) {

      return "Yesterday";

    }

    return msgDate.toLocaleDateString([], {
      day: "2-digit",
      month: "short"
    });

  };
  const renderMediaMessage = (message) => {

    switch (message) {

      case "[PHOTO]":
        return (
          <div className="flex items-center gap-2 italic">
            <Image
              size={16}
              className="text-emerald-500 shrink-0"
            />
            <span>Photo</span>
          </div>
        );

      case "[VIDEO]":
        return (
          <div className="flex items-center gap-2 italic">
            <Video
              size={16}
              className="text-purple-500 shrink-0"
            />
            <span>Video</span>
          </div>
        );

      case "[VOICE MESSAGE]":
        return (
          <div className="flex items-center gap-2 italic">
            <Mic
              size={16}
              className="text-sky-500 shrink-0"
            />
            <span>Voice Message</span>
          </div>
        );

      case "[DOCUMENT]":
        return (
          <div className="flex items-center gap-2 italic">
            <FileText
              size={16}
              className="text-amber-500 shrink-0"
            />
            <span>Document</span>
          </div>
        );

      case "[STICKER]":
        return (
          <div className="flex items-center gap-2 italic">
            <Image
              size={16}
              className="text-pink-500 shrink-0"
            />
            <span>Sticker</span>
          </div>
        );

      default:
        return message;
    }

  };

  return (
    <>
    <div className="space-y-4">

      <h1
        className={`
          text-3xl
          font-bold
          mb-6
          ${
            darkMode
              ? "text-white"
              : "text-slate-800"
          }
        `}
      >
        Inbox
      </h1>

      <div
        className={`
          h-[700px]
          transition-all
          duration-300
          rounded-2xl
          overflow-hidden
          shadow-sm
          flex
          border
          ${
            darkMode
            ? "bg-[#202c33] border-[#2a3942]"
            : "bg-white border-slate-100 shadow-sm"
          }
        `}
      >

        {/* Left Panel */}

        <div
          className={`
            w-[32%]
            transition-all
            duration-300
            flex
            flex-col
            border-r
            ${
              darkMode
                ? "bg-[#111b21] border-[#2a3942]"
                : "bg-white border-slate-100"
            }
          `}
        >
    
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search chats..."
              className={`
                w-full
                pl-9
                pr-4
                py-2.5
                rounded-xl
                outline-none
                text-sm
                ${
                  darkMode
                    ? "bg-[#202c33] text-white placeholder:text-slate-400"
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                }
              `}
            />
          </div>
        </div>
        <div
          className={`
            px-4
            py-2
            text-xs
            ${
              darkMode
                ? "text-slate-400"
                : "text-slate-500"
            }
          `}
        >
          {filteredConversations.length} chats
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConversations.map(conv => (

          <div
            key={conv.contactId}

            onClick={async() => {
              setSelectedConversation(conv);

              await fetch(
                `http://localhost:5000/messages/read/${conv.contactId}`,
                {
                  method: "POST"
                }
              );

              await loadMessages(conv.contactId);

              const updated =
                await getConversations();

              setConversations(updated);
            }}

            onContextMenu={(e) => {

              e.preventDefault();

              setContextMenu({
                x: e.pageX,
                y: e.pageY,
                conversation: conv
              });

            }}
            className={`
              border-b
              ${
                darkMode
                  ? "border-[#1a252d]"
                  : "border-slate-100"
              }
              cursor-pointer
              transition-all
              duration-200
              hover:translate-x-1
              ${
                selectedConversation?.contactId === conv.contactId
                  ? (
                      darkMode
                        ? `
                            bg-[#202c33]
                            shadow-[inset_4px_0_0_#25D366]
                          `
                        : `
                          bg-[#f0fdf4]
                          shadow-[inset_4px_0_0_#25D366]
                        `
                    )
                  : (
                      darkMode
                        ? "hover:bg-[#202c33]"
                        : "hover:bg-slate-50"
                    )
              }
            `}
          >
            <div
              className="
                flex
                gap-3
                px-4
                py-4
                min-h-[80px]
                items-start
              "
            >
              <div
                className={`
                  w-11
                  h-11
                  rounded-full
                  flex
                  items-center
                  justify-center
                  font-bold
                  shadow-sm
                  ${
                    darkMode
                      ? "bg-[#d8fdd2] text-[#00684a]"
                      : "bg-emerald-100 text-emerald-700"
                  }
                `}
              >
                {conv.contactName?.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start justify-between w-full">
  
                    <div
                      className={`
                        font-semibold
                        ${
                          darkMode
                            ? "text-white"
                            : "text-slate-800"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">

                        {conv.pinned && (
                          <Pin
                            size={14}
                            className="text-orange-400"
                            fill="currentColor"
                          />
                        )}

                        {conv.favorite && (
                          <Star
                            size={14}
                            className="text-yellow-400"
                            fill="currentColor"
                          />
                        )}

                        <span>
                          {conv.contactName}
                        </span>

                      </div>
                    </div>

                    <div
                      className={`
                        text-[13px]
                        font-medium
                        whitespace-nowrap
                        ${
                          darkMode
                            ? "text-slate-400"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {formatConversationTime(
                        conv.timestamp
                      )}
                    </div>

                  </div>

                  {conv.unreadCount > 0 && (
                    <div
                      className="
                        min-w-[22px]
                        h-[22px]
                        rounded-full
                        bg-[#25D366]
                        text-white
                        text-xs
                        font-bold
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div
                  className={`
                    text-[16px]
                    truncate
                    mt-2
                    ${
                      darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                    }
                  `}
                >
                  {conv.lastMessage === "[PHOTO]"
                    ? "📷 Photo"
                    : conv.lastMessage === "[VIDEO]"
                    ? "🎥 Video"
                    : conv.lastMessage === "[VOICE MESSAGE]"
                    ? "🎵 Voice Message"
                    : conv.lastMessage === "[DOCUMENT]"
                    ? "📄 Document"
                    : conv.lastMessage === "[STICKER]"
                    ? "😀 Sticker"
                    : conv.lastMessage
                  }
                </div>
              </div>
            </div>
          </div> 

          ))}

          </div>
        </div>

        {/* Right Panel */}

        <div
          className={`
            flex-1
            flex
            flex-col
            ${
              darkMode
                ? "bg-[#0b141a]"
                : "bg-[#efeae2]"
            }
          `}
        >

          {!selectedConversation ? (

            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bot size={70} />

              <h3 className="font-semibold text-lg mt-4">
                WhatsApp Inbox
              </h3>

              <p className="text-[15px]">
                Select a conversation to view messages
              </p>
            </div>

          ) : (

            <>
              <div
                className={`
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  text-white
                  ${
                    darkMode
                      ? "bg-[#202c33]"
                      : "bg-white border-b border-slate-200"
                  }
                `}
              >
                <div
                  className={`
                    w-11
                    h-11
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    shrink-0
                    ${
                      darkMode
                        ? "bg-[#d8fdd2] text-[#00684a]"
                        : "bg-emerald-100 text-emerald-700"
                    }
                  `}
                >
                  {selectedConversation.contactName?.charAt(0)}
                </div>

                <div>
                  <h3
                    className={`
                      font-semibold
                      ${
                        darkMode
                          ? "text-white"
                          : "text-slate-800"
                      }
                    `}
                  >
                    {selectedConversation.contactName}
                  </h3>

                  <span
                    className={`
                      inline-block
                      mt-1
                      px-2
                      py-0.5
                      rounded-full
                      text-xs
                      font-medium
                      ${
                        darkMode
                          ? "bg-[#25D366]/20 text-[#25D366]"
                          : "bg-emerald-100 text-emerald-700"
                      }
                    `}
                  >
                    WhatsApp Contact
                  </span>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6"
                style={{
                  backgroundColor: darkMode
                    ? "#0b141a"
                    : undefined,

                  backgroundImage: darkMode
                    ? `
                      radial-gradient(
                        circle,
                        rgba(255,255,255,0.03) 1px,
                        transparent 1px
                      )
                    `
                    : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',

                  backgroundSize: darkMode
                    ? "30px 30px"
                    : "auto"
                }}
                >

                {messages.map((msg, index) => {

                  const previousMsg =
                    index > 0
                      ? messages[index - 1]
                      : null;

                  const sameSender =
                    previousMsg &&
                    previousMsg.direction === msg.direction;

                  const currentDate =
                    formatDateLabel(
                      msg.timestamp
                    );

                  const previousDate =
                    index > 0
                      ? formatDateLabel(
                          messages[index - 1].timestamp
                        )
                      : null;

                  const showDateSeparator =
                    currentDate !== previousDate;

                  return (
                    <React.Fragment key={msg.id}>
                      
                      {showDateSeparator && (

                        <div className="flex justify-center my-4">

                          <div
                            className={`
                              px-4
                              py-1
                              rounded-full
                              text-xs
                              shadow-sm
                              ${
                                darkMode
                                  ? "bg-[#202c33] text-slate-300"
                                  : "bg-white/80 text-slate-600"
                              }
                            `}
                          >
                            {currentDate}
                          </div>

                        </div>

                      )}

                      <div
                          onContextMenu={(e) => {

                          e.preventDefault();

                          setMessageMenu({
                            x: e.pageX,
                            y: e.pageY,
                            message: msg
                          });

                        }}
                        className={`flex mb-0 ${
                          msg.direction === "outgoing"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`
                            max-w-[75%]
                            px-4
                            py-2
                            mt-[2px]
                            ${
                            sameSender
                              ? "rounded-2xl"
                              : (
                                  msg.direction === "outgoing"
                                    ? "rounded-2xl rounded-tr-none"
                                    : "rounded-2xl rounded-tl-none"
                                )
                          }
                            shadow-sm
                            flex
                            items-end
                            justify-between
                            gap-2
                            ${
                              msg.direction === "outgoing"
                                ? (
                                    darkMode
                                      ? `
                                        bg-[#005c4b]
                                        text-white
                                        rounded-tr-none
                                        shadow-lg
                                      `
                                      : "bg-[#d9fdd3] rounded-tr-none"
                                  )
                                : (
                                    darkMode
                                      ? `
                                        bg-[#202c33]/80
                                        backdrop-blur-sm
                                        text-white
                                        rounded-tl-none
                                      `
                                      : "bg-white rounded-tl-none"
                                  )
                            }
                          `}
                        >

                          <div className="break-words">

                            {[
                              "[PHOTO]",
                              "[VIDEO]",
                              "[VOICE MESSAGE]",
                              "[DOCUMENT]",
                              "[STICKER]"
                            ].includes(msg.message)
                              ? renderMediaMessage(msg.message)
                              : msg.message
                            }

                            </div>

                          <span
                            className={`
                              text-[12px]
                              font-medium
                              whitespace-nowrap
                              ${
                                darkMode
                                  ? "text-slate-300"
                                  : "text-slate-500"
                              }
                            `}
                          >
                            {new Date(
                              msg.timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>

                        </div>

                      </div>

                    </React.Fragment>
                  );

                })}
                <div ref={messagesEndRef}></div>
              </div>
              <div
                className={`
                  p-3
                  border-t
                  flex
                  gap-3
                  ${
                    darkMode
                      ? "bg-[#202c33] border-[#2a3942]"
                      : "bg-white border-slate-200"
                  }
                `}
              >

                  <input
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(e.target.value)
                    }
                    placeholder="Type a message..."
                    className={`
                      flex-1
                      border
                      rounded-xl
                      px-4
                      py-2
                      ${
                        darkMode
                          ? "bg-[#2a3942] border-[#3b4a54] text-white placeholder:text-slate-400"
                          : "bg-slate-50 border-slate-200"
                      }
                    `}
                  />

                  <button
                    onClick={sendReply}
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-[#008069]
                      hover:bg-[#006e5a]
                      text-white
                      flex items-center justify-center
                    "
                  >
                    <Send size={18} />
                  </button>

                </div>
            </>

          )}

        </div>

      </div>

    </div>
      {contextMenu && (

    <div
      className={`
      fixed
      z-50
      border
      rounded-xl
      shadow-xl
      py-2
      min-w-[220px]
      ${
        darkMode
          ? "bg-[#202c33] border-[#2a3942] text-white"
          : "bg-white border-slate-200"
      }
    `}
      style={{
        left: contextMenu.x,
        top: contextMenu.y
      }}
    >

      <button
        onClick={() =>
          togglePin(
            contextMenu.conversation.contactId
          )
        }
        className={`
          w-full
          text-left
          px-4
          py-2
          ${
            contextMenu.conversation.pinned
              ? (
                  darkMode
                    ? "hover:bg-orange-900/30 text-orange-400"
                    : "hover:bg-orange-50 text-orange-600"
                )
              : (
                  darkMode
                    ? "hover:bg-[#2a3942]"
                    : "hover:bg-slate-100"
                )
          }
        `}
      >
        {
          contextMenu.conversation.pinned
            ? "📍 Unpin Chat"
            : "📌 Pin Chat"
        }
      </button>

      <button
        onClick={() =>
          toggleFavorite(
            contextMenu.conversation.contactId
          )
        }
        className={`
          w-full
          text-left
          px-4
          py-2
          ${
            darkMode
              ? "hover:bg-yellow-900/30 text-yellow-300"
              : "hover:bg-yellow-50"
          }
        `}
      >
        {
          contextMenu.conversation
            .favorite
            ? "⭐ Remove Favorite"
            : "⭐ Favorite"
        }
      </button>

      <button
        onClick={() =>
          markUnread(
            contextMenu.conversation.contactId
          )
        }
        className={`
          w-full
          text-left
          px-4
          py-2
          ${
            darkMode
              ? "hover:bg-[#2a3942]"
              : "hover:bg-slate-100"
          }
        `}
      >
        👁 Mark Unread
      </button>

      <button
        onClick={() => {

          setDeleteConfirm(
            contextMenu.conversation
          );

          setContextMenu(null);

        }}
        className={`
          w-full
          text-left
          px-4
          py-2
          ${
            darkMode
              ? "hover:bg-red-900/30 text-red-400"
              : "hover:bg-red-50 text-red-600"
          }
        `}
      >
        🗑 Delete Chat
      </button>

    </div>

  )}
      {messageMenu && (

      <div
        className={`
        fixed
        z-50
        border
        rounded-xl
        shadow-xl
        py-2
        min-w-[220px]
        ${
          darkMode
            ? "bg-[#202c33] border-[#2a3942] text-white"
            : "bg-white border-slate-200"
        }
      `}
        style={{
          left: messageMenu.x,
          top: messageMenu.y
        }}
      >

        <button
          onClick={() => {

            navigator.clipboard.writeText(
              messageMenu.message.message
            );

            setMessageMenu(null);

          }}
          className={`
            w-full
            text-left
            px-4
            py-2
            ${
              darkMode
                ? "hover:bg-[#2a3942]"
                : "hover:bg-slate-100"
            }
          `}
        >
          📋 Copy Message
        </button>

        <button
          onClick={() =>
            deleteMessage(
              messageMenu.message.id
            )
          }
          className={`
            w-full
            text-left
            px-4
            py-2
            ${
              darkMode
                ? "hover:bg-red-900/30 text-red-400"
                : "hover:bg-red-50 text-red-600"
            }
          `}
        >
          🗑 Delete Message
        </button>

      </div>

    )}
  {deleteConfirm && (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">

      <div
        className={`
          rounded-2xl
          p-6
          w-[400px]
          shadow-xl
          ${
            darkMode
              ? "bg-[#111b21] text-white"
              : "bg-white"
          }
        `}
      >

        <h3 className="text-lg font-semibold">
          Delete Chat
        </h3>

        <p
          className={`
            mt-2
            ${
              darkMode
                ? "text-slate-400"
                : "text-slate-500"
            }
          `}
        >
          Delete conversation with
          <span className="font-medium">
            {" "}
            {deleteConfirm.contactName}
          </span>
          ?
        </p>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={() =>
              setDeleteConfirm(null)
            }
            className={`
              px-4
              py-2
              rounded-xl
              border
              ${
                darkMode
                  ? "border-[#3b4a54] bg-[#202c33] text-white hover:bg-[#2a3942]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }
            `}
          >
            Cancel
          </button>

          <button
            onClick={async () => {

              await handleDeleteChat(
                deleteConfirm.contactId
              );

              setDeleteConfirm(null);

            }}
            className="px-4 py-2 rounded-xl bg-red-600 text-white"
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