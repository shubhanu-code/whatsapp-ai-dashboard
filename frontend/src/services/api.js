export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getConversations = async () => {
  const response = await fetch(`${API_BASE}/chats/conversations`);
  if (!response.ok) throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  return response.json();
};

export const getMessages = async (phoneNumber) => {
  const response = await fetch(`${API_BASE}/chats/${encodeURIComponent(phoneNumber)}`);
  if (!response.ok) throw new Error(`Failed to fetch messages: ${response.statusText}`);
  return response.json();
};

export const sendMessage = async (phoneNumber, message) => {
  const response = await fetch(`${API_BASE}/chats/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      phoneNumber,
      message
    })
  });
  
  if (!response.ok) throw new Error(`Failed to send message: ${response.statusText}`);
  return response.json();
};

export const deleteChat = async (phoneNumber) => {
  const response = await fetch(`${API_BASE}/chats/${encodeURIComponent(phoneNumber)}`, {
    method: "DELETE"
  });

  if (!response.ok) throw new Error(`Failed to delete chat record: ${response.statusText}`);
  return response.json();
};