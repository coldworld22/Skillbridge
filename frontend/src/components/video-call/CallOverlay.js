const CallOverlay = ({ incoming, name, onAccept, onDecline }) => {
  const safeName = name || "Someone";
  const label = incoming
    ? `${safeName} is calling...`
    : `Calling ${safeName}...`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white text-lg font-bold p-6">
      <p className="mb-4">{label}</p>
      <div className="flex gap-4">
        {incoming ? (
          <>
            <button onClick={onAccept} className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600">
              ✅ Accept
            </button>
            <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600">
              ❌ Decline
            </button>
          </>
        ) : (
          <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600">
            ❌ Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
