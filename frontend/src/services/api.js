export const API_BASE = "http://localhost:5000";

export const getConversations = async () => {
  const response = await fetch(
    `${API_BASE}/chats/conversations`
  );

  return response.json();
};

export const getMessages = async (phoneNumber) => {
  const response = await fetch(
    `${API_BASE}/chats/${encodeURIComponent(phoneNumber)}`
  );

  return response.json();
};

export const sendMessage = async (
  phoneNumber,
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
        phoneNumber,
        message
      })
    }
  );

  return response.json();
};

export const deleteChat = async (
  phoneNumber
) => {

  const response =
    await fetch(
      `http://localhost:5000/messages/${phoneNumber}`,
      {
        method: "DELETE"
      }
    );

  return response.json();

};