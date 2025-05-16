import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function InstructorDetailsModal({ instructor, onClose, onSave, useTabs }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ ...instructor });

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-black"
        >
          <FaTimes size={18} />
        </button>

        <h2 className="text-xl font-bold mb-4">Instructor Details</h2>

        {useTabs && (
          <div className="flex border-b mb-4">
            {['profile', 'classes', 'edit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-all ${
                  activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {activeTab === 'profile' && (
            <div>
              <img
                src={form.avatar}
                alt={form.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
              />
              <p className="text-center font-semibold">{form.name}</p>
              <p className="text-center text-sm text-gray-500">{form.email}</p>
              <p className="text-sm text-gray-600 mt-2">{form.bio}</p>
              <p className="text-sm text-gray-400 mt-1">Joined: {form.joinDate}</p>
              <p className="text-sm mt-1">Status: {form.status ? 'Active' : 'Inactive'}</p>
            </div>
          )}

          {activeTab === 'classes' && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Classes</h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {form.classes?.map((cls, idx) => (
                  <li key={idx}>{cls}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Name
                <input
                  type="text"
                  className="w-full mt-1 border rounded px-3 py-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  className="w-full mt-1 border rounded px-3 py-1"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Bio
                <textarea
                  className="w-full mt-1 border rounded px-3 py-1"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                />
                Active
              </label>
              <button
                onClick={handleSave}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
