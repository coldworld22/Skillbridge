import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { fetchPaymentMethods, fetchStripePublicKey } from '@/services/paymentMethodService';
import { fetchClassDetails } from '@/services/classService';
import { fetchTutorialDetails } from '@/services/tutorialService';
import { fetchBook } from '@/services/bookService';
import { fetchPlanDetails } from '@/services/public/planService';
import { validateCode } from '@/services/couponService';
import { initiateBankPayment, initiateCoinbasePayment, initiateCryptoPayment, initiatePayPalPayment } from '@/services/paymentService';
import { createPayment, fetchPayment } from '@/services/student/paymentService';
import useCartStore from '@/store/cart/cartStore';
import { useShallow } from 'zustand/react/shallow';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { toast } from 'react-toastify';
import PayPalForm from '@/components/payments/forms/PayPalForm';
import BankTransferForm from '@/components/payments/forms/BankTransferForm';
import CryptoPaymentForm from '@/components/payments/forms/CryptoPaymentForm';
import CardPaymentForm from '@/components/payments/forms/CardPaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  FaCcStripe, FaPaypal, FaMoneyCheckAlt, FaUniversity,
  FaEthereum, FaFileInvoice, FaDownload, FaCheckCircle
} from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { parseCheckoutItems } from '@/utils/parseCheckoutItems';

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

const envHosts = process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS;
const defaultHosts = process.env.APP_DOMAIN
  ? [process.env.APP_DOMAIN, `cdn.${process.env.APP_DOMAIN}`]
  : [];
export const TRUSTED_ICON_HOSTS = envHosts
  ? envHosts.split(',').map((h) => h.trim()).filter(Boolean)
  : defaultHosts;

