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
import PayPalForm from '@/components/payments/forms/PayPalForm';
import BankTransferForm from '@/components/payments/forms/BankTransferForm';
import CryptoPaymentForm from '@/components/payments/forms/CryptoPaymentForm';
import CardPaymentForm from '@/components/payments/forms/CardPaymentForm';
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
  return (
    iconMap[getMethodIdentifier(method).toLowerCase()] || <FaMoneyCheckAlt />
  );
}

function getMethodIdentifier(method) {
  if (method?.type && method.type.trim()) return method.type.trim();
  if (method?.name && method.name.trim()) return method.name.trim();
  return '';
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

    const attemptParse = (str) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed) && parsed.length === 1) {
          const p = parsed[0] || {};
          if (!p.id) return null;
          return { id: p.id, type: p.itemType || p.item_type || 'class' };
        }
      } catch {}
      return null;
    };

    let result = attemptParse(decoded);
    if (result) return result;

    // Fallback: handle cases where the query was encoded without quoting keys/values
    try {
      const fixed = decoded
        .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:\s*([^,"}\]\s][^,}\]]*)/g, ':"$1"');
      result = attemptParse(fixed);
      if (result) return result;
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
  // Use the payment method "type" as identifier. Default to the method marked
  // as default, or the first active method if none is marked.
  const [selectedMethod, setSelectedMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [allowInstallments, setAllowInstallments] = useState(false);
  const finalPrice = useMemo(
    () => Math.max((itemInfo?.price ?? 0) - discount, 0),
    [itemInfo, discount]
  );
  const isFree = finalPrice === 0;
  // Normalize the selected payment method to avoid case or whitespace mismatches
  const normalizedMethod = (selectedMethod || '')
    .toString()
    .trim()
    .toLowerCase();

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
        const methodsList = Array.isArray(data) ? data : [];
        setMethods(methodsList);
        if (methodsList.length > 0) {
          const defaultMethod =
            methodsList.find((m) => m.is_default) || methodsList[0];
          setSelectedMethod((prev) =>
            prev || getMethodIdentifier(defaultMethod)
          );
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
    const formattedCode = promoCode.trim().toUpperCase();
    setPromoCode(formattedCode);
    try {
      const data = await validateCode(formattedCode, itemType, itemId);
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

  const handlePayment = async (_formData = {}) => {
    if (normalizedMethod === 'bank') {
      try {
        setPaymentStatus('processing');
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
          ..._formData,
        };
        if (couponId) payload.coupon_id = couponId;
        await initiateBankPayment(payload);
        setPaymentStatus('submitted_bank');
      } catch (err) {
        console.error('Failed to initiate bank transfer', err);
        setPaymentStatus('idle');
      }
      return;
    }
    if (normalizedMethod === 'paypal') {
      try {
        setPaymentStatus('processing');
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
        };
        if (couponId) payload.coupon_id = couponId;
        const data = await initiatePayPalPayment(payload);
        if (data?.approval_url) window.location.href = data.approval_url;
      } catch (err) {
        console.error('Failed to initiate PayPal payment', err);
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    if (normalizedMethod === 'usdt' || normalizedMethod === 'nft') {
      try {
        setPaymentStatus('processing');
        const method = methods.find(
          (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
        );
        const payload = {
          item_id: itemInfo.id,
          item_type: itemType,
          amount: finalPrice,
          method_type: method?.type || getMethodIdentifier(method),
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
    availableMethods.find(
      (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
    )?.name || selectedMethod;

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
              {availableMethods.map((method) => {
                const identifier = getMethodIdentifier(method);
                return (
                  <button
                    key={method.id || identifier}
                    onClick={() => setSelectedMethod(identifier)}
                    className={`flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all border
                  ${selectedMethod === identifier ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
                  >
                    <div className="text-2xl" data-testid={`payment-icon-${identifier.toLowerCase()}`}>
                      {resolveIconElement(method)}
                    </div>
                    <div>{method.name}</div>
                  </button>
                );
              })}
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
          ) : paymentStatus === 'submitted_bank' ? (
            <div className="text-yellow-400 text-center text-lg py-6">
              Your bank transfer request has been submitted and is pending admin approval.
            </div>
          ) : normalizedMethod === 'paypal' ? (
            <PayPalForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : normalizedMethod === 'bank' ? (
            <BankTransferForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : normalizedMethod === 'usdt' || normalizedMethod === 'nft' ? (
            <CryptoPaymentForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : (
            <CardPaymentForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              allowInstallments={allowInstallments}
              installments={installments}
              perInstallment={perInstallment}
              finalPrice={finalPrice}
              selectedMethodLabel={selectedMethodLabel}
            />
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
