import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  fetchTrashedTutorials,
  restoreTutorial,
  permanentlyDeleteTutorial,
} from "@/services/admin/tutorialService";

export default function TrashTutorialsPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTrashedTutorials();
        setTutorials(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load trash");
      }
    };
    load();
  }, []);

  const handleRestore = async (id) => {
    try {
      await restoreTutorial(id);
      setTutorials((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tutorial restored");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore");
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await permanentlyDeleteTutorial(id);
      setTutorials((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tutorial permanently deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const trashedTutorials = tutorials;

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">🗑️ Tutorials Trash</h1>

        {trashedTutorials.length === 0 ? (
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
                {trashedTutorials.map((tutorial) => (
                  <tr key={tutorial.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{tutorial.title}</td>
                    <td className="py-3 px-4">{tutorial.instructor}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleRestore(tutorial.id)}
                      >
                        ♻️ Restore
                      </Button>
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handlePermanentDelete(tutorial.id)}
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
