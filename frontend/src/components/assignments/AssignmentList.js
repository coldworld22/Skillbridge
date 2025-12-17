// src/pages/assignments/AssignmentList.js
export default function AssignmentList({ assignments, userRole }) {
    return (
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments available.</p>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-gray-100 p-4 rounded shadow flex flex-col sm:flex-row sm:justify-between sm:items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                <p className="text-sm text-gray-600">Due: {assignment.dueDate}</p>
                <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
              </div>
              {userRole !== 'student' && (
                <span className="text-xs text-gray-500 mt-2 sm:mt-0">Uploaded by: {assignment.uploadedBy}</span>
              )}
            </div>
          ))
        )}
      </div>
    );
  }