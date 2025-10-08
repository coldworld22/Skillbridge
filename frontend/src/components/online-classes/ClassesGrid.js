import React from 'react';
import ClassCard from './ClassCard';

function ClassesGrid({ classes }) {
  if (!classes || classes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        No classes found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((item, index) => (
        <ClassCard key={index} classData={item} index={index} />
      ))}
    </div>
  );
}

export default ClassesGrid;
