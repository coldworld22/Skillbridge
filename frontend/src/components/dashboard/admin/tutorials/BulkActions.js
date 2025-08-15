import React from "react";
import { FaCheck, FaTrash, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";

function BulkActions({
  count,
  onBulkApprove,
  onBulkDelete,
  onClearSelected,
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-white rounded-xl shadow-md border border-yellow-100 transition-all animate-fade-in">
      <span className="font-semibold text-gray-700">
        {count} {count === 1 ? "tutorial" : "tutorials"} selected
      </span>

      <Button
        onClick={onBulkApprove}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow"
      >
        <FaCheck className="mr-2" /> Approve Selected
      </Button>

      <Button
        onClick={onBulkDelete}
        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg flex items-center shadow"
      >
        <FaTrash className="mr-2" /> Delete Selected
      </Button>

      <Button
        onClick={onClearSelected}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center border border-gray-300"
      >
        <FaTimes className="mr-2" /> Clear Selection
      </Button>
    </div>
  );
}

export default BulkActions;
