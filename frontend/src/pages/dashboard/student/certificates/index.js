// ✅ Upgraded Professional Certificate Page
import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import Link from "next/link";
import { FaEye, FaShareAlt } from "react-icons/fa";
import { fetchCertificates } from "@/services/student/certificateService";

export default function StudentCertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchCertificates();
                setCertificates(data);
            } catch (err) {
                console.error('Failed to load certificates', err);
                setError('Failed to load certificates');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleShareCertificate = (cert) => {
        const link = cert.verificationUrl || `${window.location.origin}/certificate/verify/${cert.id}`;
        if (navigator.share) {
            navigator.share({
                title: "🎓 View My Certificate",
                text: "Check out my new achievement!",
                url: link,
            }).catch((err) => console.error(err));
        } else {
            navigator.clipboard.writeText(link)
                .then(() => alert(`🔗 Certificate link copied!\n${link}`))
                .catch(() => alert("❌ Failed to copy!"));
        }
    };

    return (
        <StudentLayout>
            <div className="min-h-screen bg-white px-6 py-10 text-gray-900">
                <h1 className="text-2xl font-bold text-yellow-500 mb-8">🎓 My Certificates</h1>

                {loading && <p className="text-center">Loading...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loading && certificates.length === 0 ? (
                    <p className="text-center text-gray-500">No certificates earned yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="bg-gray-100 p-6 rounded-lg shadow-md relative">
                                <h3 className="text-3xl font-semibold text-gray-700 mt-2 mb-6">{cert.courseTitle}</h3>
                                <p className="text-sm text-gray-600 mb-2">Status:
                                    <span className={`font-bold ml-2 ${cert.status === "Issued" ? "text-green-600" : "text-yellow-500"}`}>{cert.status}</span>
                                </p>

                                {cert.status === "Issued" && (
                                    <p className="text-sm text-gray-500 mb-2">
                                        Issued on: {new Date(cert.issueDate).toLocaleDateString()}
                                    </p>
                                )}

                                <div className="flex gap-3 mt-4 flex-wrap">
                                    {cert.status === "Issued" && (
                                        <>
                                            <Link href={`/dashboard/student/certificates/view/${cert.id}`} className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded flex items-center gap-2 text-sm">
                                                <FaEye /> View
                                            </Link>
                                            <button onClick={() => handleShareCertificate(cert)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                                                <FaShareAlt /> Share
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
