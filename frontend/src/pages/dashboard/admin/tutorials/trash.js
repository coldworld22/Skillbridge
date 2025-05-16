import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function TrashTutorialsPage() {
  const router = useRouter();

  const [tutorials, setTutorials] = useState(JSON.parse(localStorage.getItem("tutorials")) || []);

  const deletedTutorials = tutorials.filter((tut) => tut.isDeleted);

  const restoreTutorial = (id) => {
    const updated = tutorials.map((tut) =>
      tut.id === id ? { ...tut, isDeleted: false } : tut
    );
    localStorage.setItem("tutorials", JSON.stringify(updated));
    setTutorials(updated);
  };

  const permanentlyDelete = (id) => {
    const updated = tutorials.filter((tut) => tut.id !== id);
    localStorage.setItem("tutorials", JSON.stringify(updated));
    setTutorials(updated);
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">🗑️ Tutorials Trash</h1>

        {deletedTutorials.length === 0 ? (
          <p className="text-center text-gray-500">Trash is empty.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Instructor</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedTutorials.map((tutorial) => (
                  <tr key={tutorial.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{tutorial.title}</td>
                    <td className="py-3 px-4">{tutorial.instructor}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => restoreTutorial(tutorial.id)}
                      >
                        ♻️ Restore
                      </Button>
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => permanentlyDelete(tutorial.id)}
                      >
                        🗑️ Permanently Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
