const events = [
    { title: "React Bootcamp", date: "Tomorrow 10AM" },
    { title: "Python Live", date: "April 18, 2PM" },
    { title: "UX Fundamentals", date: "April 20, 5PM" },
  ];
  
  export default function UpcomingEvents() {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="font-semibold mb-2 text-gray-800">📅 Upcoming Classes</p>
        <ul className="text-sm text-gray-700 space-y-1">
          {events.map((e, i) => (
            <li key={i}>✅ {e.title} – {e.date}</li>
          ))}
        </ul>
      </div>
    );
  }