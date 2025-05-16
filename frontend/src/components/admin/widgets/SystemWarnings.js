export default function SystemWarnings() {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow">
        <p className="font-bold mb-1">⚠️ System Warning</p>
        <p>Stripe webhook failed twice in the last 24 hours.</p>
      </div>
    );
  }