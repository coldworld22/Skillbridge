// components/tutorials/detail/TestQuiz.js
import React, { useState, useEffect } from "react";

const sampleQuestions = [
    {
        question: "What hook is used for managing state in React?",
        options: ["useContext", "useEffect", "useState", "useReducer"],
        answer: "useState",
    },
    {
        question: "Which method is used to pass data to child components?",
        options: ["props", "state", "context", "redux"],
        answer: "props",
    },
];

const TestQuiz = ({
    onComplete,
    tutorialId = "default",
    onPassCertificate, // 🔥 new prop
}) => {
    const [started, setStarted] = useState(false);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [selected, setSelected] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [quizHistory, setQuizHistory] = useState([]);
    const [feedback, setFeedback] = useState(null);

    const historyKey = `quiz-history-${tutorialId}`;
    const totalQuestions = sampleQuestions.length;

    // Load history
    useEffect(() => {
        const existing = JSON.parse(localStorage.getItem(historyKey)) || [];
        setQuizHistory(existing);
    }, [historyKey]);

    // Timer
    useEffect(() => {
        if (!started || submitted) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, started, submitted]);

    // Save history and check certificate
    useEffect(() => {
        if (submitted) {
            const newEntry = {
                date: new Date().toISOString(),
                score,
                total: totalQuestions,
            };
            const updatedHistory = [...quizHistory, newEntry];
            localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
            setQuizHistory(updatedHistory);

            // 🔥 Trigger certificate callback if passed
            if (score === totalQuestions && onPassCertificate) {
                onPassCertificate(score);
            }
        }
    }, [submitted]);

    const handleSubmit = () => {
        const isCorrect = selected === sampleQuestions[current].answer;
        const newScore = score + (isCorrect ? 1 : 0);
        setFeedback(isCorrect ? "✅ Correct!" : "❌ Incorrect");

        setTimeout(() => {
            if (current + 1 < totalQuestions) {
                setScore(newScore);
                setCurrent((prev) => prev + 1);
                setSelected(null);
                setTimeLeft(30);
                setFeedback(null);
            } else {
                setScore(newScore);
                setSubmitted(true);
                setFeedback(null);
                onComplete?.(newScore);
            }
        }, 1000);
    };

    const restartQuiz = () => {
        setStarted(false);
        setCurrent(0);
        setScore(0);
        setSelected(null);
        setSubmitted(false);
        setTimeLeft(30);
        setFeedback(null);
    };

    // Start Screen
    if (!started) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg text-white text-center mt-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Ready to test your knowledge?</h2>
                <p className="mb-4 text-gray-300">This quiz has {totalQuestions} questions, with 30 seconds each.</p>
                <button
                    onClick={() => setStarted(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-6 py-2 rounded-full font-semibold"
                >
                    Start Quiz
                </button>

                {quizHistory.length > 0 && (
                    <div className="bg-gray-700 p-4 mt-6 rounded text-sm text-white text-left">
                        <h4 className="text-yellow-300 font-semibold mb-2">📚 Previous Attempts:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {quizHistory.map((attempt, idx) => (
                                <li key={idx}>
                                    {new Date(attempt.date).toLocaleString()}: {attempt.score}/{attempt.total}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // Submission Screen
    if (submitted) {
        return (
            <div className="bg-green-900 p-6 rounded-lg text-white mt-8 text-center shadow-lg">
                <h2 className="text-xl font-bold text-yellow-400">🎉 Test Completed!</h2>
                <p className="mt-2 text-lg">
                    Your Score: <span className="text-yellow-300">{score}</span> / {totalQuestions}
                </p>
                {score === totalQuestions ? (
                    <p className="text-green-300 mt-2">Perfect! You're ready for your certificate! 🏆</p>
                ) : (
                    <p className="text-red-300 mt-2">Keep practicing to improve your score! 💪</p>
                )}
                <button
                    onClick={restartQuiz}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-full text-black font-semibold"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Quiz Screen
    const question = sampleQuestions[current];

    return (
        <div className="bg-gray-800 p-6 mt-8 rounded-lg shadow-lg text-white">
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 h-2 rounded mb-4 overflow-hidden">
                <div
                    className="bg-yellow-400 h-full transition-all duration-300"
                    style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}
                ></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-yellow-400">
                    Question {current + 1} / {totalQuestions}
                </h2>
                <div className="text-sm text-yellow-300">⏱️ {timeLeft}s</div>
            </div>

            {/* Question */}
            <p className="mb-4 text-lg">{question.question}</p>

            {/* Options */}
            <div className="space-y-2">
                {question.options.map((option, idx) => (
                    <label key={idx} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`question-${current}`}
                            value={option}
                            checked={selected === option}
                            onChange={() => setSelected(option)}
                            className="accent-yellow-500"
                        />
                        <span>{option}</span>
                    </label>
                ))}
            </div>

            {/* Feedback */}
            {feedback && (
                <div className="mt-4 text-lg font-semibold text-center text-white">
                    {feedback}
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!selected}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-full text-black font-semibold transition"
            >
                {current + 1 === totalQuestions ? "Finish Quiz" : "Next"}
            </button>
        </div>
    );
};

export default TestQuiz;
