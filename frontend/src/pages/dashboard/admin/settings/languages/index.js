// Updated Language Manager with enhancements
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    Globe,
    Star,
    Pencil,
    Upload,
    Trash,
    Download,
} from "lucide-react";

const mockLanguages = [
    { id: 1, label: "English", code: "en", direction: "ltr", active: true, default: true, translationProgress: 100, lastUpdated: "2025-05-12" },
    { id: 2, label: "Arabic", code: "ar", direction: "rtl", active: true, default: false, translationProgress: 90, lastUpdated: "2025-05-10" },
    { id: 3, label: "French", code: "fr", direction: "ltr", active: false, default: false, translationProgress: 70, lastUpdated: "2025-05-08" },
];

export default function LanguageManagerPage() {
    const router = useRouter();
    const [languages, setLanguages] = useState(mockLanguages);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);

    const filteredLanguages = useMemo(() => {
        return languages.filter((lang) => {
            const matchSearch = lang.label.toLowerCase().includes(search.toLowerCase()) || lang.code.toLowerCase().includes(search.toLowerCase());
            const matchFilter =
                filter === "all" ||
                (filter === "active" && lang.active) ||
                (filter === "inactive" && !lang.active);
            return matchSearch && matchFilter;
        });
    }, [languages, search, filter]);

    const toggleActive = (id) => {
        setLanguages((prev) =>
            prev.map((lang) =>
                lang.id === id ? (lang.default ? (alert("Cannot deactivate default language"), lang) : { ...lang, active: !lang.active }) : lang
            )
        );
    };

    const setDefault = (id) => {
        setLanguages((prev) => prev.map((lang) => ({ ...lang, default: lang.id === id })));
    };

    const handleDelete = (id) => {
        const lang = languages.find((l) => l.id === id);
        if (lang.default) return alert("Cannot delete default language");
        if (confirm(`Delete language \"${lang.label}\"?`)) {
            setLanguages((prev) => prev.filter((l) => l.id !== id));
        }
    };

    const handleEdit = (code) => router.push(`/dashboard/admin/settings/languages/edit/${code}`);

    const handleUpload = (code) => alert(`Upload for: ${code}`);

    const handleExport = (code) => alert(`Exporting ${code}.zip`);

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const selectAll = () => {
        setSelectedIds(filteredLanguages.map((lang) => lang.id));
    };

    const clearAll = () => setSelectedIds([]);

    const bulkDelete = () => {
        const nonDefaultIds = selectedIds.filter((id) => {
            const lang = languages.find((l) => l.id === id);
            return lang && !lang.default;
        });
        setLanguages((prev) => prev.filter((l) => !nonDefaultIds.includes(l.id)));
        clearAll();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="w-6 h-6" /> Language Manager
                    </h1>
                    <Link href="/dashboard/admin/settings/languages/create">
                        <button className="bg-yellow-500 text-white px-4 py-2 rounded shadow">+ Add Language</button>
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border p-2 rounded"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="border p-2 rounded"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex gap-2 items-center">
                            <span className="text-sm text-gray-600">Selected: {selectedIds.length}</span>
                            <button
                                onClick={bulkDelete}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                            >
                                Delete Selected
                            </button>
                            <button
                                onClick={clearAll}
                                className="text-sm text-gray-500 hover:text-black"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded shadow text-sm">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="p-3 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
                                        checked={selectedIds.length === filteredLanguages.length && filteredLanguages.length > 0}
                                    />
                                </th>
                                <th className="p-3">Language</th>
                                <th className="p-3">Code</th>
                                <th className="p-3 text-center">Direction</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Default</th>
                                <th className="p-3">Progress</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLanguages.map((lang) => (
                                <tr key={lang.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(lang.id)}
                                            onChange={() => toggleSelect(lang.id)}
                                        />
                                    </td>
                                    <td className="p-3 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={
                                                    lang.code === "en"
                                                        ? "https://wiki2.railml.org/images/b/b8/UK_flag.png"
                                                        : lang.code === "ar"
                                                            ? "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/1280px-Flag_of_Saudi_Arabia.svg.png"
                                                            : lang.code === "fr"
                                                                ? "https://upload.wikimedia.org/wikipedia/commons/6/62/Flag_of_France.png"
                                                                : `/flags/${lang.code}.png`
                                                }
                                                onError={(e) => (e.target.src = "/flags/default.png")}
                                                alt={`${lang.label} flag`}
                                                className="w-5 h-3 rounded-sm border object-cover"
                                            />
                                            {lang.label}
                                            {lang.translationProgress < 100 && (
                                                <span className="text-red-500 text-xs ml-2">⚠ Incomplete</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400">Updated: {lang.lastUpdated}</div>
                                    </td>
                                    <td className="p-3">{lang.code}</td>
                                    <td className="p-3 text-center">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${lang.direction === "rtl"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {lang.direction.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => toggleActive(lang.id)}
                                            className={`px-2 py-1 text-xs font-medium rounded ${lang.active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                                }`}
                                        >
                                            {lang.active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setDefault(lang.id)} title="Set as default">
                                            <Star
                                                className={`w-5 h-5 mx-auto transition ${lang.default ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="p-3">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full"
                                                style={{ width: `${lang.translationProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-right mt-1">
                                            {lang.translationProgress}%
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                title="Edit"
                                                className="text-blue-600"
                                                onClick={() => handleEdit(lang.code)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                title="Upload"
                                                className="text-green-600"
                                                onClick={() => handleUpload(lang.code)}
                                            >
                                                <Upload size={16} />
                                            </button>
                                            <button
                                                title="Export"
                                                className="text-gray-600"
                                                onClick={() => handleExport(lang.code)}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                title="Delete"
                                                className="text-red-600"
                                                onClick={() => handleDelete(lang.id)}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
