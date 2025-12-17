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
import { subscribeToPlan } from '@/services/subscriptionService';
import useCartStore from '@/store/cart/cartStore';
import useAuthStore from '@/store/auth/authStore';
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
import withAuthProtection from '@/hooks/withAuthProtection';
import * as authService from '@/services/auth/authService';
import { ensureCsrfTokenCookie } from '@/services/api/csrf';
import { isTokenExpired } from '@/utils/auth/tokenUtils';
import styles from "./payments.module.scss";

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

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesPayPal(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return false;
  const condensed = normalized.replace(/[\s_-]+/g, '');
  return normalized.includes('paypal') || condensed.includes('paypal');
}

function matchesCoinbase(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return false;
  const condensed = normalized.replace(/[\s_-]+/g, '');
  return normalized.includes('coinbase') || condensed.includes('coinbasecommerce');
}

export function isPayPalMethod(methodOrIdentifier) {
  if (!methodOrIdentifier) return false;
  if (typeof methodOrIdentifier === 'string') {
    return matchesPayPal(methodOrIdentifier);
  }
  if (matchesPayPal(methodOrIdentifier.type)) return true;
  if (matchesPayPal(methodOrIdentifier.name)) return true;
  if (matchesPayPal(methodOrIdentifier.category)) return true;
  return false;
}

export function TrustedIcon({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) return <FaMoneyCheckAlt aria-label={alt} role="img" />;
  return (
    <img
      src={src}
      alt={alt}
      className={styles.iconImage}
      onError={() => setError(true)}
    />
  );
}

export function resolveIconElement(method) {
  const identifier = getMethodIdentifier(method).toLowerCase();
  if (iconMap[identifier]) return iconMap[identifier];
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
  if (isPayPalMethod(method)) return iconMap.paypal;
  return <FaMoneyCheckAlt />;
}

function getMethodIdentifier(method) {
  if (!method) return '';
  const rawType = method.type;
  const rawName = method.name;
  if (matchesCoinbase(rawName) || matchesCoinbase(rawType)) return 'coinbase';
  if (matchesPayPal(rawName) || matchesPayPal(rawType)) return 'paypal';
  const typeStr =
    rawType !== undefined && rawType !== null ? String(rawType).trim() : '';
  if (typeStr) return typeStr;
  const nameStr =
    rawName !== undefined && rawName !== null ? String(rawName).trim() : '';
  if (nameStr) return nameStr;
  return '';
}

