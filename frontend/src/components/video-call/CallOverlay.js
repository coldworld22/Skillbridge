const CallOverlay = ({ onAccept, onDecline }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white text-lg font-bold p-6">
        <p className="mb-4">Incoming Call...</p>
        <div className="flex gap-4">
          <button onClick={onAccept} className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600">
            ✅ Accept
          </button>
          <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600">
            ❌ Decline
          </button>
        </div>
      </div>
    );
  };
  