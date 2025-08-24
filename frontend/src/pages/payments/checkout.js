import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { fetchPaymentMethods } from '@/services/paymentMethodService';
import { fetchClassDetails } from '@/services/classService';
import { fetchTutorialDetails } from '@/services/tutorialService';
import { validateCode } from '@/services/couponService';
import { initiateBankPayment, initiateCryptoPayment, initiatePayPalPayment } from '@/services/paymentService';
import useCartStore from '@/store/cart/cartStore';
import { useShallow } from 'zustand/react/shallow';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { toast } from 'react-toastify';
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

function resolveIconElement(method) {
  if (method.icon) {
    const lower = method.icon.toLowerCase();
    const isUrl = /^(https?:)?\/\//.test(method.icon) || method.icon.includes('.');
    if (isUrl) {
      return (
        <img
          src={method.icon}
          alt={method.name}
          className="w-8 h-8 object-contain"
        />
      );
    }
    if (iconMap[lower]) return iconMap[lower];
  }
  return iconMap[method.type?.toLowerCase()] || <FaMoneyCheckAlt />;
}

export function resolveCheckoutItem(query, cartItems) {
  const { itemId, itemType, items } = query;

  if (itemId && itemType) {
    return { id: itemId, type: itemType };
  }

  const parseItems = (value) => {
    if (!value) return null;

    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return null;

    let decoded = raw;
    try {
      decoded = decodeURIComponent(decoded);
      decoded = decodeURIComponent(decoded);
    } catch {
      // ignore decode errors; we'll attempt to parse whatever we have
    }

    try {
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed) && parsed.length === 1) {
        const p = parsed[0] || {};
        if (!p.id) return null;
        return { id: p.id, type: p.itemType || p.item_type || 'class' };
      }
    } catch (err) {
      console.error('Failed to parse checkout items', err);
    }
    return null;
  };

  const resolvedFromItems = parseItems(items);
  if (resolvedFromItems) return resolvedFromItems;

  if (Array.isArray(cartItems) && cartItems.length === 1) {
    const c = cartItems[0];
    if (c && c.id) {
      return { id: c.id, type: c.item_type || 'class' };
    }
  }

  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  // Use shallow comparison so store updates unrelated to items do not trigger
  // unnecessary renders that can lead to nested update loops.
  const { items: cartItems, removeItem } = useCartStore(
    useShallow((state) => ({ items: state.items, removeItem: state.removeItem }))
  );
  const resolvedItem = useMemo(() => {
    if (!router.isReady) return null;
    return resolveCheckoutItem(router.query, cartItems);
  }, [router.isReady, router.query, cartItems]);
  const itemId = resolvedItem?.id;
  const itemType = resolvedItem?.type;
  const checkoutError = router.isReady && !resolvedItem
    ? 'Please select exactly one item to checkout'
    : '';
  const [itemInfo, setItemInfo] = useState(null);
  const [methods, setMethods] = useState([]);
  // Use the payment method "type" as identifier. Default to first active method once loaded.
  const [selectedMethod, setSelectedMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [allowInstallments, setAllowInstallments] = useState(false);
  const finalPrice = useMemo(
    () => Math.max((itemInfo?.price ?? 0) - discount, 0),
    [itemInfo, discount]
  );
  const isFree = finalPrice === 0;

  useEffect(() => {
    if (!itemId || !itemType) return;
    let active = true;
    const load = async () => {
      try {
        const details =
          itemType === 'tutorial'
            ? await fetchTutorialDetails(itemId)
            : await fetchClassDetails(itemId);
        if (active) setItemInfo(details?.data ?? details);
      } catch (err) {
        console.error('Failed to load item', err);
      }
      try {
        const data = await fetchPaymentMethods();
        if (!active) return;
        setMethods(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedMethod((prev) => prev || data[0].type);
        }
      } catch (err) {
        console.error('Failed to load payment methods', err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [itemId, itemType]);


  const handleApplyPromo = async () => {
    try {
      const data = await validateCode(promoCode, itemType, itemId);
      setDiscount(data.discount_percent);
      setCouponId(data.id);
      toast.success('Promo code applied');
    } catch (err) {
      setDiscount(0);
      setCouponId(null);
      if (err?.response?.status === 404) {
        toast.error('Invalid promo code');
      } else {
        toast.error('Failed to apply promo code. Please try again.');
      }
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
      await Promise.resolve(removeItem(itemInfo.id));
    } catch (err) {
      console.error('Failed to remove from cart', err);
    }
    setPaymentStatus('success');
    setTimeout(
      () => router.push(`/payments/success?itemType=${itemType}&itemId=${itemInfo.id}`),
      1500
    );
  };

  const handlePayment = async () => {
    if (selectedMethod === 'bank') {
      try {
        setPaymentStatus('processing');
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
        };
        if (couponId) payload.coupon_id = couponId;
        const data = await initiateBankPayment(payload);
        setBankInfo(data);
        setInvoicePreview(true);
      } catch (err) {
        console.error('Failed to initiate bank transfer', err);
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    if (selectedMethod === 'paypal') {
      try {
        setPaymentStatus('processing');
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
        };
        const data = await initiatePayPalPayment(payload);
        if (data?.approval_url) window.location.href = data.approval_url;
      } catch (err) {
        console.error('Failed to initiate PayPal payment', err);
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    if (selectedMethod === 'usdt' || selectedMethod === 'nft') {
      try {
        setPaymentStatus('processing');
        const method = methods.find((m) => m.type === selectedMethod);
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
          method_type: method?.type,
        };
        if (couponId) payload.coupon_id = couponId;
        const data = await initiateCryptoPayment(payload);
        if (data?.invoice_url) window.location.href = data.invoice_url;
      } catch (err) {
        console.error('Failed to initiate crypto payment', err);
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    setPaymentStatus('processing');
    setTimeout(completePayment, 1500);
  };


  useEffect(() => {
    if (selectedMethod !== 'bank') {
      setInvoicePreview(false);
      setBankInfo(null);
    }
  }, [selectedMethod]);

  const downloadInvoice = () => {
    if (!bankInfo) return;
    const invoiceNumber =
      bankInfo.invoiceNumber || bankInfo.invoice_number || bankInfo.reference || Date.now();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Invoice ${invoiceNumber}</title></head><body>` +
      `<h1>Invoice #${invoiceNumber}</h1>` +
      `<p>Item: ${itemInfo.title}</p>` +
      `<p>Amount: $${finalPrice}</p>` +
      `<p>Bank: ${bankInfo.bankName || bankInfo.bank_name}</p>` +
      `<p>Account Number: ${bankInfo.accountNumber || bankInfo.account_number}</p>` +
      `<p>IBAN: ${bankInfo.iban}</p>` +
      `</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (checkoutError) return <div className="text-white text-center mt-32">{checkoutError}</div>;
  if (!itemInfo) return <div className="text-white text-center mt-32">Loading...</div>;
  const installments = 3;
  const perInstallment = finalPrice / installments;
  const schedule = Array.from({ length: installments }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return { number: i + 1, date: d.toLocaleDateString(), amount: perInstallment.toFixed(2) };
  });
  // Filter out inactive methods if any; the API already returns active ones
  const availableMethods = Array.isArray(methods)
    ? methods.filter((m) => m.active !== false)
    : [];
  const selectedMethodLabel =
    availableMethods.find((m) => m.type === selectedMethod)?.name || selectedMethod;

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

        {!isFree && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Select Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {availableMethods.map((method) => (
                <button
                  key={method.id || method.type}
                  onClick={() => setSelectedMethod(method.type)}
                  className={`flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all border
                  ${selectedMethod === method.type ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
                >
                  <div className="text-2xl" data-testid={`payment-icon-${method.type}`}>
                    {resolveIconElement(method)}
                  </div>
                  <div>{method.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
        </div>

        {!isFree && (
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
        )}

        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> Payment Details</h2>

          {isFree ? (
            <div className="text-center">
              <p className="mb-4">This item is free. Click below to complete your enrollment.</p>
              <button onClick={completePayment} className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded">
                Enroll for Free
              </button>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="text-green-400 text-center text-lg py-6">
              <FaCheckCircle className="inline mr-2 text-2xl" /> Payment Successful! Redirecting...
            </div>
          ) : selectedMethod === 'usdt' || selectedMethod === 'nft' ? (
            <div className="bg-gray-900 p-4 rounded text-sm text-gray-300">
              <p><strong>Crypto Payment</strong></p>
              <p className="mb-2">You'll be redirected to complete this payment.</p>
              <button onClick={handlePayment} className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded font-bold">
                Pay with Crypto
              </button>
            </div>
          ) : selectedMethod === 'paypal' ? (
            <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 text-center">
              <p><strong>PayPal Payment</strong></p>
              <p className="mb-2">You'll be redirected to PayPal to complete this payment.</p>
              <button
                onClick={handlePayment}
                disabled={paymentStatus === 'processing'}
                className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded font-bold"
              >
                {paymentStatus === 'processing' ? 'Processing...' : 'Pay with PayPal'}
              </button>
            </div>
          ) : invoicePreview && selectedMethod === 'bank' ? (
            <div className="bg-gray-900 p-4 rounded text-sm text-gray-300">
              <p><strong>Invoice #{bankInfo?.invoiceNumber || bankInfo?.invoice_number || bankInfo?.reference}</strong></p>
              <p className="mt-2">{itemType === 'tutorial' ? 'Tutorial' : 'Class'}: {itemInfo.title}</p>
              <p>Price: ${finalPrice}</p>
              <p>Bank: {bankInfo?.bankName || bankInfo?.bank_name}</p>
              <p>Account Number: {bankInfo?.accountNumber || bankInfo?.account_number}</p>
              <p>IBAN: {bankInfo?.iban}</p>
              <button onClick={downloadInvoice} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded mb-4">
                <FaDownload /> Download Invoice
              </button>
              <p className="text-yellow-400">After completing the transfer, upload your receipt via "My Payments".</p>
              <button
                className="mt-4 py-2 px-6 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600"
                onClick={() => router.push('/payments')}
              >Go to My Payments</button>
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
                {paymentStatus === 'processing'
                  ? 'Processing...'
                  : allowInstallments
                  ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
                  : `Pay $${finalPrice} with ${selectedMethodLabel}`}
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
