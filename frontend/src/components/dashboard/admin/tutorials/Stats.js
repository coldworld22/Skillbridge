import React from "react";
import { TUTORIAL_STATUS } from "@/constants/tutorialStatus";

function Stats({ tutorials }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
        <p className="text-gray-600">Total Tutorials</p>
        <p className="text-2xl font-bold">{tutorials.length}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
        <p className="text-gray-600">Pending Approval</p>
        <p className="text-2xl font-bold">
          {
            tutorials.filter(
              (t) => t.approvalStatus?.toLowerCase() === "pending"
            ).length
          }
        </p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
        <p className="text-gray-600">Published</p>
        <p className="text-2xl font-bold">
          {
            tutorials.filter(
              (t) => t.status?.toLowerCase() === TUTORIAL_STATUS.PUBLISHED
            ).length
          }
        </p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
        <p className="text-gray-600">Drafts</p>
        <p className="text-2xl font-bold">
          {
            tutorials.filter(
              (t) => t.status?.toLowerCase() === TUTORIAL_STATUS.DRAFT
            ).length
          }
        </p>
      </div>
    </div>
  );
}

export default Stats;

