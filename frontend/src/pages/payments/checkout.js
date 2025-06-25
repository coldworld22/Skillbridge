import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchPaymentMethods } from '@/services/paymentMethodService';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import {
  FaCcStripe, FaPaypal, FaMoneyCheckAlt, FaUniversity,
  FaEthereum, FaFileInvoice, FaDownload, FaCheckCircle
} from 'react-icons/fa';

const iconMap = {
  stripe: <FaCcStripe />,
  paypal: <FaPaypal />,
  moyasar: <FaMoneyCheckAlt />,
  paystack: <FaMoneyCheckAlt />,
  bank: <FaUniversity />,
  nft: <FaEthereum />,
  usdt: <FaEthereum />,
  binance: <FaEthereum />,
  coinbase: <FaEthereum />,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { classId } = router.query;
  const [classInfo, setClassInfo] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [invoicePreview, setInvoicePreview] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle');

  const mockClasses = [
    {
      id: '2',
      title: 'React & Next.js Bootcamp',
      instructor: 'Ayman Khalid',
      price: 49,
      linkId: 'react-bootcamp',
      image: 'https://bs-uploads.toptal.io/.../nextjs.png'
    }
  ];

  useEffect(() => {
    if (classId) {
      const found = mockClasses.find((cls) => cls.id === classId);
      setClassInfo(found);
    }
    const loadMethods = async () => {
      try {
        const data = await fetchPaymentMethods();
        setMethods(data);
        if (data.length > 0) setSelectedMethod(data[0].name);
      } catch (err) {
        console.error('Failed to load payment methods', err);
      }
    };
    loadMethods();
  }, [classId]);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'DISCOUNT10') {
      setDiscount(10);
      setError('');
    } else {
      setDiscount(0);
      setError('Invalid promo code');
    }
  };

  const handlePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      const enrolled = JSON.parse(localStorage.getItem("enrolledClasses") || "[]");
      const newClass = {
        id: classInfo.id,
        title: classInfo.title,
        instructor: classInfo.instructor,
        startDate: new Date().toISOString(),
        status: "Live",
        joined: true,
        linkId: classInfo.linkId
      };
      localStorage.setItem("enrolledClasses", JSON.stringify([...enrolled, newClass]));
      setPaymentStatus('success');
      setTimeout(() => router.push(`/payments/success?linkId=${classInfo.linkId}`), 1500);
    }, 1500);
  };

  const handleFileChange = (e) => setReceipt(e.target.files[0]);
  const generatePDF = () => alert('Invoice PDF downloaded (mocked)');

  if (!classInfo) return <div className="text-white text-center mt-32">Loading...</div>;
  const finalPrice = classInfo.price - discount;
  const availableMethods = methods.filter((m) => m.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-20 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">Checkout</h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-6 items-center">
          <img src={classInfo.image} alt={classInfo.title} className="w-32 h-32 object-cover rounded-lg" />
          <div>
            <h2 className="text-xl font-semibold">{classInfo.title}</h2>
            <p className="text-sm text-gray-400">Instructor: {classInfo.instructor}</p>
            <p className="mt-2 font-bold text-lg">Price: ${classInfo.price}</p>
            {discount > 0 && <p className="text-green-400">Discount Applied: -${discount}</p>}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Select Payment Method</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {availableMethods.map((method) => (
              <button
                key={method.name}
                onClick={() => setSelectedMethod(method.name)}
                className={`flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all border
                  ${selectedMethod === method.name ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
              >
                <div className="text-2xl">
                  {iconMap[method.icon.toLowerCase()] || <FaMoneyCheckAlt />}
                </div>
                <div>{method.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Promo Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-1 p-2 rounded bg-gray-700 text-white"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600"
            >Apply</button>
          </div>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Payment Details</h2>

          {paymentStatus === 'success' ? (
            <div className="text-green-400 text-center text-lg py-6">
              <FaCheckCircle className="inline mr-2 text-2xl" /> Payment Successful! Redirecting...
            </div>
          ) : selectedMethod === 'usdt' || selectedMethod === 'nft' ? (
            <div className="bg-gray-900 p-4 rounded text-sm text-gray-300">
              <p><strong>Crypto Payment</strong></p>
              <p className="mb-2">Connect your wallet to verify ownership.</p>
              <button onClick={handlePayment} className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded font-bold">
                Connect Wallet & Verify
              </button>
              <p className="text-yellow-400 mt-2">You'll be redirected after validation.</p>
            </div>
          ) : invoicePreview && selectedMethod === 'bank' ? (
            <div className="bg-gray-900 p-4 rounded text-sm text-gray-300">
              <p><strong>Invoice</strong></p>
              <p className="mt-2">Class: {classInfo.title}</p>
              <p>Price: ${finalPrice}</p>
              <p>Bank: Al Rajhi</p>
              <p>IBAN: SA442000000123456789</p>
              <label className="block mt-4">Upload Transfer Receipt:</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="mb-4 p-2 w-full rounded bg-gray-700 text-white" />
              <button onClick={generatePDF} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded mb-4">
                <FaDownload /> Download Invoice (PDF)
              </button>
              <button
                className="mt-4 py-2 px-6 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600"
                onClick={() => router.push(`/payments/success?linkId=${classInfo.linkId}`)}
              >Done</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
              <input type="text" placeholder="Full Name" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
              <input type="email" placeholder="Email Address" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
              {selectedMethod !== 'bank' && (
                <>
                  <input type="tel" placeholder="Card Number" required inputMode="numeric" className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
                  <input type="text" placeholder="Expiration Date (MM/YY)" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
                  <input type="text" placeholder="CVC" required className="w-full mb-6 p-3 text-sm rounded bg-gray-700 text-white" />
                </>
              )}
              <button type="submit" disabled={paymentStatus === 'processing'} className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all">
                {paymentStatus === 'processing' ? 'Processing...' : `Pay $${finalPrice} with ${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}`}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">You'll be redirected after successful payment.</p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
