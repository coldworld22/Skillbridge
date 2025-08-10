const EnrollBanner = ({ onEnroll, isPaid, price }) => {
  const formattedPrice = isPaid
    ? `$${Number(price).toFixed(2)}`
    : "Free";

  return (
    <div className="bg-yellow-700/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg flex items-center justify-between">
      <p>
        Enroll to unlock all chapters and quizzes.
        <span className="font-semibold ml-2">{formattedPrice}</span>
      </p>
      <button
        onClick={isPaid ? undefined : onEnroll}
        disabled={isPaid}
        className={`bg-green-500 text-white px-4 py-2 rounded ${
          isPaid ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
        }`}
      >
        {isPaid ? "Purchase Required" : "💳 Enroll Now"}
      </button>
    </div>
  );
};

export default EnrollBanner;
