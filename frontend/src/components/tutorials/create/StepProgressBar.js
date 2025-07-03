import { FaCheck } from "react-icons/fa";

export default function StepProgressBar({ steps = [], currentStep = 1, onStepClick }) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative mb-12">
      <div className="absolute top-4 left-0 w-full h-1 bg-gray-300 z-0 rounded" />
      <div
        className="absolute top-4 left-0 h-1 bg-yellow-500 z-0 rounded transition-all"
        style={{ width: `${progress}%` }}
      />
      <div className="relative flex justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <div
              key={label}
              className="flex flex-col items-center text-center flex-1 cursor-pointer"
              onClick={() => onStepClick && onStepClick(stepNumber)}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${isActive ? "bg-yellow-500" : isCompleted ? "bg-green-500" : "bg-gray-400"}`}
              >
                {isCompleted ? <FaCheck /> : stepNumber}
              </div>
              <span className={`mt-2 text-sm ${isActive ? "text-yellow-600" : "text-gray-500"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
