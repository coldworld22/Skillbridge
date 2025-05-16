// ✅ Upgraded Professional Certificate Page
import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import Link from "next/link";
import { FaDownload, FaEye, FaShareAlt } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "react-qr-code";

export default function StudentCertificatesPage() {
    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        setCertificates([
            {
                id: "cert1",
                courseTitle: "React & Next.js Bootcamp",
                InstrucorName: "Ayman Khan",
                studentName: "Sara Ali",
                issueDate: "2025-05-01",
                serialNumber: "CERT-00001",
                status: "Issued",
                grade: "95%", // ✅ Added Grade
            },
        ]);
    }, []);

    const handleDownloadCertificate = async (cert) => {
        const certDiv = document.getElementById(`certificate-${cert.id}`);
        if (!certDiv) {
            alert("❌ Certificate not ready!");
            return;
        }

        const clone = certDiv.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.top = "-9999px";
        clone.style.left = "-9999px";
        clone.style.display = "block";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, { scale: 3 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${cert.courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`);

        document.body.removeChild(clone);
    };

    const handleShareCertificate = (cert) => {
        const link = `https://yourplatform.com/certificate/verify/${cert.id}`;
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

                {certificates.length === 0 ? (
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
                                            <button onClick={() => handleDownloadCertificate(cert)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                                                <FaDownload /> Download
                                            </button>
                                            <button onClick={() => handleShareCertificate(cert)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                                                <FaShareAlt /> Share
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Hidden Certificate Layout */}
                                {cert.status === "Issued" && (
                                    <div
                                        id={`certificate-${cert.id}`}
                                        className="hidden w-[1200px] h-[850px] p-12 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden"
                                        style={{
                                            fontFamily: "Georgia, serif",
                                            backgroundImage: "url('/images/paper-texture.png')",
                                            backgroundSize: "cover",
                                            backgroundColor: "white",
                                            position: "relative",
                                            border: "14px solid #FFD700", // 🟡 Solid Yellow (Gold)
                                            borderImageSlice: 1,
                                            borderWidth: "14px",
                                            borderImageSource: "linear-gradient(45deg, #FFD700, #FFB800)",
                                            boxShadow: "0 0 20px 4px #FFD700",
                                            color: "#333",
                                        }}
                                    >

                                        {/* Top Logo */}
                                        <div className="w-full flex justify-center mb-6">
                                            <img src="/images/certificate/logo.png" alt="Platform Logo" className="w-32" />
                                        </div>

                                        {/* Presented By */}
                                        <p className="text-sm uppercase tracking-widest text-gray-500">Presented by SkillBridge</p>

                                        {/* Certificate Title */}
                                        <h1 className="text-6xl font-extrabold text-yellow-600 mt-3 mb-6" style={{ fontFamily: "'Great Vibes', cursive" }}>
                                            Certificate of Completion
                                        </h1>

                                        {/* Recipient */}
                                        <p className="text-lg text-gray-600">This is proudly awarded to</p>
                                        <h2 className="text-5xl font-extrabold text-gray-900 mt-3 mb-6">{cert.studentName}</h2>

                                        {/* Course Title */}
                                        <p className="text-lg text-gray-600">for successfully completing</p>
                                        <h3 className="text-2xl font-semibold text-gray-700 mt-2 mb-6">{cert.courseTitle}</h3>

                                        {/* Grade */}
                                        <p className="text-lg text-gray-600 mt-4">
                                            Final Grade: <span className="font-bold text-green-600 text-2xl">{cert.grade}</span>
                                        </p>


                                        {/* Issue Date */}
                                        <p className="text-sm text-gray-500 mb-8">Issued on {new Date(cert.issueDate).toLocaleDateString()}</p>

                                        {/* Serial Number */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "24px",
                                                right: "40px",
                                                backgroundColor: "#fff",
                                                padding: "6px 14px",
                                                borderRadius: "10px",
                                                border: "1px solid #FFD700",
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            Serial: {cert.serialNumber}
                                        </div>

                                        {/* Bottom Section */}
                                        <div className="absolute bottom-10 w-full flex justify-between items-center px-20">
                                            {/* Instructor */}
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600 mt-1">Instructor</p>
                                                <h2 className="text-2xl font-semibold">{cert.InstrucorName}</h2> 
                                                <img src="/images/certificate/instructor-signature.png" alt="Instructor Signature" className="w-28 mx-auto mb-1" />
                                            </div>

                                            {/* QR Code */}
                                            <div className="text-center">
                                                <QRCode value={`https://yourplatform.com/certificate/verify/${cert.id}`} size={80} bgColor="#FFFFFF" fgColor="#222222" />
                                                <p className="text-[10px] text-gray-500 mt-1">Scan to Verify</p>
                                            </div>

                                            {/* Platform Official */}
                                            <div className="text-center">
                                                <p className="text-2xl italic font-bold text-gray-700">SkillBridge</p>
                                                <p className="text-sm text-gray-500">Platform Official</p>
                                            </div>
                                        </div>

                                    </div>

                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
