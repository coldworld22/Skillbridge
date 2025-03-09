import { useState, useEffect } from "react";

const LiveClassCountdown = ({ date, time }) => {
  const calculateTimeLeft = () => {
    const eventTime = new Date(`${date} ${time}`).getTime();
    const now = new Date().getTime();
    const difference = eventTime - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
      <h3 className="text-lg font-semibold text-yellow-400">⏳ Live Class Starts In</h3>
      <p className="text-white text-2xl mt-2">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </p>
    </div>
  );
};

export default LiveClassCountdown;
