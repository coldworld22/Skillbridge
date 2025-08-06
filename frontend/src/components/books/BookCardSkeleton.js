import React from "react";

export default function BookCardSkeleton() {
  return (
    <div className="animate-pulse border rounded p-4 space-y-3">
      <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      </div>
    </div>
  );
}
