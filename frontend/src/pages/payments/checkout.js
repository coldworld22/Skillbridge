import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { fetchPaymentMethods, fetchPayPalClientId } from '@/services/paymentMethodService';
import { fetchClassDetails } from '@/services/classService';
import { fetchTutorialDetails } from '@/services/tutorialService';
import { validateCode } from '@/services/couponService';
import useCartStore from '@/store/cart/cartStore';
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
  const { itemId: queryItemId, itemType: queryItemType, items: queryItems } = router.query;
  const { items: cartItems, removeItem } = useCartStore((state) => ({
    items: state.items,
    removeItem: state.removeItem,
  }));
  const [itemId, setItemId] = useState();
  const [itemType, setItemType] = useState();
  const [itemInfo, setItemInfo] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [invoicePreview, setInvoicePreview] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const parsedItems = useMemo(() => {
    if (!queryItems) return [];
    try {
      return JSON.parse(decodeURIComponent(queryItems));
    } catch {
      return [];
    }
  }, [queryItems]);
  const firstItemId = parsedItems[0]?.id || cartItems[0]?.id;
  const firstItemType = parsedItems[0]?.itemType || cartItems[0]?.item_type;
  useEffect(() => {
    const id = queryItemId || firstItemId;
    const type = queryItemType || firstItemType || 'class';
    if (!id) return;
    if (id !== itemId) setItemId(id);
    if (type !== itemType) setItemType(type);
  }, [queryItemId, queryItemType, firstItemId, firstItemType, itemId, itemType]);

  useEffect(() => {
    if (!itemId || !itemType) return;
    const load = async () => {
      try {
        const details =
          itemType === 'tutorial'
            ? await fetchTutorialDetails(itemId)
            : await fetchClassDetails(itemId);
        setItemInfo(details?.data ?? details);
      } catch (err) {
        console.error('Failed to load item', err);
      }
      try {
        const data = await fetchPaymentMethods();
        setMethods(data);
        if (data.length > 0) setSelectedMethod(data[0].name);
      } catch (err) {
        console.error('Failed to load payment methods', err);
      }
    };
    load();
  }, [itemId, itemType]);

  useEffect(() => {
    const loadId = async () => {
      try {
        const id = await fetchPayPalClientId();
        setPaypalClientId(id || '');
      } catch (err) {
        console.error('Failed to load PayPal client ID', err);
      }
    };
    loadId();
  }, []);

  const handleApplyPromo = async () => {
    try {
      const data = await validateCode(promoCode);
      setDiscount(data.discount_percent);
      setError('');
    } catch {
      setDiscount(0);
      setError('Invalid promo code');
    }
  };

  const completePayment = async () => {
    const storageKey = itemType === 'tutorial' ? 'enrolledTutorials' : 'enrolledClasses';
    const enrolled = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newItem = {
      id: itemInfo.id,
      title: itemInfo.title,
      instructor: itemInfo.instructor,
      startDate: new Date().toISOString(),
      status: 'Live',
      joined: true,
    };
    localStorage.setItem(storageKey, JSON.stringify([...enrolled, newItem]));
    try {
      await removeItem(itemInfo.id);
    } catch (err) {
      console.error('Failed to remove from cart', err);
    }
    setPaymentStatus('success');
    setTimeout(
      () => router.push(`/payments/success?itemType=${itemType}&itemId=${itemInfo.id}`),
      1500
    );
  };

  const handlePayment = () => {
    setPaymentStatus('processing');
    setTimeout(completePayment, 1500);
  };

  const renderPayPalButton = (amount) => {
    if (!window.paypal) return;
    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';
    window.paypal.Buttons({
      createOrder: (_, actions) =>
        actions.order.create({
          purchase_units: [{ amount: { value: amount } }],
        }),
      onApprove: async (_, actions) => {
        setPaymentStatus('processing');
        await actions.order.capture();
        completePayment();
      },
      onError: (err) => {
        console.error('PayPal error', err);
        setPaymentStatus('idle');
      },
    }).render('#paypal-button-container');
  };

  useEffect(() => {
    if (selectedMethod !== 'paypal' || !itemInfo) return;
    const amount = (itemInfo.price - discount).toString();
    if (!paypalLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}`;
      script.addEventListener('load', () => {
        setPaypalLoaded(true);
        renderPayPalButton(amount);
      });
      document.body.appendChild(script);
    } else {
      renderPayPalButton(amount);
    }

  }, [selectedMethod, itemInfo, discount, paypalLoaded]);

  const handleFileChange = (e) => setReceipt(e.target.files[0]);
  const generatePDF = () => alert('Invoice PDF downloaded (mocked)');

  if (!itemInfo) return <div className="text-white text-center mt-32">Loading...</div>;
  const finalPrice = itemInfo.price - discount;
  const installments = 3;
  const perInstallment = finalPrice / installments;
  const schedule = Array.from({ length: installments }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return { number: i + 1, date: d.toLocaleDateString(), amount: perInstallment.toFixed(2) };
  });
  const availableMethods = methods.filter((m) => m.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-20 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">Checkout</h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-6 items-center">
          <img
            src={itemType === 'tutorial' ? itemInfo.thumbnail : itemInfo.cover_image}
            alt={itemInfo.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div>
            <h2 className="text-xl font-semibold">{itemInfo.title}</h2>
            <p className="text-sm text-gray-400">Instructor: {itemInfo.instructor}</p>
            <p className="mt-2 font-bold text-lg">Price: ${itemInfo.price}</p>
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
                  {iconMap[method.icon?.toLowerCase()] || <FaMoneyCheckAlt />}
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

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Installments</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowInstallments} onChange={(e) => setAllowInstallments(e.target.checked)} />
            Pay in {installments} monthly installments
          </label>
          {allowInstallments && (
            <ul className="mt-4 text-sm text-gray-300">
              {schedule.map((s) => (
                <li key={s.number}>Installment {s.number}: ${s.amount} due {s.date}</li>
              ))}
            </ul>
          )}
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
              <p className="mt-2">{itemType === 'tutorial' ? 'Tutorial' : 'Class'}: {itemInfo.title}</p>
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
                onClick={() => router.push(`/payments/success?itemType=${itemType}&itemId=${itemInfo.id}`)}
              >Done</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
              <input type="text" placeholder="Full Name" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
              <input type="email" placeholder="Email Address" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
              {selectedMethod !== 'bank' && selectedMethod !== 'paypal' && (
                <>
                  <input type="tel" placeholder="Card Number" required inputMode="numeric" className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
                  <input type="text" placeholder="Expiration Date (MM/YY)" required className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white" />
                  <input type="text" placeholder="CVC" required className="w-full mb-6 p-3 text-sm rounded bg-gray-700 text-white" />
                </>
              )}
              {selectedMethod === 'paypal' && <div id="paypal-button-container" className="mb-4"></div>}
              {selectedMethod !== 'paypal' && (
                <button type="submit" disabled={paymentStatus === 'processing'} className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all">
                  {paymentStatus === 'processing'
                    ? 'Processing...'
                    : allowInstallments
                    ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}`
                    : `Pay $${finalPrice} with ${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}`}
                </button>
              )}
              <p className="text-sm text-gray-500 mt-2 text-center">You'll be redirected after successful payment.</p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
