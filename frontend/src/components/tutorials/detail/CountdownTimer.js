import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = start - now;

      if (diff <= 0) {
        setTimeLeft(null); // class started
        return;
      }

      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-center bg-yellow-400 text-black font-semibold py-2 rounded-md mb-4">
      {timeLeft ? (
        <>⏱️ Class starts in {timeLeft}</>
      ) : (
        <>✅ Class has started</>
      )}
    </div>
  );
}
