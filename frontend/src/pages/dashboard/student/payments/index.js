import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaCreditCard, FaClock, FaCheckCircle, FaDownload, FaFileInvoice } from "react-icons/fa";

const mockPayments = [
  { id: 1, title: "React Bootcamp", amount: 49, method: "Stripe", date: "2025-04-01", status: "Paid" },
  { id: 2, title: "Python Basics", amount: 39, method: "PayPal", date: "2025-04-15", status: "Paid" },
  { id: 3, title: "Node.js Fundamentals", amount: 59, method: "Bank Transfer", date: "2025-05-05", status: "Pending" },
];

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments(mockPayments);
  }, []);

  const totalPaid = payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter(p => p.status === "Pending").length;

  const downloadInvoicePDF = async (id) => {
    const element = document.getElementById(`invoice-${id}`);
    if (!element) return alert("Invoice not found");
  
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff", // Fix transparency issues
        scale: 2, // High quality
      });
  
      const imgData = canvas.toDataURL("image/jpeg", 1.0); // ✅ use JPEG
      const pdf = new jsPDF("p", "mm", "a4");
  
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${id}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("❌ Failed to generate invoice. Please try again.");
    }
  };
  

  return (
    <StudentLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-gray-800">
        <h1 className="text-3xl font-bold text-yellow-500">💳 Payment History</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaCheckCircle className="text-2xl text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <h2 className="text-xl font-semibold">${totalPaid}</h2>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaClock className="text-2xl text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <h2 className="text-xl font-semibold">{pending}</h2>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaCreditCard className="text-2xl text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <h2 className="text-xl font-semibold">{payments.length}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Class</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3">${p.amount}</td>
                  <td className="p-3">{p.method}</td>
                  <td className="p-3">{p.date}</td>
                  <td className={`p-3 font-medium ${p.status === "Paid" ? "text-green-600" : "text-yellow-600"}`}>{p.status}</td>
                  <td className="p-3">
                    <button
                      onClick={() => downloadInvoicePDF(p.id)}
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <FaFileInvoice /> Download
                    </button>
                    <div id={`invoice-${p.id}`} className="hidden">
                      <div className="p-4 w-[600px] bg-white text-black">
                        <h2 className="text-xl font-bold mb-2">Invoice #{p.id}</h2>
                        <p><strong>Course:</strong> {p.title}</p>
                        <p><strong>Amount:</strong> ${p.amount}</p>
                        <p><strong>Status:</strong> {p.status}</p>
                        <p><strong>Date:</strong> {p.date}</p>
                        <p><strong>Student:</strong> Sara Ali</p>
                        <p><strong>Email:</strong> sara@example.com</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-sm text-yellow-800">
          For any payment issues, contact <a href="mailto:support@skillbridge.com" className="underline font-medium">support@skillbridge.com</a>
        </div>
      </div>
    </StudentLayout>
  );
}