function getMethodDisplayName(method) {
  if (!method) return '';
  const identifier = getMethodIdentifier(method).toLowerCase();
  if (identifier === 'coinbase') {
    return 'Pay with Crypto';
  }
  if (identifier === 'paypal') {
    return method.name || 'PayPal';
  }
  return method.name || identifier || '';
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

const normalizeBankDetails = (settings = {}) => {
  const bankSource =
    settings.bank_details || settings.bankDetails || settings.bank || {};
  const pickValue = (keys) => {
    for (const key of keys) {
      if (bankSource[key] !== undefined && bankSource[key] !== null) {
        return bankSource[key];
      }
      if (settings[key] !== undefined && settings[key] !== null) {
        return settings[key];
      }
    }
    return '';
  };
  const trimOrNull = (value) =>
    typeof value === 'string' ? value.trim() : value ?? '';

  const instructions =
    trimOrNull(
      bankSource.instructions ||
        settings.instructions ||
        settings.note ||
        settings.details ||
        ''
    ) || '';

  const accountNumber = trimOrNull(
    pickValue([
      'account_number',
      'accountNumber',
      'account_no',
      'accountNo',
      'account',
    ])
  );

  const iban = trimOrNull(
    pickValue(['iban', 'IBAN', 'account_iban', 'international_account_number'])
  );

  return {
    bank_name: trimOrNull(pickValue(['bank_name', 'bankName'])),
    account_holder_name: trimOrNull(
      pickValue(['account_holder_name', 'accountHolderName', 'account_name'])
    ),
    account_number: accountNumber || '',
    iban: iban || '',
    swift_code: trimOrNull(pickValue(['swift_code', 'swiftCode', 'bic'])),
    branch_address: trimOrNull(pickValue(['branch_address', 'branchAddress'])),
    instructions,
  };
};

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

async function ensureFreshAccessToken(router) {
  const authState = useAuthStore.getState();
  const token = authState.accessToken;
  if (token && !isTokenExpired(token)) {
    return true;
  }
  try {
    const { accessToken } = await authService.refreshAccessToken();
    useAuthStore.setState({ accessToken });
    return true;
  } catch (err) {
    authState.logout?.(true);
    toast.info('You have been logged out.');
    toast.error('Session expired. Please log in again.');
    if (router) {
      router.push('/auth/login');
    }
    return false;
  }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
};

const determineClassInstallmentDueDate = (classInfo) => {
  const now = new Date();
  const start = parseDateSafe(classInfo?.startDate || classInfo?.start_date);
  const end = parseDateSafe(classInfo?.endDate || classInfo?.end_date);

  let offsetDays = 14;
  if (start && end && end > start) {
    const durationDays = Math.round((end.getTime() - start.getTime()) / DAY_IN_MS);
    offsetDays = Math.max(7, Math.round(durationDays / 2));
  }

  let candidate = start ? addDays(start, offsetDays) : addDays(now, offsetDays);
  if (candidate <= now) {
    candidate = addDays(now, Math.max(7, offsetDays));
  }
  return candidate;
};

function resolveInstallmentMeta(allowInstallments, installments, totalAmount) {
  if (!allowInstallments) {
    return { enabled: false, count: 1, amountPerInstallment: totalAmount };
  }
  const parsedCount = Number(installments);
  let count =
    Number.isFinite(parsedCount) && parsedCount > 1
      ? Math.floor(parsedCount)
      : 2;
  if (count < 2) count = 2;
  const amountPerInstallment = Number((totalAmount / count).toFixed(2));
  return { enabled: true, count, amountPerInstallment };
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
  allowInstallments,
  installments,
}) {
  try {
    setPaymentStatus('processing');
    const { enabled, count, amountPerInstallment } = resolveInstallmentMeta(
      allowInstallments,
      installments,
      finalPrice
    );
    const payload = new FormData();
    payload.append('item_id', itemInfo.id);
    payload.append('item_type', itemType);
    payload.append('amount', amountPerInstallment.toFixed(2));
    if (couponId) payload.append('coupon_id', couponId);
    if (itemType === 'plan') payload.append('interval', interval);
    if (enabled) {
      payload.append('allow_installments', 'true');
      payload.append('installments', String(count));
    }
    if (formData.reference) payload.append('reference', formData.reference);
    if (formData.receipt) payload.append('receipt', formData.receipt);
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
  allowInstallments,
  installments,
}) {
  try {
    setPaymentStatus('processing');
    const { enabled, count, amountPerInstallment } = resolveInstallmentMeta(
      allowInstallments,
      installments,
      finalPrice
    );
    const payload = {
      item_id: itemInfo.id,
      item_type: itemType,
      amount: amountPerInstallment,
    };
    // eslint-disable-next-line no-console
    console.log('PayPal payload', payload);
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    if (enabled) {
      payload.allow_installments = true;
      payload.installments = count;
    }
    const data = await initiatePayPalPayment(payload);
    if (typeof window !== 'undefined' && data?.payment) {
      try {
        window.sessionStorage.setItem(
          'pendingPayPalPayment',
          JSON.stringify({
            paymentId: data.payment.id,
            itemType,
            itemId: String(itemInfo.id),
          })
        );
      } catch (_err) {
        // sessionStorage might be unavailable in private browsing
      }
    }
    if (data?.approval_url) {
      window.location.href = data.approval_url;
    } else {
      toast.error(t('payment_paypal_failure'));
      setPaymentStatus('idle');
    }
  } catch (err) {
    console.error('Failed to initiate PayPal payment', err?.response?.data || err);
    toast.error(err?.response?.data?.message || t('payment_paypal_failure'));
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
  allowInstallments,
  installments,
  router,
}) {
  try {
    setPaymentStatus('processing');
    const identifier = getMethodIdentifier(method).toLowerCase();
    const methodType = identifier || normalizeValue(method?.type) || 'crypto';
    const { enabled, count, amountPerInstallment } = resolveInstallmentMeta(
      allowInstallments,
      installments,
      finalPrice
    );
    const payload = {
      item_id: itemInfo.id,
      item_type: itemType,
      amount: amountPerInstallment,
      method_type: methodType,
    };
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    if (enabled) {
      payload.allow_installments = true;
      payload.installments = count;
    }
    const initFn =
      identifier === 'coinbase' ? initiateCoinbasePayment : initiateCryptoPayment;
    const data = await initFn(payload);
    const redirectUrl =
      data?.invoice_url ||
      data?.hosted_url ||
      data?.payment?.receipt_url ||
      data?.payment?.hosted_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      toast.error(t('payment_crypto_failure'));
      setPaymentStatus('idle');
    }
  } catch (err) {
    console.error('Failed to initiate crypto payment', err?.response?.data || err);
    const status = err?.response?.status;
    const serverMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (typeof err?.response?.data === 'string' ? err.response.data : null);
    if (status === 401) {
      toast.error(serverMessage || t('payment_auth_required'));
      if (router) router.push('/auth/login');
    } else if (serverMessage) {
      toast.error(serverMessage);
    } else {
      toast.error(t('payment_crypto_failure'));
    }
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
    const { enabled, count, amountPerInstallment } = resolveInstallmentMeta(
      allowInstallments,
      installments,
      finalPrice
    );
    const payload = {
      method_id: method?.id,
      item_type: itemType,
      item_id: itemInfo.id,
      amount: amountPerInstallment,
      allow_installments: enabled,
      installments: enabled ? count : 1,
    };
    if (formData.token) payload.token = formData.token;
    if (itemType === 'plan') payload.interval = interval;
    if (couponId) payload.coupon_id = couponId;
    const response = await createPayment(payload);
    if (response?.status === 'paid') {
      await completePayment(response);
    } else {
      throw new Error('Payment not confirmed');
    }
  } catch (err) {
    console.error('Failed to process payment', err);
    toast.error(t('payment_generic_failure'));
    setPaymentStatus('idle');
  }
}

