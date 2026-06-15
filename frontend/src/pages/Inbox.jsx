import { useState, useEffect } from "react";
import {
  Bot,
  Search,
  Send
} from "lucide-react";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../services/api";
const Inbox = () => {
  const [selectedConversation,setSelectedConversation] = useState(null);
  const [messages,setMessages] =useState([]);
  const [replyText, setReplyText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [contextMenu, setContextMenu] =useState(null);
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
  return (
    <>
    <div className="space-y-4">

      <h2 className="text-xl font-bold text-slate-800">
        Inbox
      </h2>

      <div className="h-[700px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex">

        {/* Left Panel */}

        <div className="w-[32%] border-r border-slate-200 flex flex-col bg-white">
    
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search chats..."
              className="
                w-full
                pl-9
                pr-4
                py-2.5
                rounded-xl
                bg-slate-100
                outline-none
                text-sm
              "
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">

          {conversations.map(conv => (

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

              loadMessages(conv.contactId);

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
              px-4 py-4
              border-b
              border-slate-100
              cursor-pointer
              transition-all
              ${
                selectedConversation?.contactId === conv.contactId
                  ? "bg-[#e7f4f0]"
                  : "hover:bg-slate-50"
              }
            `}
          >
            <div className="flex gap-3">
              <div
                className="
                  w-11 h-11
                  rounded-full
                  bg-emerald-100
                  text-emerald-700
                  flex items-center justify-center
                  font-bold
                "
              >
                {conv.contactName?.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">
                    {conv.contactName}
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

                <div className="text-sm text-slate-500 truncate mt-1">
                  {conv.lastMessage}
                </div>
              </div>
            </div>
          </div> 

          ))}

          </div>
        </div>

        {/* Right Panel */}

        <div className="flex-1 flex flex-col bg-[#efeae2]">

          {!selectedConversation ? (

            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bot size={70} />

              <h3 className="font-semibold text-lg mt-4">
                WhatsApp Inbox
              </h3>

              <p className="text-sm">
                Select a conversation to view messages
              </p>
            </div>

          ) : (

            <>
              <div className="bg-[#008069] text-white px-5 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center font-semibold">
                  {selectedConversation.contactName?.charAt(0)}
                </div>

                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.contactName}
                  </h3>

                  <p className="text-xs text-emerald-100">
                    WhatsApp Contact
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto p-6 space-y-3"
                style={{
                  backgroundImage:
                    'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'
                }}
              >

                {messages.map(msg => (

                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.direction === "outgoing"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`
                        max-w-[65%]
                        px-4
                        py-2
                        rounded-xl
                        shadow-sm
                        ${
                          msg.direction === "outgoing"
                            ? "bg-[#d9fdd3] rounded-tr-none"
                            : "bg-white rounded-tl-none"
                        }
                      `}
                    >
                      {msg.message}
                    </div>

                  </div>

                ))}
                
              </div>
              <div className="bg-[#f0f2f5] p-3 border-t flex gap-3">

                  <input
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(e.target.value)
                    }
                    placeholder="Type a message..."
                    className="
                      flex-1
                      border
                      rounded-xl
                      px-4
                      py-2
                    "
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
      className="
        fixed
        z-50
        bg-white
        border
        border-slate-200
        rounded-xl
        shadow-xl
        py-2
        min-w-[220px]
      "
      style={{
        left: contextMenu.x,
        top: contextMenu.y
      }}
    >

      <button className="w-full text-left px-4 py-2 hover:bg-slate-100">
        📌 Pin Chat
      </button>

      <button className="w-full text-left px-4 py-2 hover:bg-slate-100">
        ⭐ Favorite
      </button>

      <button className="w-full text-left px-4 py-2 hover:bg-slate-100">
        👁 Mark Unread
      </button>

      <button
        onClick={() => {

          setDeleteConfirm(
            contextMenu.conversation
          );

          setContextMenu(null);

        }}
        className="
          w-full
          text-left
          px-4
          py-2
          hover:bg-red-50
          text-red-600
        "
      >
        🗑 Delete Chat
      </button>

    </div>

  )}
  {deleteConfirm && (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">

      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">

        <h3 className="text-lg font-semibold">
          Delete Chat
        </h3>

        <p className="text-slate-500 mt-2">
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
            className="px-4 py-2 rounded-xl border"
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