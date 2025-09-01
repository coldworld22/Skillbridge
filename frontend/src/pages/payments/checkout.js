import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { fetchPaymentMethods } from '@/services/paymentMethodService';
import { fetchClassDetails } from '@/services/classService';
import { fetchTutorialDetails } from '@/services/tutorialService';
import { fetchBook } from '@/services/bookService';
import { fetchPlanDetails } from '@/services/public/planService';
import { validateCode } from '@/services/couponService';
import { initiateBankPayment, initiateCryptoPayment, initiatePayPalPayment } from '@/services/paymentService';
import { createPayment } from '@/services/student/paymentService';
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
import { useTranslation } from 'next-i18next';

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
  nowpayments: <FaEthereum />,
};

export function resolveIconElement(method) {
  if (method.icon) {
    const lower = method.icon.toLowerCase();
    const base = lower.split('/').pop().split('.')[0];
    if (iconMap[lower]) return iconMap[lower];
    if (iconMap[base]) return iconMap[base];
    const isUrl = /^(https?:)?\/\//.test(method.icon);
    if (isUrl) {
      return (
        <img
          src={method.icon}
          alt={method.name}
          className="w-8 h-8 object-contain"
        />
      );
    }
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

const CRYPTO_IDENTIFIERS = ['usdt', 'nft', 'binance', 'coinbase', 'nowpayments'];

function isCryptoMethod(methodOrIdentifier) {
  if (!methodOrIdentifier) return false;
  if (typeof methodOrIdentifier === 'string') {
    return CRYPTO_IDENTIFIERS.includes(methodOrIdentifier.toLowerCase());
  }
  if (methodOrIdentifier.category && methodOrIdentifier.category.toLowerCase() === 'crypto') {
    return true;
  }
  return CRYPTO_IDENTIFIERS.includes(
    getMethodIdentifier(methodOrIdentifier).toLowerCase()
  );
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
  const { t } = useTranslation('common');
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
    ? t('checkout_single_item_warning')
    : '';
  const [itemInfo, setItemInfo] = useState(null);
  const [methods, setMethods] = useState([]);
  // Use the payment method "type" as identifier. Default to the method marked
  // as default, or the first active method if none is marked.
  const [selectedMethod, setSelectedMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [allowInstallments, setAllowInstallments] = useState(false);
  const finalPrice = useMemo(
    () => Math.max((itemInfo?.price ?? 0) - discountAmount, 0),
    [itemInfo, discountAmount]
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
        let details;
        if (itemType === 'tutorial') {
          details = await fetchTutorialDetails(itemId);
        } else if (itemType === 'book') {
          details = await fetchBook(itemId);
        } else if (itemType === 'plan') {
          details = await fetchPlanDetails(itemId);
          const data = details?.data ?? details;
          details = { ...data, title: data.name, price: Number(data.price_monthly) };
        } else {
          details = await fetchClassDetails(itemId);
        }
        if (active) setItemInfo(details?.data ?? details);
      } catch (err) {
        console.error('Failed to load item', err);
      }
      try {
        const data = await fetchPaymentMethods();
        if (!active) return;
        const methodsList = Array.isArray(data) ? data : [];
        setMethods(methodsList);
        const activeMethods = methodsList.filter((m) => m.active !== false);
        const eligibleMethods =
          itemType === 'plan'
            ? activeMethods.filter(
                (m) =>
                  !['bank', 'paypal'].includes(
                    getMethodIdentifier(m).toLowerCase()
                  ) &&
                  !isCryptoMethod(m)
              )
            : activeMethods;
        if (eligibleMethods.length > 0) {
          const defaultMethod =
            eligibleMethods.find((m) => m.is_default) || eligibleMethods[0];
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
    if (!formattedCode) {
      toast.error(t('enter_promo_code'));
      return;
    }
    setPromoCode(formattedCode);
    try {
      const data = await validateCode(formattedCode, itemType, itemId);
      const percent = data.discount_percent || 0;
      const amount = ((itemInfo?.price || 0) * percent) / 100;
      setDiscountAmount(amount);
      setDiscountPercent(percent);
      setCouponId(data.id);
      toast.success(t('promo_code_applied'));
    } catch (err) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setCouponId(null);
      if (err?.response?.status === 404) {
        toast.error(t('invalid_promo_code'));
      } else {
        toast.error(t('promo_code_apply_failed'));
      }
    }
  };

  const completePayment = async () => {
    if (itemType === 'plan') {
      setPaymentStatus('success');
      setTimeout(
        () =>
          router.push(
            `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}`
          ),
        1500
      );
      return;
    }
    const storageKey =
      itemType === 'tutorial'
        ? 'enrolledTutorials'
        : itemType === 'book'
        ? 'purchasedBooks'
        : 'enrolledClasses';
    const enrolled = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newItem =
      itemType === 'book'
        ? {
            id: itemInfo.id,
            title: itemInfo.title,
            author: itemInfo.author,
            purchaseDate: new Date().toISOString(),
          }
        : {
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
    const method = filteredMethods.find(
      (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
    );
    const identifier = method
      ? getMethodIdentifier(method).toLowerCase()
      : normalizedMethod;
    const isCrypto = isCryptoMethod(method || identifier);

    if (identifier === 'bank') {
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
        toast.error('Failed to initiate bank transfer. Please try again.');
        setPaymentStatus('idle');
      }
      return;
    }
    if (identifier === 'paypal') {
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
        toast.error('Failed to initiate PayPal payment. Please try again.');
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    if (isCrypto) {
      try {
        setPaymentStatus('processing');
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
        toast.error('Failed to initiate crypto payment. Please try again.');
      } finally {
        setPaymentStatus('idle');
      }
      return;
    }
    try {
      setPaymentStatus('processing');
      const payload = {
        method_id: method?.id,
        item_type: itemType,
        item_id: itemInfo.id,
        amount: finalPrice,
        allow_installments: allowInstallments,
        installments,
      };
      if (couponId) payload.coupon_id = couponId;
      const response = await createPayment(payload);
      if (response?.status === 'paid') {
        await completePayment();
      } else {
        throw new Error('Payment not confirmed');
      }
    } catch (err) {
      console.error('Failed to process payment', err);
      toast.error('Failed to process payment. Please try again.');
      setPaymentStatus('idle');
    }
  };

  const installments = 3;
  const perInstallment = useMemo(
    () => finalPrice / installments,
    [finalPrice, installments]
  );
  const schedule = useMemo(() => {
    if (!allowInstallments) return [];
    const amount = finalPrice / installments;
    return Array.from({ length: installments }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return { number: i + 1, date: d.toLocaleDateString(), amount: amount.toFixed(2) };
    });
  }, [finalPrice, allowInstallments, installments]);

  if (checkoutError) return <div className="text-white text-center mt-32">{checkoutError}</div>;
  if (!itemInfo) return <div className="text-white text-center mt-32">{t('loading')}</div>;
  // Filter out inactive methods if any; the API already returns active ones
  const availableMethods = Array.isArray(methods)
    ? methods.filter((m) => m.active !== false)
    : [];
  const filteredMethods = itemType === 'plan'
    ? availableMethods.filter(
        (m) =>
          !['bank', 'paypal'].includes(
            getMethodIdentifier(m).toLowerCase()
          ) &&
          !isCryptoMethod(m)
      )
    : availableMethods;
  const selectedMethodObj = filteredMethods.find(
    (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
  );
  const selectedMethodIdentifier = selectedMethodObj
    ? getMethodIdentifier(selectedMethodObj).toLowerCase()
    : normalizedMethod;
  const selectedMethodLabel = selectedMethodObj?.name || selectedMethod;
  const isCryptoSelected = isCryptoMethod(
    selectedMethodObj || selectedMethodIdentifier
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-20 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">{t('checkout')}</h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-6 items-center">
          {itemType !== 'plan' && (
            <img
              src={
                itemType === 'tutorial'
                  ? itemInfo.thumbnail
                  : itemType === 'book'
                  ? itemInfo.cover_image_url || itemInfo.cover_image
                  : itemInfo.cover_image
              }
              alt={itemInfo.title}
              className="w-32 h-32 object-cover rounded-lg"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{itemInfo.title}</h2>
            {itemType !== 'plan' && (
              <p className="text-sm text-gray-400">
                {itemType === 'book'
                  ? `Author: ${itemInfo.author}`
                  : `Instructor: ${itemInfo.instructor}`}
              </p>
            )}
            <p className="mt-2 font-bold text-lg">Price: ${itemInfo.price}</p>
            {discountAmount > 0 && (
              <p className="text-green-400">
                Discount Applied: {discountPercent}% (-${discountAmount.toFixed(2)})
              </p>
            )}
          </div>
        </div>

        {!isFree && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> {t('select_payment_method')}</h2>
            {itemType === 'plan' && (
              <p className="text-sm text-yellow-400 mb-4">
                {t(
                  'plans_payment_methods_notice',
                  'Bank transfer, PayPal, and cryptocurrency payment methods are not available for plans.'
                )}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMethods.map((method) => {
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> {t('promo_code')}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('enter_promo_code')}
              className="flex-1 p-2 rounded bg-gray-700 text-white"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600"
            >{t('apply')}</button>
          </div>
        </div>

        {!isFree && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> {t('installments')}</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowInstallments} onChange={(e) => setAllowInstallments(e.target.checked)} />
              {t('pay_in_monthly_installments', { count: installments })}
            </label>
            {allowInstallments && (
              <ul className="mt-4 text-sm text-gray-300">
                {schedule.map((s) => (
                  <li key={s.number}>{t('installment_item', { number: s.number, amount: s.amount, date: s.date })}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> {t('payment_details')}</h2>

          {isFree ? (
            <div className="text-center">
              <p className="mb-4">{t('free_item_notice')}</p>
              <button onClick={completePayment} className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded">
                {t('enroll_for_free')}
              </button>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="text-green-400 text-center text-lg py-6">
              <FaCheckCircle className="inline mr-2 text-2xl" /> {t('payment_successful_redirecting')}
            </div>
          ) : paymentStatus === 'submitted_bank' ? (
            <div className="text-yellow-400 text-center text-lg py-6">
              {t('bank_transfer_pending')}
            </div>
          ) : selectedMethodIdentifier === 'paypal' ? (
            <PayPalForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : selectedMethodIdentifier === 'bank' ? (
            <BankTransferForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : isCryptoSelected ? (
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
