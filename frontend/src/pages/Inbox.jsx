import { useState, useEffect } from "react";
import {
  getConversations,
  getMessages,
  sendMessage
} from "../services/api";
const Inbox = () => {
  const [selectedConversation,setSelectedConversation] = useState(null);
  const [messages,setMessages] =useState([]);
  const [replyText, setReplyText] = useState("");
  const loadMessages = async (
    contactId
  ) => {

    const data =
      await getMessages(contactId);
    setMessages(data);

  };

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

  const [conversations, setConversations] =
    useState([]);

  useEffect(() => {
    getConversations()
    .then(setConversations)
    .catch(console.error);

  }, []);

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-bold text-slate-800">
        Inbox
      </h2>

      <div className="flex h-[700px] bg-white rounded-xl border border-slate-200">

        {/* Left Panel */}

        <div className="w-1/3 border-r overflow-y-auto">

          {conversations.map(conv => (

            <div
              key={conv.contactId}
              onClick={() => {

                setSelectedConversation(conv);

                loadMessages(
                  conv.contactId
                );

              }}
              className={`
                p-4
                border-b
                cursor-pointer
                hover:bg-slate-50
                ${
                  selectedConversation?.contactId ===
                  conv.contactId
                    ? "bg-emerald-50"
                    : ""
                }
              `}
            >

              <div className="font-semibold">
                {conv.contactName}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                {conv.lastMessage}
              </div>

            </div>

          ))}

        </div>

        {/* Right Panel */}

        <div className="flex-1 p-4 overflow-y-auto">

          {!selectedConversation ? (

            <div className="text-slate-400">
              Select a conversation
            </div>

          ) : (

            <>
              <h3 className="font-bold text-lg mb-4">
                {selectedConversation.contactName}
              </h3>

              <div className="space-y-3">

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
                      className={`max-w-[70%] px-4 py-2 rounded-xl ${
                        msg.direction === "outgoing"
                          ? "bg-green-100"
                          : "bg-slate-100"
                      }`}
                    >
                      {msg.message}
                    </div>

                  </div>

                ))}
                <div className="border-t mt-4 pt-4 flex gap-2">

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
                      bg-emerald-600
                      text-white
                      px-4
                      rounded-xl
                    "
                  >
                    Send
                  </button>

                </div>
              </div>
            </>

          )}

        </div>

      </div>

    </div>
  );
};

export default Inbox;