import { useState } from "react";
import { toast } from "react-toastify";
import { FaBriefcase, FaPlus } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function ExpertiseList({ expertise, onChange, t }) {
  const [newExpertise, setNewExpertise] = useState("");

  const addExpertise = () => {
    const trimmed = newExpertise.trim();
    if (!trimmed) return;
    const exists = expertise.some((e) => e.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.info("Tag already exists");
      setNewExpertise("");
      return;
    }
    onChange([...expertise, trimmed]);
    setNewExpertise("");
  };

  const removeExpertise = (index) => {
    onChange(expertise.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
        <FaBriefcase className="text-gray-500" /> {t('expertise')}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {expertise.map((tag, i) => (
          <span key={i} className="inline-flex items-center bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
            {tag}
            <button
              type="button"
              onClick={() => removeExpertise(i)}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              <RiDeleteBin6Line size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newExpertise}
          onChange={(e) => setNewExpertise(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addExpertise();
            }
          }}
          placeholder={t('add_expertise_placeholder')}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
        />
        <button
          type="button"
          onClick={addExpertise}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 flex items-center gap-2"
        >
          <FaPlus size={14} /> {t('add')}
        </button>
      </div>
    </div>
  );
}
