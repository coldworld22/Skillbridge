export default function ContributorCard({ user }) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
      <img src={user.avatar || "/default-avatar.png"} className="w-12 h-12 rounded-full" />
      <div>
        <h4 className="font-semibold">{user.name}</h4>
        <p className="text-sm text-gray-600">
          {user.contributions} contributions • {user.reputation} reputation
        </p>
      </div>
    </div>
  );
}
