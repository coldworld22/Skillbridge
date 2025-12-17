import React from "react";

export default function TutorialSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="w-full h-64 bg-gray-800 rounded" />
      <div className="h-6 bg-gray-800 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}
