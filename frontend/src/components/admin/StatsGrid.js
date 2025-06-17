// components/admin/StatsGrid.js
export default function StatsGrid({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <div className={`${stat.color} text-3xl`}>{stat.icon}</div>
          <div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <h3 className="text-xl font-bold">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
