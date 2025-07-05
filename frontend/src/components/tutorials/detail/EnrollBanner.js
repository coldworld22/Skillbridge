const EnrollBanner = ({ onEnroll }) => (
  <div className="bg-yellow-700/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg flex items-center justify-between">
    <p>Enroll to unlock all chapters and quizzes.</p>
    <button
      onClick={onEnroll}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      💳 Enroll Now
    </button>
  </div>
);

export default EnrollBanner;
