import React from 'react';

function LoadMoreButton({ onClick, isLoading, hasMore }) {
  return (
    <div className="text-center mt-8">
      {hasMore ? (
        <button
          onClick={onClick}
          disabled={isLoading}
          className={`px-6 py-3 rounded-md font-semibold transition ${
            isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      ) : (
        <p className="text-gray-400">No more classes to load.</p>
      )}
    </div>
  );
}

export default LoadMoreButton;
