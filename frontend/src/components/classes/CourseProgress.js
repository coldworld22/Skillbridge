import React from "react";

export default function CourseProgress({ percentage = 0 }) {
  const percent = Math.min(100, Math.max(0, percentage));
  return (
    <div data-testid="course-progress" className="my-4">
      <div className="h-4 bg-gray-700 rounded">
        <div
          data-testid="course-progress-bar"
          className="bg-yellow-500 h-full rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-sm mt-1 text-center">{Math.round(percent)}% Complete</div>
    </div>
  );
}
