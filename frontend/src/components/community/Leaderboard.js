const Leaderboard = () => {
  const topUsers = [
    { name: "Alice Johnson", points: 1200 },
    { name: "Michael Smith", points: 950 },
    { name: "Sophia Brown", points: 870 },
    { name: "John Doe", points: 720 },
    { name: "Emma Wilson", points: 600 },
  ];

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-3">🏆 Leaderboard</h3>

      <ul>
        {topUsers.map((user, index) => (
          <li key={index} className="flex justify-between py-2 border-b border-gray-700">
            <span>{index + 1}. {user.name}</span>
            <span className="text-yellow-500 font-bold">{user.points} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
