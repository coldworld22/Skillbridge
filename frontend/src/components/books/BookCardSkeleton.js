import React from "react";

export default function BookCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      <div className="w-full h-40 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
