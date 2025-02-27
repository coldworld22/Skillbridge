import sampleGroups from "@/mocks/sampleGroups.json";

export const getGroups = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(sampleGroups), 500); // Simulate API delay
  });
};

export const sendGroupMessage = async (groupId, sender, text) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedGroups = sampleGroups.map((group) =>
        group.id === groupId
          ? { ...group, messages: [...group.messages, { sender, text, timestamp: new Date().toISOString() }] }
          : group
      );
      resolve(updatedGroups);
    }, 500);
  });
};
