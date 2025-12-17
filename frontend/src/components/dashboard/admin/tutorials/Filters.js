import React from "react";
import { FaSearch } from "react-icons/fa";
import { Button } from "@/components/ui/button";

function Filters({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  filterApproval,
  setFilterApproval,
  categories,
  setCurrentPage,
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Search by title or instructor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 p-2.5 w-full border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>

        <select
          value={filterApproval}
          onChange={(e) => {
            setFilterApproval(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
        >
          <option value="All">All Approval</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>

        <Button
          onClick={() => {
            setSearchQuery("");
            setFilterCategory("All");
            setFilterStatus("All");
            setFilterApproval("All");
            setCurrentPage(1);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg border border-gray-300"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

export default Filters;
