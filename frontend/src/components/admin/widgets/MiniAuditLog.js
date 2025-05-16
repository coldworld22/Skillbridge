const logs = [
    "🧑‍🏫 Instructor Ayman approved",
    "📚 Tutorial 'Node Mastery' deleted",
    "👥 New user registered: mariam.dev",
  ];
  
  export default function MiniAuditLog() {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="font-semibold mb-2 text-gray-800">🧾 Recent Actions</p>
        <ul className="text-sm text-gray-600 space-y-2">
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    );
  }