import { useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import RuleModal from "./RuleModal";
import { Button } from "@/components/ui/button";

export default function RuleList({ rules = [], onAdd, onUpdate, onDelete, canManage = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const openNew = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <Button
          onClick={openNew}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus />
          Add Rule
        </Button>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              {canManage && <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2">{rule.title}</td>
                <td className="px-4 py-2">{rule.description}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => openEdit(rule)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete?.(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td
                  className="px-4 py-4 text-center text-gray-500"
                  colSpan={canManage ? 3 : 2}
                >
                  No rules found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <RuleModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={editingRule}
          onSave={(data) => {
            if (editingRule) {
              onUpdate?.(editingRule.id, data);
            } else {
              onAdd?.(data);
            }
          }}
        />
      )}
    </div>
  );
}

