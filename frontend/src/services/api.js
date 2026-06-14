export const API_BASE = "http://localhost:5000";

export const getConversations = async () => {
  const response = await fetch(
    `${API_BASE}/chats/conversations`
  );

  return response.json();
};

export const getMessages = async (contactId) => {
  const response = await fetch(
    `${API_BASE}/chats/${encodeURIComponent(contactId)}`
  );

  return response.json();
};

export const sendMessage = async (
  contactId,
  message
) => {
  const response = await fetch(
    `${API_BASE}/chats/send`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        contactId,
        message
      })
    }
  );

  return response.json();
};