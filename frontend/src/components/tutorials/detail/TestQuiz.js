// components/tutorials/detail/TestQuiz.js
import React, { useState, useEffect } from "react";

const sampleQuestions = [
    {
        question: "What hook is used to manage state in React?",
        options: ["useContext", "useEffect", "useState", "useReducer"],
        answer: "useState",
        explanation: "useState is the primary hook for managing local state in React components."
    },
    {
        question: "How do you pass data to child components?",
        options: ["state", "props", "redux", "context"],
        answer: "props",
        explanation: "Props are passed from parent to child components for data sharing."
    },
];

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

const TestQuiz = ({ onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [attempted, setAttempted] = useState(false);

    // Initialize and shuffle questions
    useEffect(() => {
        const shuffledQuestions = shuffleArray(sampleQuestions).map(q => ({
            ...q,
            options: shuffleArray(q.options),
        }));
        setQuestions(shuffledQuestions);

        if (localStorage.getItem("quiz-passed")) {
            setAttempted(true);
        }
    }, []);

    const handleSubmit = () => {
        if (!selected) return;

        if (selected === questions[current].answer) {
            setScore((prev) => prev + 1);
        }

        setShowExplanation(true);
    };

    const handleNext = () => {
        setSelected(null);
        setShowExplanation(false);

        if (current + 1 < questions.length) {
            setCurrent((prev) => prev + 1);
        } else {
            setSubmitted(true);
            localStorage.setItem("quiz-passed", true);
            onComplete(score + (selected === questions[current].answer ? 1 : 0));
        }
    };

    if (attempted) {
        return (
            <div className="bg-green-800 p-6 rounded-lg mt-8 text-white">
                <h2 className="text-xl font-bold text-yellow-400">✅ Quiz Already Completed</h2>
                <p className="mt-2">You’ve already taken this quiz in this session.</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="bg-green-900 p-6 rounded-lg text-white mt-8">
                <h2 className="text-xl font-bold text-yellow-400">🎉 Quiz Completed!</h2>
                <p className="mt-2">Your Score: {score} / {questions.length}</p>
            </div>
        );
    }

    const currentQ = questions.length > 0 ? questions[current] : null;


    return (
        <div className="bg-gray-800 p-6 rounded-lg mt-8 text-white shadow-lg">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
                Question {current + 1} of {questions.length}
            </h2>
            <p className="mb-4">{currentQ?.question}</p>

            <div className="space-y-2">
                {currentQ && (
                    <>
                        <p className="mb-4">{currentQ.question}</p>

                        <div className="space-y-2">
                            {currentQ.options.map((opt, i) => (
                                <label key={i} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        value={opt}
                                        checked={selected === opt}
                                        onChange={() => setSelected(opt)}
                                        className="accent-yellow-500"
                                        disabled={showExplanation}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </>
                )}

            </div>

            {!showExplanation && (
                <button
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-full"
                    disabled={!selected}
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            )}

            {showExplanation && (
                <div className="mt-4">
                    <p className="text-sm text-green-300">{currentQ.explanation}</p>
                    <button
                        onClick={handleNext}
                        className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-full"
                    >
                        {current + 1 === questions.length ? "Finish Quiz" : "Next Question"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TestQuiz;