function getBaseOrigin() {
  return (
    (typeof window !== 'undefined' && window.location?.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost'
  );
}

function isTrustedIcon(url) {
  try {
    const { protocol, hostname } = new URL(url, getBaseOrigin());
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return TRUSTED_ICON_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function TrustedIcon({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) return <FaMoneyCheckAlt aria-label={alt} role="img" />;
  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 object-contain"
      onError={() => setError(true)}
    />
  );
}

export function resolveIconElement(method) {
  if (typeof method.icon === 'string' && method.icon) {
    const lower = method.icon.toLowerCase();
    const baseName = lower.split('/').pop().split('.')[0];
    if (iconMap[lower]) return iconMap[lower];
    if (iconMap[baseName]) return iconMap[baseName];
    try {
      const origin = getBaseOrigin();
      const parsed = new URL(method.icon, origin);
      const isExternal = parsed.origin !== origin;
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const trusted = isHttp && (!isExternal || isTrustedIcon(parsed.href));
      if (trusted) {
        return <TrustedIcon src={method.icon} alt={method.name} />;
      }
    } catch {
      // Invalid URLs fall through to the default icon
    }
  }
  return (
    iconMap[getMethodIdentifier(method).toLowerCase()] || <FaMoneyCheckAlt />
  );
}

function DirectGatewayPayment({
  onSubmit,
  processing,
  allowInstallments,
  installments,
  perInstallment,
  finalPrice,
  selectedMethodLabel,
}) {
  const usingInstallments = allowInstallments && installments > 1;
  const buttonText = processing
    ? 'Processing...'
    : usingInstallments
    ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
    : `Pay $${finalPrice} with ${selectedMethodLabel}`;

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-gray-300">
        Complete your payment using {selectedMethodLabel}.
      </p>
      <button
        type="button"
        onClick={() => onSubmit({})}
        disabled={processing}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
      <p className="text-sm text-gray-500">
        You&apos;ll be redirected after successful payment.
      </p>
    </div>
  );
}

function getMethodIdentifier(method) {
  const type = method?.type;
  if (type !== undefined && type !== null) {
    const typeStr = String(type).trim();
    if (typeStr) return typeStr;
  }
  const name = method?.name;
  if (name !== undefined && name !== null) {
    const nameStr = String(name).trim();
    if (nameStr) return nameStr;
  }
  return '';
}

function normalizePaymentMethod(method) {
  if (!method || typeof method !== 'object') return method;
  const identifier = getMethodIdentifier(method).toLowerCase();
  if (identifier !== 'bank') return method;

  const settings =
    method.settings && typeof method.settings === 'object' && !Array.isArray(method.settings)
      ? method.settings
      : {};
  const mergedConfig = { ...(method.config || {}), ...settings };

  return {
    ...method,
    config: mergedConfig,
    bankSettings: settings,
  };
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

export function filterEligibleMethods(methods) {
  return Array.isArray(methods)
    ? methods.filter((m) => m.active !== false)
    : [];
}

export function resolveCheckoutItem(query, cartItems) {
  const { itemId, itemType, items } = query;

  const isSupportedType = (type) =>
    ['class', 'tutorial', 'book', 'plan'].includes((type || '').toLowerCase());

  if (itemId && itemType) {
    if (!isSupportedType(itemType)) return null;
    return { id: itemId, type: itemType };
  }

  const resolvedFromItems = parseCheckoutItems(items);
  if (resolvedFromItems) {
    if (!isSupportedType(resolvedFromItems.type)) return null;
    return resolvedFromItems;
  }

  if (Array.isArray(cartItems) && cartItems.length === 1) {
    const c = cartItems[0];
    if (c && c.id) {
      const type = c.item_type || 'class';
      if (!isSupportedType(type)) return null;
      return { id: c.id, type };
    }
  }

  return null;
}

export async function handleBankPayment({
  itemInfo,
  itemType,
  finalPrice,
  couponId,
  formData = {},
  router,
  t,
  setPaymentStatus,
  interval,
}) {
  try {
    setPaymentStatus('processing');
    const payload = {
      item_id: itemInfo.id,
      item_type: itemType,
      amount: finalPrice,
    };
    if (couponId) payload.coupon_id = couponId;
    if (itemType === 'plan') payload.interval = interval;
    if (formData.reference) payload.reference = formData.reference;

    if (formData.receipt) {
      try {
        const uploaded = await uploadReceipt(formData.receipt);
        const uploadedUrl =
          uploaded?.url || uploaded?.receipt_url || uploaded || null;
        if (uploadedUrl) {
          payload.receipt_url = uploadedUrl;
        }
      } catch (uploadErr) {
        console.error('Failed to upload bank receipt', uploadErr);
        toast.error(t('payment_bank_failure'));
        setPaymentStatus('idle');
        return;
      }
    }

    const payment = await initiateBankPayment(payload);
    router.push(
      `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}&payment_id=${payment?.id}`
    );
  } catch (err) {
    console.error('Failed to initiate bank transfer', err);
    toast.error(t('payment_bank_failure'));
    setPaymentStatus('idle');
  }
}

export async function handlePayPalPayment({
  itemInfo,
  itemType,
  finalPrice,
  couponId,
  t,
  setPaymentStatus,
  interval,
}) {
  try {
    setPaymentStatus('processing');
    const payload = {
      item_id: itemInfo.id,
      item_type: itemType,
      amount: finalPrice,
    };
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    const data = await initiatePayPalPayment(payload);
    if (data?.approval_url) {
      window.location.href = data.approval_url;
    } else {
      toast.error(t('payment_paypal_failure'));
      setPaymentStatus('idle');
    }
  } catch (err) {
    console.error('Failed to initiate PayPal payment', err);
    toast.error(t('payment_paypal_failure'));
    setPaymentStatus('idle');
  }
}

export async function handleCryptoPayment({
  itemInfo,
  itemType,
  finalPrice,
  couponId,
  method,
  t,
  setPaymentStatus,
  interval,
}) {
  try {
    setPaymentStatus('processing');
    const payload = {
      item_id: itemInfo.id,
      item_type: itemType,
      amount: finalPrice,
      method_type: method?.type || getMethodIdentifier(method),
    };
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    const initFn =
      getMethodIdentifier(method).toLowerCase() === 'coinbase'
        ? initiateCoinbasePayment
        : initiateCryptoPayment;
    const data = await initFn(payload);
    if (data?.invoice_url) {
      window.location.href = data.invoice_url;
    } else {
      toast.error(t('payment_crypto_failure'));
      setPaymentStatus('idle');
    }
  } catch (err) {
    console.error('Failed to initiate crypto payment', err);
    toast.error(t('payment_crypto_failure'));
    setPaymentStatus('idle');
  }
}

export async function handleDefaultPayment({
  method,
  itemInfo,
  itemType,
  finalPrice,
  allowInstallments,
  installments,
  interval,
  couponId,
  formData = {},
  t,
  setPaymentStatus,
  completePayment,
}) {
  try {
    setPaymentStatus('processing');
    const installmentCount = Math.max(Number(installments) || 1, 1);
    const usingInstallments = allowInstallments && installmentCount > 1;
    const amount = usingInstallments
      ? finalPrice / installmentCount
      : finalPrice;
    const payload = {
      method_id: method?.id,
      item_type: itemType,
      item_id: itemInfo.id,
      amount,
      allow_installments: allowInstallments,
      installments,
    };
    if (formData.token) payload.token = formData.token;
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    const response = await createPayment(payload);

    if (!response || typeof response !== 'object') {
      throw new Error('Invalid payment response');
    }

    await completePayment(response);

    const status =
      typeof response.status === 'string' ? response.status.toLowerCase() : '';

    if (!status) {
      throw new Error('Payment status missing');
    }

    const failureIndicators = ['fail', 'cancel', 'declin', 'error'];
    const isFailureStatus = failureIndicators.some((indicator) =>
      status.includes(indicator)
    );

    if (isFailureStatus) {
      throw new Error(`Payment ${status}`);
    }
  } catch (err) {
    console.error('Failed to process payment', err);
    toast.error(t('payment_generic_failure'));
    setPaymentStatus('idle');
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  // Use shallow comparison so store updates unrelated to items do not trigger
  // unnecessary renders that can lead to nested update loops.
  const { items: cartItems, removeItem } = useCartStore(
    useShallow((state) => ({ items: state.items, removeItem: state.removeItem }))
  );
  const paymentId = useMemo(() => {
    if (!router.isReady) return null;
    return router.query.paymentId || router.query.payment_id || null;
  }, [router.isReady, router.query.paymentId, router.query.payment_id]);
  const [existingPayment, setExistingPayment] = useState(null);
  const resolvedItem = useMemo(() => {
    if (!router.isReady) return null;
    if (existingPayment) {
      return { id: existingPayment.item_id, type: existingPayment.item_type };
    }
    return resolveCheckoutItem(router.query, cartItems);
  }, [router.isReady, router.query, cartItems, existingPayment]);
  const itemId = resolvedItem?.id;
  const itemType = resolvedItem?.type;
  const interval = useMemo(() => {
    if (!router.isReady) return 'monthly';
    return router.query.interval === 'yearly' ? 'yearly' : 'monthly';
  }, [router.isReady, router.query.interval]);
  const [checkoutError, setCheckoutError] = useState('');
  useEffect(() => {
    if (!router.isReady) return;
    if (!resolvedItem) setCheckoutError(t('checkout_single_item_warning'));
    else setCheckoutError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, resolvedItem]);
  const [itemInfo, setItemInfo] = useState(null);
  const [methods, setMethods] = useState([]);
  const [stripePromise, setStripePromise] = useState(null);
  useEffect(() => {
    const loadStripeKey = async () => {
      let key = null;
      try {
        key = await fetchStripePublicKey();
      } catch (_err) {
        // ignore
      }
      if (!key && process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
        key = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
      }
      if (key) {
        setStripePromise(loadStripe(key));
      }
    };
    loadStripeKey();
  }, []);
  // Use the payment method "type" as identifier. Default to the method marked
  // as default, or the first active method if none is marked.
  const [selectedMethod, setSelectedMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [allowInstallments, setAllowInstallments] = useState(false);
  const finalPrice = useMemo(
    () => Math.max((itemInfo?.price ?? 0) - discountAmount, 0),
    [itemInfo, discountAmount]
  );
  const isFree = finalPrice <= Number.EPSILON;
  // Normalize the selected payment method to avoid case or whitespace mismatches
  const normalizedMethod = (selectedMethod || '')
    .toString()
    .trim()
    .toLowerCase();

  const filteredMethods = useMemo(() => {
    const eligible = filterEligibleMethods(methods);
    if (stripePromise) return eligible;
    return eligible.filter(
      (m) => getMethodIdentifier(m).toLowerCase() !== 'stripe'
    );
  }, [methods, itemType, stripePromise]);

  const noPaymentMethods = filteredMethods.length === 0 && finalPrice > 0;

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

  useEffect(() => {
    if (
      filteredMethods.length > 0 &&
      !filteredMethods.some(
        (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
      )
    ) {
      const defaultMethod =
        filteredMethods.find((m) => m.is_default) || filteredMethods[0];
      setSelectedMethod(getMethodIdentifier(defaultMethod));
    }
  }, [filteredMethods, normalizedMethod]);

  useEffect(() => {
    if (!paymentId) return;
    let active = true;
    const load = async () => {
      try {
        const data = await fetchPayment(paymentId);
        if (!active) return;
        if (data) {
          setExistingPayment(data);
          setPaymentStatus(data.status || 'idle');
          if ((data.installments || 1) > 1) setAllowInstallments(true);
        }
      } catch (err) {
        console.error('Failed to load payment', err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [paymentId]);

  useEffect(() => {
    if (!itemId || !itemType) return;
    let active = true;
    const load = async () => {
      let details;
      try {
        if (itemType === 'tutorial') {
          details = await fetchTutorialDetails(itemId);
        } else if (itemType === 'book') {
          details = await fetchBook(itemId);
        } else if (itemType === 'plan') {
          details = await fetchPlanDetails(itemId);
          const data = details?.data ?? details;
          const priceMonthly = parseFloat(data.price_monthly);
          const priceYearly = parseFloat(data.price_yearly);
          if (Number.isNaN(priceMonthly) || Number.isNaN(priceYearly)) {
            if (active) setCheckoutError('Plan unavailable');
            return;
          }
          const price = interval === 'yearly' ? priceYearly : priceMonthly;
          details = { ...data, title: data.name, price };
        } else {
          details = await fetchClassDetails(itemId);
        }
        if (active) {
          let info = details?.data ?? details;
          if (existingPayment && info) {
            info = { ...info, price: existingPayment.amount };
          }
          setItemInfo(info);
        }
      } catch (err) {
        console.error('Failed to load item', err);
        if (itemType === 'plan' && active) {
          setCheckoutError('Plan unavailable');
        }
        return;
      }
      const price =
        existingPayment?.amount ?? (Number((details?.data ?? details)?.price) || 0);
      if (price > Number.EPSILON) {
        try {
          const data = await fetchPaymentMethods();
          if (!active) return;
          const methodsList = Array.isArray(data) ? data.map(normalizePaymentMethod) : [];
          setMethods(methodsList);
          const eligibleMethods = filterEligibleMethods(methodsList);
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
      } else {
        setMethods([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [itemId, itemType, interval, existingPayment]);

  useEffect(() => {
    if (!existingPayment || methods.length === 0) return;
    const m = methods.find((mt) => mt.id === existingPayment.method_id);
    if (m) setSelectedMethod(getMethodIdentifier(m));
  }, [existingPayment, methods]);

  const handleApplyPromo = async () => {
    const formattedCode = promoCode.trim().toUpperCase();
    if (!formattedCode) {
      toast.error(t('enter_promo_code'));
      return;
    }
    setPromoCode(formattedCode);
    setPromoLoading(true);
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
    } finally {
      setPromoLoading(false);
    }
  };


  const buildBasePaymentPayload = ({ amount }) => {
    const payload = {
      item_type: itemType,
      item_id: itemInfo.id,
      amount,
    };
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    return payload;
  };

  const completePayment = async (paymentOverride) => {
    const payment = paymentOverride || existingPayment;
    const status = payment?.status;

    if (payment && status && status !== 'paid') {
      toast.error(t('payment_pending_confirmation'));
      setPaymentStatus(status);
      return;
    }

    if (itemType === 'plan') {
      setPaymentStatus('success');
      setTimeout(() => {
        const paymentIdParam = payment?.id ? `&payment_id=${payment.id}` : '';
        router.push(
          `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}${paymentIdParam}`
        );
      }, 1500);
      return;
    }

    setPaymentStatus('success');

    if (typeof window !== 'undefined') {
      const storageKey =
        itemType === 'tutorial'
          ? 'enrolledTutorials'
          : itemType === 'book'
          ? 'purchasedBooks'
          : 'enrolledClasses';
      try {
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
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
        const updated = Array.isArray(existing) ? [...existing, newItem] : [newItem];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        await Promise.resolve(removeItem(itemInfo.id));
      } catch (err) {
        console.warn('Failed to update local enrollment cache', err);
      }
    }

    setTimeout(() => {
      const paymentIdParam = payment?.id ? `&payment_id=${payment.id}` : '';
      router.push(
        `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}${paymentIdParam}`
      );
    }, 1500);
  };

  const handlePayment = async (_formData = {}) => {
    if (finalPrice <= Number.EPSILON) {
      try {
        setPaymentStatus('processing');
        const payload = { ...buildBasePaymentPayload({ amount: finalPrice }), status: 'paid' };
        const payment = await createPayment(payload);
        await completePayment(payment);
      } catch (err) {
        console.error('Failed to finalize free payment', err);
        toast.error(t('payment_generic_failure'));
        setPaymentStatus('idle');
      }
      return;
    }
    const method = filteredMethods.find(
      (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
    );
    if (!method) {
      toast.error(t('payment_method_missing'));
      return;
    }
    const identifier = getMethodIdentifier(method).toLowerCase();
    const isCrypto = isCryptoMethod(method || identifier);

    const handlers = {
      bank: handleBankPayment,
      paypal: handlePayPalPayment,
      crypto: handleCryptoPayment,
      default: handleDefaultPayment,
    };

    const key =
      identifier === 'bank'
        ? 'bank'
        : identifier === 'paypal'
        ? 'paypal'
        : isCrypto
        ? 'crypto'
        : 'default';

    await handlers[key]({
      method,
      itemInfo,
      itemType,
      finalPrice,
      couponId,
      formData: _formData,
      router,
      t,
      setPaymentStatus,
      allowInstallments,
      installments,
      interval,
      completePayment,
    });
  };

  const [installments, setInstallments] = useState(1);
  useEffect(() => {
    const count = Number(
      existingPayment?.installments || itemInfo?.installments || 1
    );
    setInstallments(count);
  }, [existingPayment, itemInfo]);

  const perInstallment = useMemo(() => {
    const count = Math.max(Number(installments) || 1, 1);
    if (allowInstallments && count > 1) {
      return finalPrice / count;
    }
    return finalPrice;
  }, [allowInstallments, finalPrice, installments]);
  const schedule = useMemo(() => {
    if (!allowInstallments) return [];
    const count = Math.max(Number(installments) || 1, 1);
    return Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return {
        number: i + 1,
        date: d.toLocaleDateString(),
        amount: perInstallment.toFixed(2),
      };
    });
  }, [allowInstallments, installments, perInstallment]);

  if (checkoutError) return <div className="text-white text-center mt-32">{checkoutError}</div>;
  if (!itemInfo) return <div className="text-white text-center mt-32">{t('loading')}</div>;

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

        {!isFree && filteredMethods.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaFileInvoice /> {t('select_payment_method')}</h2>
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
              disabled={promoLoading}
              className="px-4 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >{promoLoading ? t('applying') : t('apply')}</button>
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
              <button onClick={() => handlePayment()} className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded">
                {t('enroll_for_free')}
              </button>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="text-green-400 text-center text-lg py-6">
              <FaCheckCircle className="inline mr-2 text-2xl" /> {t('payment_successful_redirecting')}
            </div>
          ) : noPaymentMethods ? (
            <div className="text-center">
              <p className="text-red-400 mb-4">{t('no_payment_methods_plan')}</p>
              <button
                disabled
                className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded opacity-50 cursor-not-allowed"
              >
                {`Pay $${finalPrice}`}
              </button>
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
              bankDetails={
                selectedMethodObj?.settings ||
                selectedMethodObj?.config ||
                selectedMethodObj
              }
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : isCryptoSelected ? (
            <CryptoPaymentForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={finalPrice}
            />
          ) : selectedMethodIdentifier === 'stripe' && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CardPaymentForm
                onSubmit={handlePayment}
                processing={paymentStatus === 'processing'}
                allowInstallments={allowInstallments}
                installments={installments}
                perInstallment={perInstallment}
                finalPrice={finalPrice}
                selectedMethodLabel={selectedMethodLabel}
                requireStripeTokenization
              />
            </Elements>
          ) : (
            <DirectGatewayPayment
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              allowInstallments={allowInstallments}
              installments={installments}
              perInstallment={perInstallment}
              finalPrice={finalPrice}
              selectedMethodLabel={selectedMethodLabel}
              requireStripeTokenization={false}
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
