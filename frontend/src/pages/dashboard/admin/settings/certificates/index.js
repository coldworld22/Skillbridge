import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import Link from "next/link";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaClone,
    FaEye,
    FaToggleOn,
    FaToggleOff,
} from "react-icons/fa";

// Make sure this import path matches your project structure
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";

const mockTemplates = [
    {
        id: 1,
        name: "Course Completion",
        type: "Completion",
        thumbnail: "/certificates/template1.png",
        active: true,
    },
    {
        id: 2,
        name: "Achievement Award",
        type: "Achievement",
        thumbnail: "/certificates/template2.png",
        active: false,
    },
];

export default function CertificateTemplatesPage() {
    const [templates, setTemplates] = useState(mockTemplates);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const toggleStatus = (id) => {
        setTemplates((prev) =>
            prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
        );
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Certificate Templates</h1>
                    <Link
                        href="/dashboard/admin/settings/certificates/create"
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <FaPlus /> Add New Template
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white shadow rounded-xl p-4 border"
                        >
                            <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-40 object-cover rounded-md mb-4"
                            />
                            <h2 className="font-semibold text-lg">{template.name}</h2>
                            <p className="text-sm text-gray-500 mb-2">Type: {template.type}</p>

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => toggleStatus(template.id)}
                                    className={`text-sm flex items-center gap-1 ${template.active ? "text-green-600" : "text-gray-400"
                                        }`}
                                >
                                    {template.active ? <FaToggleOn /> : <FaToggleOff />}
                                    {template.active ? "Active" : "Inactive"}
                                </button>

                                <div className="flex gap-2 text-gray-600">
                                    <Link
                                        href={`/dashboard/admin/settings/certificates/${template.id}`}
                                    >
                                        <FaEdit title="Edit" />
                                    </Link>
                                    <button onClick={() => alert("Duplicate")}>
                                        <FaClone title="Duplicate" />
                                    </button>
                                    <button onClick={() => setPreviewTemplate(template)}>
                                        <FaEye title="Preview" />
                                    </button>
                                    <button
                                        onClick={() => alert("Delete")}
                                        className="text-red-500"
                                    >
                                        <FaTrash title="Delete" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {previewTemplate && (
                    <CertificatePreviewModal
                        template={previewTemplate}
                        onClose={() => setPreviewTemplate(null)}
                    />
                )}
            </div>
        </AdminLayout>
    );
}