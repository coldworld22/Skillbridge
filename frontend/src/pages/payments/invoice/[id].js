// pages/payments/invoice/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaDownload } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { uploadReceipt } from '@/services/student/paymentService';
import {
  fetchInvoiceByPaymentId,
  downloadInvoice,
} from '@/services/student/invoiceService';

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        const data = await fetchInvoiceByPaymentId(id);
        if (active) setInvoiceData(data);
      } catch (err) {
        console.error('Failed to load invoice', err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const downloadPDF = () => {
    if (invoiceData?.id) {
      downloadInvoice(invoiceData.id);
    }
  };

  if (!invoiceData) return <div className="text-white text-center mt-32">Loading Invoice...</div>;

  const subtotal = Number(invoiceData.price ?? invoiceData.amount ?? 0);
  const discount = Number(invoiceData.discount ?? invoiceData.discount_amount ?? 0);
  const total = invoiceData.total ?? subtotal - discount;
  const method = (invoiceData.payment_method || invoiceData.paymentMethod || '').toLowerCase();
  const isBank = method === 'bank';

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadReceipt(file);
      alert('Receipt uploaded');
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-yellow-400">Invoice #{invoiceData.id}</h1>
            <span className={`px-3 py-1 text-sm rounded-full ${invoiceData.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>{invoiceData.status.toUpperCase()}</span>
          </div>

          <div className="mb-4 text-sm text-gray-300">
            <p><strong>Student:</strong> {invoiceData.studentName || invoiceData.student_name}</p>
            <p><strong>Class:</strong> {invoiceData.classTitle || invoiceData.item_name}</p>
            <p><strong>Instructor:</strong> {invoiceData.instructor || invoiceData.instructor_name}</p>
            <p><strong>Date:</strong> {invoiceData.date || invoiceData.created_at}</p>
            <p><strong>Payment Method:</strong> {method}</p>
          </div>

          <div className="my-6 border-t border-gray-700 pt-6">
            <div className="flex justify-between mb-2 text-gray-400">
              <span>Subtotal:</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-400">
              <span>Discount:</span>
              <span className="text-red-400">-${discount}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>${total}</span>
            </div>
          </div>

          {isBank && (
            <div className="mt-8 bg-gray-900 p-4 rounded">
              <p className="mb-1 text-yellow-400 font-bold">Bank Transfer Details</p>
              <p><strong>Bank:</strong> {invoiceData.bankName || invoiceData.bank_name}</p>
              <p><strong>IBAN:</strong> {invoiceData.iban || invoiceData.bank_iban}</p>
              <p className="mt-2 text-sm text-gray-400">Send transfer proof to <strong>support@skillbridge.com</strong></p>

              <div className="mt-4">
                <QRCode value={`Invoice:${invoiceData.id}|Total:${total}`} size={100} fgColor="#facc15" bgColor="#1f2937" />
              </div>

              <div className="mt-6">
                <label className="block mb-2 text-sm font-medium text-white">Upload Transfer Proof</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleReceiptUpload} className="w-full text-sm bg-gray-700 p-2 rounded border border-gray-600" />
              </div>
            </div>
          )}

          {['stripe', 'paypal', 'moyasar'].includes(method) && (
            <div className="mt-10 text-sm text-gray-400">
              <p>You will be redirected to complete your payment securely via <strong className="capitalize">{method}</strong>.</p>
            </div>
          )}

          <button
            onClick={downloadPDF}
            className="mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
          >
            <FaDownload /> Download Invoice
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
