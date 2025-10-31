import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaClock,
  FaDollarSign,
  FaTag,
  FaEnvelope,
  FaWhatsapp,
  FaComments,
  FaLink,
} from "react-icons/fa";
import { toast } from "react-toastify";
import StudentLayout from "@/components/layouts/StudentLayout";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import {
  fetchResponses,
  fetchMessages as fetchResponseMessages,
  sendMessage as sendResponseMessage,
  createResponse,
  deleteMessage as deleteResponseMessage,
} from "@/services/offerResponseService";
import { updateOffer } from "@/services/admin/offerService";
import MessageInput from "@/components/chat/MessageInput";
import formatRelativeTime from "@/utils/relativeTime";
import { API_BASE_URL } from "@/config/config";
import ChatImage from "@/components/shared/ChatImage";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const AVATAR_FALLBACK = "/images/default-avatar.png";

const getAvatarUrl = (url) => {
  if (!url) return AVATAR_FALLBACK;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url}`;
};

const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

const isImage = (path) => {
  if (!path) return false;
  return /(png|jpe?g|gif|webp|svg)$/i.test(path.split("?")[0]) || path.startsWith("data:image/");
};

const normalizeTag = (tag) => {
  if (!tag) return null;
  if (typeof tag === "string") return tag;
  if (typeof tag === "object") {
    return tag.name || tag.slug || tag.label || null;
  }
  return null;
};

const normalizeOffer = (data, formatCurrencyFn, formatDateFn) => {
  if (!data) return null;
  const budgetNumber = Number(data.budget);
  const hasBudget = Number.isFinite(budgetNumber);

  const createdAt = data.created_at ? new Date(data.created_at) : null;

  return {
    id: data.id,
    userId: data.student_id,
    name: data.student_name,
    avatar: data.student_avatar,
    type: data.student_role?.toLowerCase() === "instructor" ? "instructor" : "student",
    offerType: data.offer_type || "general",
    title: data.title || "Untitled offer",
    priceRaw: hasBudget ? budgetNumber : null,
    priceLabel: hasBudget ? formatCurrencyFn(budgetNumber) : "Not specified",
    duration: data.timeframe || "",
    tags: Array.isArray(data.tags) ? data.tags.map(normalizeTag).filter(Boolean) : [],
    createdAt,
    postedLabel: createdAt ? formatDateFn(createdAt) : "—",
    status: (data.status || "open").toLowerCase(),
    description: data.description || "",
    email: data.student_email || "",
    phone: data.student_phone || "",
  };
};

const StudentOfferDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasHydrated } = useAuthStore();
  const { t } = useTranslation("dashboard", { keyPrefix: "offersPage" });

  const currentUserId = user?.id;
  const shouldDeferRender = !hasHydrated || !user || user.role?.toLowerCase() !== "student";

  const [offer, setOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offerError, setOfferError] = useState(null);

  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [activeResponse, setActiveResponse] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const isMyRequest = offer && offer.userId === currentUserId && offer.type === "student";
  const isOfferClosed = offer?.status === "closed";

  const loadOffer = useCallback(async () => {
    if (!id || shouldDeferRender) return;
    setOfferLoading(true);
    setOfferError(null);

    try {
      const data = await fetchOfferById(id);
      if (!data) {
        setOffer(null);
        setOfferError(t("load_error", "We couldn't load offer details."));
        return;
      }

      setOffer(normalizeOffer(data, formatCurrency, formatDate));
    } catch (error) {
      console.error("Failed to load offer", error);
      setOffer(null);
      setOfferError(t("load_error", "We couldn't load offer details."));
    } finally {
      setOfferLoading(false);
    }
  }, [id, shouldDeferRender, t]);

  useEffect(() => {
    if (!shouldDeferRender) {
      loadOffer();
    }
  }, [loadOffer, shouldDeferRender]);

  const loadResponses = useCallback(
    async ({ selectResponseId } = {}) => {
      if (!offer?.id) return null;
      setResponsesLoading(true);
      try {
        const list = await fetchResponses(offer.id);
        setResponses(list);

        setActiveResponse((prev) => {
          const targetId = selectResponseId || prev?.id;
          if (targetId) {
            const match = list.find((r) => r.id === targetId);
            if (match) return match;
          }

          if (currentUserId) {
            const mine = list.find((r) => r.instructor_id === currentUserId);
            if (mine) return mine;
          }

          if (offer.userId === currentUserId && list.length > 0) {
            return list[0];
          }

          return list[0] || null;
        });
      } catch (error) {
        console.error("Failed to load responses", error);
        setResponses([]);
        setActiveResponse(null);
        toast.error(t("responses_load_failed", "Unable to load responses right now."));
      } finally {
        setResponsesLoading(false);
      }
    },
    [offer?.id, offer?.userId, currentUserId, t]
  );

  useEffect(() => {
    if (!offer?.id) return;
    loadResponses();
  }, [offer?.id, loadResponses]);

  const loadMessages = useCallback(
    async (response) => {
      if (!offer?.id || !response?.id) {
        setMessages([]);
        return;
      }
      setMessagesLoading(true);
      try {
        const data = await fetchResponseMessages(offer.id, response.id);
        const sorted = Array.isArray(data)
          ? data.slice().sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
          : [];
        setMessages(sorted);
      } catch (error) {
        console.error("Failed to load messages", error);
        setMessages([]);
        toast.error(t("messages_load_failed", "Unable to load messages right now."));
      } finally {
        setMessagesLoading(false);
      }
    },
    [offer?.id, t]
  );

  useEffect(() => {
    if (!offer?.id || !activeResponse?.id) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const fetchAndSet = async () => {
      if (!cancelled) {
        await loadMessages(activeResponse);
      }
    };

    fetchAndSet();
    const intervalId = setInterval(fetchAndSet, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [offer?.id, activeResponse, loadMessages]);

  const handleSendMessage = useCallback(
    async ({ text, file, audio }) => {
      if (!offer || isOfferClosed) {
        toast.error(t("messages_disabled", "This offer is closed. Messaging is disabled."));
        return;
      }
      const trimmed = text?.trim();
      if (!trimmed) return;
      if (file || audio) {
        toast.error(t("attachments_disabled", "Attachments are not supported for offer messages yet."));
        return;
      }

      try {
        let response = activeResponse;
        if (!response) {
          const created = await createResponse(offer.id, {});
          await loadResponses({ selectResponseId: created?.id });
          response = created;
        }

        if (!response) {
          toast.error(t("response_create_failed", "Unable to start a conversation for this offer."));
          return;
        }

        await sendResponseMessage(offer.id, response.id, trimmed, replyTo?.id);
        setReplyTo(null);
        toast.success(t("message_sent", "Message sent!"));
        await loadMessages(response);
      } catch (error) {
        console.error("Failed to send message", error);
        toast.error(t("message_failed", "Failed to send message."));
      }
    },
    [offer, isOfferClosed, activeResponse, replyTo?.id, loadResponses, loadMessages, t]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!offer || !activeResponse?.id) return;
      try {
        await deleteResponseMessage(offer.id, activeResponse.id, messageId);
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
        toast.info(t("message_deleted", "Message deleted."));
      } catch (error) {
        console.error("Failed to delete message", error);
        toast.error(t("message_delete_failed", "Failed to delete message."));
      }
    },
    [offer, activeResponse?.id, t]
  );

  const handleSelectResponse = useCallback(
    async (responseId) => {
      const selected = responses.find((item) => item.id === responseId);
      if (!selected) return;
      setActiveResponse(selected);
      setReplyTo(null);
      await loadMessages(selected);
    },
    [responses, loadMessages]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("link_copied", "Link copied to clipboard!"));
    } catch (error) {
      console.error("Failed to copy link", error);
      toast.error(t("link_copy_failed", "Unable to copy link."));
    }
  }, [t]);

  const handleCloseOffer = useCallback(async () => {
    if (!offer || isOfferClosed) return;
    if (!window.confirm(t("confirm_close", "Close this offer?"))) return;
    try {
      await updateOffer(offer.id, { status: "closed" });
      setOffer((prev) => (prev ? { ...prev, status: "closed" } : prev));
      toast.success(t("closed_success", "Offer closed."));
    } catch (error) {
      console.error("Failed to close offer", error);
      toast.error(t("closed_failed", "Failed to close offer."));
    }
  }, [offer, isOfferClosed, t]);

  const contactContext = useMemo(() => {
    const activeInstructor = activeResponse
      ? {
          id: activeResponse.instructor_id,
          name: activeResponse.instructor_name,
          avatar: activeResponse.instructor_avatar,
          email: activeResponse.instructor_email,
          phone: activeResponse.instructor_phone,
        }
      : null;

    return {
      heading: isMyRequest
        ? t("contact_instructor", "Contact Instructor")
        : offer?.type === "instructor"
          ? t("contact_instructor", "Contact Instructor")
          : t("contact_student", "Contact Student"),
      userId: isMyRequest ? activeInstructor?.id : offer?.userId,
      email: isMyRequest ? activeInstructor?.email : offer?.email,
      phone: isMyRequest ? activeInstructor?.phone : offer?.phone,
      name: isMyRequest ? activeInstructor?.name : offer?.name,
    };
  }, [activeResponse, isMyRequest, offer, t]);

  if (shouldDeferRender) {
    return null;
  }

  if (offerLoading) {
    return (
      <div className="mx-auto mt-12 w-full max-w-4xl space-y-6">
        <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-100" />
        </div>
        <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-1/3 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (offerError) {
    return (
      <div className="mx-auto mt-12 w-full max-w-3xl space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
        <p className="text-lg font-semibold">{offerError}</p>
        <button
          type="button"
          onClick={loadOffer}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          {t("retry", "Try again")}
        </button>
        <Link
          href="/dashboard/student/offers"
          className="inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          ← {t("back_to_offers", "Back to offers")}
        </Link>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const contactButtons = [
    contactContext.userId && {
      key: "message",
      label: t("message", "Message"),
      icon: <FaComments />,
      action: () => router.push(`/messages?to=${contactContext.userId}`),
      className: "bg-blue-600 hover:bg-blue-700",
    },
    contactContext.phone && {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <FaWhatsapp />,
      action: () => window.open(`https://wa.me/${contactContext.phone.replace(/\D/g, "")}`, "_blank"),
      className: "bg-green-500 hover:bg-green-600",
    },
    contactContext.email && {
      key: "email",
      label: t("email", "Email"),
      icon: <FaEnvelope />,
      action: () => window.open(`mailto:${contactContext.email}`, "_blank"),
      className: "bg-gray-600 hover:bg-gray-700",
    },
  ].filter(Boolean);

  const statusLabel = offer.status.charAt(0).toUpperCase() + offer.status.slice(1);
  const offerTypeLabel = offer.offerType.charAt(0).toUpperCase() + offer.offerType.slice(1);

  return (
    <section className="mx-auto w-full max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/student/offers"
        className="mb-6 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700"
      >
        ← {t("back_to_offers", "Back to offers")}
      </Link>

      <article className="rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
        <header className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{offer.title}</h1>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                {t("posted_label", "Posted")}: {offer.postedLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                {t("type_label", "Type")}: {offerTypeLabel}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                  offer.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {t("status_label", "Status")}: {statusLabel}
              </span>
            </div>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isMyRequest ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
            }`}
          >
            {isMyRequest ? t("student_request", "Student Request") : t("instructor_offer", "Instructor Offer")}
          </span>
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <FaClock className="text-yellow-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("card_timeframe_label", "Timeframe")}</p>
                  <p className="text-base font-semibold text-gray-800">{offer.duration || t("flexible_timeline", "Flexible timeline")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaDollarSign className="text-yellow-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("card_budget_label", "Budget")}</p>
                  <p className="text-base font-semibold text-gray-800">{offer.priceLabel}</p>
                </div>
              </div>
              {offer.tags.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("card_tags_label", "Tags")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offer.tags.map((tag) => (
                      <span
                        key={`${offer.id}-${tag}`}
                        className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800"
                      >
                        <FaTag className="text-[0.65rem]" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{t("description", "Description")}</h2>
              <p className="mt-3 whitespace-pre-line text-gray-700">
                {offer.description || t("no_description", "No description provided.")}
              </p>
            </section>

            {isMyRequest && (
              <section className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-800">{t("manage_offer", "Manage offer")}</h2>
                <p className="mt-2 text-sm text-yellow-700">
                  {isOfferClosed
                    ? t("offer_closed_note", "This request is closed. You can reopen it at any time.")
                    : t("offer_open_note", "Close the request once you have found the right instructor.")}
                </p>
                <button
                  type="button"
                  onClick={handleCloseOffer}
                  disabled={isOfferClosed}
                  className="mt-4 inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isOfferClosed ? t("already_closed", "Offer closed") : t("close_offer", "Close offer")}
                </button>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{contactContext.heading}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {contactContext.name || t("contact_unknown", "Contact details will appear once a response is selected.")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {contactButtons.map((button) => (
                  <button
                    key={button.key}
                    type="button"
                    onClick={button.action}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${button.className}`}
                  >
                    {button.icon} {button.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{t("share_offer", "Share offer")}</h2>
              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <FaLink /> {t("copy_link", "Copy link")}
              </button>
            </div>
          </aside>
        </div>
      </article>

      <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{t("discussion_heading", "Offer discussion")}</h2>
          {replyTo && (
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {t("replying_to", "Replying to")} {replyTo.sender_name || t("message", "Message")}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {t("cancel", "Cancel")}
              </button>
            </div>
          )}
        </div>

        {responses.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {responses.map((respItem) => {
              const isActive = activeResponse?.id === respItem.id;
              return (
                <button
                  key={respItem.id}
                  type="button"
                  onClick={() => handleSelectResponse(respItem.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                      : "border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-yellow-500"
                  }`}
                >
                  {respItem.instructor_name || t("instructor_label", "Instructor")}
                </button>
              );
            })}
          </div>
        )}

        {responsesLoading && (
          <p className="mt-4 text-sm text-gray-500">{t("responses_loading", "Loading responses...")}</p>
        )}

        {!responsesLoading && responses.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            {isMyRequest
              ? t("no_responses_student", "No instructor has responded yet.")
              : t("no_responses_instructor", "Be the first to respond to this offer.")}
          </p>
        )}

        <div className="mt-4 max-h-[26rem] space-y-4 overflow-y-auto pr-2">
          {messagesLoading ? (
            <p className="text-sm text-gray-500">{t("messages_loading", "Loading messages...")}</p>
          ) : messages.length ? (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  {!isCurrentUser && (
                    <ChatImage
                      src={getAvatarUrl(message.sender_avatar || offer.avatar)}
                      alt={message.sender_name || offer.name}
                      className="h-9 w-9 rounded-full"
                      width={36}
                      height={36}
                    />
                  )}
                  <div className={`flex max-w-[75%] flex-col space-y-1 ${isCurrentUser ? "items-end" : "items-start"}`}>
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {isCurrentUser ? t("you_label", "You") : message.sender_name || offer.name}
                    </span>
                    <div
                      className={`w-full rounded-2xl px-4 py-3 text-sm shadow ${
                        isCurrentUser
                          ? "rounded-br-sm bg-emerald-500 text-white"
                          : "rounded-bl-sm bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.reply_message && (
                        <div className="mb-2 border-l-4 border-yellow-300 pl-2 text-xs italic text-gray-600">
                          {message.reply_message}
                        </div>
                      )}
                      {message.reply_file_url && isImage(message.reply_file_url) && (
                        <ChatImage
                          src={getMediaUrl(message.reply_file_url)}
                          alt="reply attachment"
                          className="mb-2 max-w-xs rounded-md"
                          width={220}
                          height={220}
                        />
                      )}
                      {message.reply_file_url && !isImage(message.reply_file_url) && (
                        <a
                          href={getMediaUrl(message.reply_file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-2 block text-xs underline"
                        >
                          {message.reply_file_url.split("/").pop()}
                        </a>
                      )}
                      {message.reply_audio_url && (
                        <audio controls src={getMediaUrl(message.reply_audio_url)} className="mb-2 w-48" />
                      )}
                      {message.message && <p>{message.message}</p>}
                      {message.file_url && isImage(message.file_url) && (
                        <ChatImage
                          src={getMediaUrl(message.file_url)}
                          alt="attachment"
                          className="mt-2 max-w-xs rounded-md"
                          width={220}
                          height={220}
                        />
                      )}
                      {message.file_url && !isImage(message.file_url) && (
                        <a
                          href={getMediaUrl(message.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-xs underline"
                        >
                          {message.file_url.split("/").pop()}
                        </a>
                      )}
                      {message.audio_url && (
                        <audio controls src={getMediaUrl(message.audio_url)} className="mt-2 w-48" />
                      )}
                    </div>
                    <div className={`flex items-center gap-2 text-xs text-gray-400 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <time>{formatRelativeTime(message.sent_at)}</time>
                      <button
                        type="button"
                        onClick={() => setReplyTo(message)}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {t("reply", "Reply")}
                      </button>
                      {isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="font-semibold text-red-600 hover:text-red-700"
                        >
                          {t("delete", "Delete")}
                        </button>
                      )}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <ChatImage
                      src={getAvatarUrl(user?.avatar_url)}
                      alt="You"
                      className="h-9 w-9 rounded-full"
                      width={36}
                      height={36}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
              {t("no_messages", "No messages yet. Start the conversation below.")}
            </p>
          )}
        </div>

        <div className="mt-6">
          <MessageInput
            sendMessage={handleSendMessage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </section>
    </section>
  );
};

StudentOfferDetailsPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default StudentOfferDetailsPage;

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});