function CheckoutPage() {
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
  const [methodsLoading, setMethodsLoading] = useState(true);
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
  const [installments, setInstallments] = useState(1);
  const preferredInstallmentCount = useMemo(() => {
    const fromExisting = Number(existingPayment?.installments);
    if (Number.isFinite(fromExisting) && fromExisting > 1) {
      return Math.min(12, Math.max(2, Math.floor(fromExisting)));
    }
    const fromItem = Number(itemInfo?.installments);
    if (Number.isFinite(fromItem) && fromItem > 1) {
      return Math.min(12, Math.max(2, Math.floor(fromItem)));
    }
    return 2;
  }, [existingPayment?.installments, itemInfo?.installments]);
  const installmentOptions = useMemo(() => {
    const max = preferredInstallmentCount;
    return Array.from({ length: Math.max(0, max - 1) }, (_v, idx) => idx + 2);
  }, [preferredInstallmentCount]);
  const finalPrice = useMemo(
    () => Math.max((itemInfo?.price ?? 0) - discountAmount, 0),
    [itemInfo, discountAmount]
  );
  const isFree = finalPrice <= Number.EPSILON;
  const installmentsAllowed = useMemo(() => {
    if (itemType !== 'class') return false;
    if (existingPayment?.installments > 1) return true;
    if (Number(itemInfo?.installments) > 1) return true;
    return Boolean(itemInfo?.allow_installments);
  }, [itemType, existingPayment, itemInfo]);
  const installmentsActive = useMemo(
    () => installmentsAllowed && allowInstallments && installments > 1,
    [installmentsAllowed, allowInstallments, installments]
  );
  useEffect(() => {
    if (!installmentsAllowed) {
      setAllowInstallments(false);
      setInstallments(1);
      return;
    }
    if (existingPayment?.installments > 1) {
      setAllowInstallments(true);
    }
  }, [installmentsAllowed, existingPayment?.installments]);
  useEffect(() => {
    if (!installmentsAllowed) return;
    setInstallments((prev) => {
      if (Number.isFinite(prev) && prev > 1) return prev;
      return preferredInstallmentCount;
    });
  }, [installmentsAllowed, preferredInstallmentCount]);
  useEffect(() => {
    if (!installmentsAllowed) return;
    if (installments > preferredInstallmentCount) {
      setInstallments(preferredInstallmentCount);
    }
  }, [installmentsAllowed, installments, preferredInstallmentCount]);
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
  }, [methods, stripePromise]);

  const noPaymentMethods = filteredMethods.length === 0 && finalPrice > 0;

  const selectedMethodObj = filteredMethods.find(
    (m) => getMethodIdentifier(m).toLowerCase() === normalizedMethod
  );
  const selectedMethodIdentifier = selectedMethodObj
    ? getMethodIdentifier(selectedMethodObj).toLowerCase()
    : normalizedMethod;
  const selectedMethodLabel = selectedMethodObj
    ? getMethodDisplayName(selectedMethodObj)
    : selectedMethod;
  const methodSettings = useMemo(() => {
    const raw = selectedMethodObj?.settings;
    if (!raw || typeof raw !== 'object') return {};
    return raw;
  }, [selectedMethodObj]);
  const bankDetails = useMemo(() => normalizeBankDetails(methodSettings), [methodSettings]);
  const methodInstructions = useMemo(() => {
    if (selectedMethodIdentifier === 'bank') return '';
    if (typeof methodSettings.instructions === 'string') return methodSettings.instructions.trim();
    if (typeof methodSettings.note === 'string') return methodSettings.note.trim();
    if (typeof methodSettings.details === 'string') return methodSettings.details.trim();
    return '';
  }, [selectedMethodIdentifier, methodSettings.instructions, methodSettings.note, methodSettings.details]);
  const methodReference = selectedMethodObj || selectedMethodIdentifier;
  const isCryptoSelected = isCryptoMethod(methodReference);
  const isPayPalSelected = isPayPalMethod(methodReference);
  const shouldRenderCardFormWithoutElements =
    Boolean(selectedMethodIdentifier) &&
    selectedMethodIdentifier !== 'stripe' &&
    selectedMethodIdentifier !== 'bank' &&
    !isPayPalSelected &&
    !isCryptoSelected;

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
    if (!itemId || !itemType) {
      setMethodsLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      if (!active) return;
      setMethodsLoading(true);
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
            if (active) setMethodsLoading(false);
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
        if (active) {
          setMethodsLoading(false);
        }
        return;
      }
      const price =
        existingPayment?.amount ?? (Number((details?.data ?? details)?.price) || 0);
      if (price > Number.EPSILON) {
        try {
          const data = await fetchPaymentMethods();
          if (!active) return;
          const methodsList = Array.isArray(data) ? data : [];
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
          if (active) {
            setMethods([]);
          }
        } finally {
          if (active) {
            setMethodsLoading(false);
          }
        }
      } else {
        setMethods([]);
        if (active) {
          setMethodsLoading(false);
        }
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

  const handleInstallmentToggle = (event) => {
    const checked = Boolean(event?.target?.checked);
    setAllowInstallments(checked);
    if (checked && (!Number.isFinite(installments) || installments < 2)) {
      setInstallments(preferredInstallmentCount);
    }
  };

  const handleInstallmentCountChange = (event) => {
    const nextValue = Number(event?.target?.value);
    if (!Number.isFinite(nextValue)) return;
    const normalized = Math.max(2, Math.floor(nextValue));
    setInstallments(Math.min(preferredInstallmentCount, normalized));
  };

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


  const completePayment = async (existingPayment) => {
    setPaymentStatus('processing');
    let payment = existingPayment;
    if (!payment && finalPrice <= Number.EPSILON && itemInfo?.id) {
      const isPlanFree =
        itemType === 'plan' &&
        ((itemInfo?.price ?? 0) <= Number.EPSILON ||
          Number.isNaN(Number(itemInfo?.price)));

      if (isPlanFree) {
        try {
          await subscribeToPlan(itemInfo.id, interval || 'monthly');
        } catch (err) {
          console.error('Failed to subscribe to free plan', err);
          toast.error(t('payment_generic_failure'));
          setPaymentStatus('idle');
          return;
        }
        setPaymentStatus('success');
        setTimeout(() => {
          router.push(`/payments/success?itemType=${itemType}&itemId=${itemInfo.id}`);
        }, 1500);
        return;
      }
      try {
        const payload = {
          item_type: itemType,
          item_id: itemInfo.id,
          amount: 0,
          status: 'paid',
        };
        if (itemType === 'plan') payload.interval = interval;
        if (couponId) payload.coupon_id = couponId;
        payment = await createPayment(payload);
      } catch (err) {
        console.error('Failed to record free payment', err);
        toast.error(t('payment_generic_failure'));
        setPaymentStatus('idle');
        return;
      }
    }

    if (itemType === 'plan' && !payment) {
      const eligible = filterEligibleMethods(methods);
      if (eligible.length === 0) {
        toast.error(t('no_payment_methods_plan'));
        setPaymentStatus('idle');
        return;
      }
      const defaultMethod = eligible[0];
      try {
        const payload = {
          item_type: itemType,
          item_id: itemInfo.id,
          amount: finalPrice,
          status: 'paid',
          interval,
        };
        if (defaultMethod?.id) payload.method_id = defaultMethod.id;
        if (couponId) payload.coupon_id = couponId;
        if (installmentsActive) {
          payload.allow_installments = true;
          payload.installments = installments;
          payload.amount = perInstallment;
        }
        payment = await createPayment(payload);
      } catch (err) {
        console.error('Failed to create payment', err);
        toast.error(t('payment_generic_failure'));
        setPaymentStatus('idle');
        return;
      }
    }
    if (itemType === 'plan') {
      if (!payment?.id) {
        try {
          await subscribeToPlan(itemInfo.id, interval);
        } catch (err) {
          console.error('Failed to subscribe to plan', err);
          toast.error(t('payment_generic_failure'));
          setPaymentStatus('idle');
          return;
        }
      }
      setPaymentStatus('success');
      setTimeout(() => {
        const paymentIdParam = payment?.id ? `&payment_id=${payment.id}` : '';
        router.push(
          `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}${paymentIdParam}`
        );
      }, 1500);
      return;
    }
    const storageKey =
      itemType === 'tutorial'
        ? 'enrolledTutorials'
        : itemType === 'book'
        ? 'purchasedBooks'
        : 'enrolledClasses';
    let enrolled = [];
    if (typeof window !== 'undefined') {
      try {
        enrolled = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {
        enrolled = [];
      }
    }
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
    if (typeof window !== 'undefined') {
      try {
        enrolled.push(newItem);
        localStorage.setItem(storageKey, JSON.stringify(enrolled));
        await Promise.resolve(removeItem(itemInfo.id));
      } catch (err) {
        console.error('Failed to persist enrollment', err);
        toast.error(t('payment_generic_failure'));
      }
    }
    setPaymentStatus('success');
    setTimeout(() => {
      const paymentIdParam = payment?.id ? `&payment_id=${payment.id}` : '';
      router.push(
        `/payments/success?itemType=${itemType}&itemId=${itemInfo.id}${paymentIdParam}`
      );
    }, 1500);
  };

  const handlePayment = async (_formData = {}) => {
    const csrfReady = await ensureCsrfTokenCookie();
    if (!csrfReady) {
      toast.error(t('payment_generic_failure'));
      setPaymentStatus('idle');
      return;
    }
    const sessionReady = await ensureFreshAccessToken(router);
    if (!sessionReady) {
      setPaymentStatus('idle');
      return;
    }
    if (finalPrice <= Number.EPSILON) {
      const basePrice = Number(itemInfo?.price ?? 0);
      const isPlanFree =
        itemType === "plan" &&
        (!Number.isFinite(basePrice) || basePrice <= Number.EPSILON);

      if (isPlanFree) {
        await completePayment();
      } else {
        try {
          const payload = {
            item_type: itemType,
            item_id: itemInfo.id,
            amount: 0,
            status: "paid",
          };
          if (itemType === "plan") payload.interval = interval;
          if (couponId) payload.coupon_id = couponId;
          const zeroPayment = await createPayment(payload);
          await completePayment(zeroPayment);
        } catch (err) {
          console.error("Failed to create zero-amount payment", err);
          toast.error(t("payment_generic_failure"));
          setPaymentStatus("idle");
        }
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
    const isPayPal = isPayPalMethod(method || identifier);

    const handlers = {
      bank: handleBankPayment,
      paypal: handlePayPalPayment,
      crypto: handleCryptoPayment,
      default: handleDefaultPayment,
    };

    const key =
      identifier === 'bank'
        ? 'bank'
        : isPayPal
        ? 'paypal'
        : isCrypto
        ? 'crypto'
        : 'default';

    const useInstallments = installmentsActive;
    const installmentsCount = useInstallments ? installments : 1;

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
      allowInstallments: useInstallments,
      installments: installmentsCount,
      interval,
      completePayment,
    });
  };

  const perInstallment = useMemo(() => {
    const divisor = installments > 0 ? installments : 1;
    const raw = finalPrice / divisor;
    if (!installmentsActive) return raw;
    if (!Number.isFinite(raw)) return 0;
    return Number(raw.toFixed(2));
  }, [finalPrice, installments, installmentsActive]);
  const payableAmountDisplay = useMemo(() => {
    const base = installmentsActive ? perInstallment : finalPrice;
    if (!Number.isFinite(base)) return '0.00';
    return base.toFixed(2);
  }, [installmentsActive, perInstallment, finalPrice]);
  const schedule = useMemo(() => {
    if (!installmentsActive || itemType !== 'class') {
      return [];
    }
    const total = Math.max(2, Math.floor(installments));
    const amount = Number.isFinite(perInstallment) ? perInstallment : 0;
    const entries = [];
    const now = new Date();
    const baseDueDate = determineClassInstallmentDueDate(itemInfo);
    for (let i = 0; i < total; i += 1) {
      let dateRef;
      if (i === 0) {
        dateRef = now;
      } else if (baseDueDate) {
        dateRef = addDays(baseDueDate, (i - 1) * 30);
      } else {
        dateRef = addDays(now, (i + 1) * 14);
      }
      entries.push({
        number: i + 1,
        date: dateRef.toLocaleDateString(),
        amount: amount.toFixed(2),
      });
    }
    return entries;
  }, [installmentsActive, itemType, itemInfo, perInstallment, installments]);

  if (checkoutError) return <div className={styles.state}>{checkoutError}</div>;
  if (!itemInfo) return <div className={styles.state}>{t('loading')}</div>;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>{t('checkout')}</h1>

        <div className={`${styles.card} ${styles.product}`}>
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
              className={styles.productMedia}
            />
          )}
          <div className={styles.productContent}>
            <h2 className={styles.sectionTitle}>{itemInfo.title}</h2>
            {itemType !== 'plan' && (
              <p className={styles.muted}>
                {itemType === 'book'
                  ? `Author: ${itemInfo.author}`
                  : `Instructor: ${itemInfo.instructor}`}
              </p>
            )}
            <p className={styles.price}>Price: ${itemInfo.price}</p>
            {discountAmount > 0 && (
              <p className={styles.statusSuccess}>
                Discount Applied: {discountPercent}% (-${discountAmount.toFixed(2)})
              </p>
            )}
          </div>
        </div>

        {!isFree && filteredMethods.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}><FaFileInvoice /> {t('select_payment_method')}</h2>
            <div className={styles.optionGrid}>
              {filteredMethods.map((method) => {
                const identifier = getMethodIdentifier(method);
                const displayName = getMethodDisplayName(method);
                const isActive = selectedMethod === identifier;
                return (
                  <button
                    key={method.id || identifier}
                    onClick={() => setSelectedMethod(identifier)}
                    className={`${styles.optionCard} ${isActive ? styles.optionActive : ""}`}
                  >
                    <div className={styles.optionIcon} data-testid={`payment-icon-${identifier.toLowerCase()}`}>
                      {resolveIconElement(method)}
                    </div>
                    <div className={styles.optionLabel}>{displayName}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FaFileInvoice /> {t('payment_details')}</h2>

          {!isFree && methodInstructions && (
            <div className={`${styles.alert} ${styles.alertWarning}`} style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '0.35rem' }}>
                {t('method_additional_instructions', {
                  method: selectedMethodLabel || t('selected_method'),
                })}
              </h3>
              {methodInstructions}
            </div>
          )}
          {installmentsAllowed && itemType === 'class' && !isFree && (
            <div className={styles.cardAlt} style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="installments-toggle"
                className={styles.radioRow}
              >
                <input
                  id="installments-toggle"
                  type="checkbox"
                  className={styles.radioInput}
                  checked={allowInstallments}
                  onChange={handleInstallmentToggle}
                />
                <span className={styles.label}>
                  {t('pay_in_monthly_installments', {
                    count: Math.max(2, Math.floor(installments) || preferredInstallmentCount),
                  })}
                </span>
              </label>
              {allowInstallments && (
                <div className={`${styles.inputRow}`} style={{ marginTop: '0.75rem' }}>
                  {installmentOptions.length > 1 && (
                    <label className={styles.label} htmlFor="installment-count">
                      <span className={styles.muted}>
                        {t('installment_count_label')}
                      </span>
                      <select
                        id="installment-count"
                        value={installments}
                        onChange={handleInstallmentCountChange}
                        className={styles.input}
                      >
                        {installmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p className={styles.muted}>
                    {t('installment_amount_hint', {
                      amount: Number.isFinite(perInstallment)
                        ? perInstallment.toFixed(2)
                        : '0.00',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          {installmentsActive && schedule.length > 0 && (
            <div className={`${styles.alert} ${styles.alertWarning}`} style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '0.35rem' }}>{t('installments')}</h3>
              <ul className={styles.list}>
                {schedule.map((entry) => (
                  <li key={entry.number} className={styles.listItem}>
                    {t('installment_item', {
                      number: entry.number,
                      amount: entry.amount,
                      date: entry.date,
                    })}
                  </li>
                ))}
              </ul>
              <p className={styles.muted} style={{ marginTop: '0.5rem', color: '#fef08a' }}>
                {t(
                  'installment_access_notice',
                  'Complete the remaining payment by the due date to keep your access active. Overdue installments automatically suspend access until paid.'
                )}
              </p>
            </div>
          )}

          {isFree ? (
            <div className={styles.center}>
              <p className={styles.muted} style={{ marginBottom: '0.75rem' }}>{t('free_item_notice')}</p>
              <button onClick={() => completePayment()} className={`${styles.button} ${styles.buttonPrimary}`}>
                {t('enroll_for_free')}
              </button>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className={styles.statusSuccess} style={{ padding: '1rem 0' }}>
              <FaCheckCircle style={{ marginRight: '0.35rem' }} /> {t('payment_successful_redirecting')}
            </div>
          ) : noPaymentMethods ? (
            <div className={styles.center}>
              <p className={styles.statusError}>{t('no_payment_methods_plan')}</p>
              <button
                disabled
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonMuted}`}
              >
                {`Pay $${finalPrice}`}
              </button>
            </div>
          ) : isPayPalSelected ? (
            <PayPalForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={payableAmountDisplay}
            />
          ) : selectedMethodIdentifier === 'bank' ? (
            <BankTransferForm
              onSubmit={handlePayment}
              bankDetails={bankDetails}
              processing={paymentStatus === 'processing'}
              finalPrice={payableAmountDisplay}
            />
          ) : isCryptoSelected ? (
            <CryptoPaymentForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              finalPrice={payableAmountDisplay}
            />
          ) : shouldRenderCardFormWithoutElements ? (
            <CardPaymentForm
              onSubmit={handlePayment}
              processing={paymentStatus === 'processing'}
              allowInstallments={installmentsActive}
              installments={installments}
              perInstallment={perInstallment}
              finalPrice={finalPrice}
              selectedMethodLabel={selectedMethodLabel}
            />
          ) : selectedMethodIdentifier === 'stripe' && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CardPaymentForm
                onSubmit={handlePayment}
                processing={paymentStatus === 'processing'}
                allowInstallments={installmentsActive}
                installments={installments}
                perInstallment={perInstallment}
                finalPrice={finalPrice}
                selectedMethodLabel={selectedMethodLabel}
              />
            </Elements>
          ) : methodsLoading ? (
            <p className={styles.statusInfo}>{t('loading_payment_methods')}</p>
          ) : selectedMethodIdentifier === 'stripe' ? (
            <p className={styles.statusInfo}>{t('loading')}</p>
          ) : selectedMethodIdentifier ? (
            <p className={styles.statusError}>
              {t('unsupported_payment_method', {
                method: selectedMethodLabel || t('selected_method'),
              })}
            </p>
          ) : (
            <p className={styles.statusInfo}>
              {t('select_payment_method_prompt')}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}

export default withAuthProtection(CheckoutPage, ['student']);
