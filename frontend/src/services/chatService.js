export const getChatList = async () => {
    return [
      { id: "chat1", name: "John Doe" },
      { id: "chat2", name: "Study Group" },
      { id: "chat3", name: "Instructor - Mr. Smith" },
    ];
  };
  
  export const getMessages = async (chatId) => {
    return chatId === "chat1"
      ? [{ id: 1, text: "Hello!", isMine: false }, { id: 2, text: "Hi there!", isMine: true }]
      : [];
  };
  