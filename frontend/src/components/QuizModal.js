import React, { useState } from "react";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./QuizModal.module.scss";

const QuizModal = ({ isOpen, closeQuiz, questions, onPass }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const checkAnswers = () => {
    const correctAnswers = questions.every((q) => answers[q.id] === q.correct);
    setSubmitted(true);
    if (correctAnswers) onPass(); // Unlock next lesson if correct
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyles.simpleOverlay}>
      <div className={`${modalStyles.panel} ${styles.panel}`}>
        <h2 className={styles.title}>Quiz</h2>
        {questions.map((q) => (
          <div key={q.id} className={styles.question}>
            <p>{q.question}</p>
            <div className={styles.options}>
              {q.options.map((option) => {
                const isActive = answers[q.id] === option;
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={isActive ? "accent" : "ghost"}
                    className={styles.option}
                    onClick={() => handleAnswer(q.id, option)}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <Button onClick={checkAnswers} variant="accent">
            Submit Quiz
          </Button>
          <Button onClick={closeQuiz} variant="neutral">
            Close
          </Button>
        </div>
        {submitted && (
          <p className={styles.result}>
            {questions.every((q) => answers[q.id] === q.correct)
              ? "✅ Passed!"
              : "❌ Try Again!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizModal;
