// components/certificates/CertificatePreview.js
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CertificatePreview({ studentName, courseTitle }) {
  const certRef = useRef();

  const handleDownload = async () => {
    const element = certRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`Certificate-${studentName}.pdf`);
  };

  return (
    <div className="text-center text-white">
      <div
        ref={certRef}
        className="w-[1000px] h-[700px] bg-white text-black mx-auto p-12 border-[20px] border-yellow-400 rounded-xl shadow-xl font-serif relative"
      >
        <h1 className="text-5xl font-bold text-center text-yellow-600 mb-6">
          Certificate of Completion
        </h1>
        <p className="text-xl mt-12 mb-4">This certifies that</p>
        <h2 className="text-3xl font-bold text-blue-800">{studentName}</h2>
        <p className="text-xl mt-4">has successfully completed</p>
        <h3 className="text-2xl font-semibold mt-2 text-green-700">{courseTitle}</h3>
        <p className="mt-6 text-sm text-gray-600 italic">Issued on {new Date().toLocaleDateString()}</p>

        <div className="absolute bottom-12 left-12">
          <div className="border-t-2 border-black w-48 mt-2" />
          <p className="text-xs mt-1">Instructor Signature</p>
        </div>
        <div className="absolute bottom-12 right-12 text-right">
          <div className="border-t-2 border-black w-48 mt-2" />
          <p className="text-xs mt-1">Verified by SkillBridge</p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded"
      >
        Download Certificate as PDF
      </button>
    </div>
  );
}
