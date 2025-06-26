const sampleUsers = [
  {
    id: 1,
    name: "Instructor",
    status: "online",
    lastSeen: "2024-02-17T10:00:00Z",
  },
  {
    id: 2,
    name: "Student A",
    status: "offline",
    lastSeen: "2024-02-17T09:45:00Z",
  },
  {
    id: 3,
    name: "Student B",
    status: "online",
    lastSeen: "2024-02-17T10:05:00Z",
  },
];

const sampleGroups = [
  {
    id: 1,
    groupName: "React Course Group",
    participants: ["Instructor", "Student A", "Student B"],
    messages: [
      {
        sender: "Instructor",
        text: "Welcome to the React course!",
        timestamp: "2024-02-17T10:00:00Z",
      },
      {
        sender: "Student A",
        text: "Looking forward to learning!",
        timestamp: "2024-02-17T10:05:00Z",
      },
    ],
  },
  {
    id: 2,
    groupName: "JavaScript Study Group",
    participants: ["Student A", "Student B"],
    messages: [
      {
        sender: "Student B",
        text: "Anyone here for JS discussion?",
        timestamp: "2024-02-17T09:00:00Z",
      },
    ],
  },
];

const sampleMessages = [
  {
    id: 1,
    sender: "Instructor",
    text: "Welcome!",
    timestamp: "2024-02-17T10:00:00Z",
    read: false,
  },
  {
    id: 2,
    sender: "Student A",
    text: "Excited to learn!",
    timestamp: "2024-02-17T10:05:00Z",
    read: false,
  },
];

// ✅ Return a COPY of data instead of modifying the original
export const getUsers = async () => {
  return new Promise((resolve) =>
    setTimeout(() => resolve([...sampleUsers]), 500),
  );
};

export const getGroups = async () => {
  return new Promise((resolve) =>
    setTimeout(() => resolve([...sampleGroups]), 500),
  );
};

export const getMessages = async () => {
  return new Promise((resolve) =>
    setTimeout(() => resolve([...sampleMessages]), 500),
  );
};

// ✅ Simulate sending a group message
export const sendGroupMessage = async (groupId, sender, message) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find the target group
      let updatedGroups = sampleGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            messages: [
              ...group.messages,
              { sender, text: message, timestamp: new Date().toISOString() },
            ],
          };
        }
        return group;
      });

      resolve(updatedGroups);
    }, 500);
  });
};

export const markMessageAsRead = async (id) => {
  const msg = sampleMessages.find((m) => m.id === id);
  if (msg) {
    msg.read = true;
    return Promise.resolve({ ...msg, read_at: new Date().toISOString() });
  }
  return Promise.resolve({});
};
