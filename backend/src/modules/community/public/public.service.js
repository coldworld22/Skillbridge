let discussions = [
  {
    id: '1',
    title: 'How to use useEffect in React?',
    content: "I'm struggling to understand the use cases for useEffect.",
    tags: ['React', 'Hooks'],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Best practices for database indexing?',
    content: 'What are the best indexing strategies for MySQL?',
    tags: ['Database', 'MySQL'],
    created_at: new Date().toISOString(),
  },
];

exports.listDiscussions = async () => discussions;

exports.getDiscussion = async (id) => discussions.find((d) => d.id === id);

// Utility for tests to reset data
exports.__setDiscussions = (data) => {
  discussions = data;
};
