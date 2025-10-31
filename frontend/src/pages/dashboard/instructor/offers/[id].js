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
  FaEdit,
  FaTrashAlt,
  FaLink,
} from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import { updateOffer, deleteOffer } from "@/services/admin/offerService";
import { toast } from "react-toastify";
import {
  createResponse,
  fetchResponses,
  fetchMessages as fetchResponseMessages,
  sendMessage as sendResponseMessage,
  deleteMessage as deleteResponseMessage,
} from "@/services/offerResponseService";
import MessageInput from "@/components/chat/MessageInput";
import formatRelativeTime from "@/utils/relativeTime";
import { API_BASE_URL } from "@/config/config";
import ChatImage from "@/components/shared/ChatImage";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const SKELETON_LINES = 5;

const getAvatarUrl = (url) => {
  if (!url) return "/images/default-avatar.png";
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

const SkeletonBlock = () => (
  <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="h-6 w-2/3 rounded bg-gray-200" />
    <div className="flex gap-3">
      <div className="h-4 w-24 rounded-full bg-gray-200" />
      <div className="h-4 w-24 rounded-full bg-gray-200" />
      <div className="h-4 w-24 rounded-full bg-gray-200" />
    </div>
    <div className="h-4 w-1/2 rounded bg-gray-200" />
    <div className="h-4 w-4/5 rounded bg-gray-200" />
    <div className="h-32 rounded-lg bg-gray-100" />
  </div>
);

const SkeletonChat = () => (
  <div className="space-y-4">
    {Array.from({ length: SKELETON_LINES }).map((_, index) => (
      <div key={index} className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-12 w-full max-w-sm rounded-2xl bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

const OfferDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasHydrated } = useAuthStore();
  const currentUserId = user?.id;

  const shouldDeferRender = !hasHydrated || !user || user.role?.toLowerCase() !== "instructor";

  const [offer, setOffer] = useState(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState(true);
  const [offerError, setOfferError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [activeResponse, setActiveResponse] = useState(null);

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);

  const isMyOffer = useMemo(() => offer?.userId === currentUserId, [offer?.userId, currentUserId]);

  const hydrateOffer = useCallback(async () => {
    if (!id) return;
    setIsLoadingOffer(true);
    setOfferError(null);

    try {
      const data = await fetchOfferById(id);
      if (!data) {
        setOffer(null);
        setOfferError("Offer not found");
        return;
      }

      setOffer({
        id: data.id,
        userId: data.student_id,
        name: data.student_name,
        avatar: data.student_avatar,
        type: data.student_role?.toLowerCase() === "instructor" ? "instructor" : "student",
        offerType: data.offer_type,
        title: data.title,
        budget: data.budget === null || data.budget === undefined ? null : Number(data.budget),
        duration: typeof data.timeframe === "string" ? data.timeframe.trim() : "",
        tags: Array.isArray(data.tags)
          ? data.tags
              .map((tag) => (typeof tag === "string" ? tag : tag?.name))
              .filter(Boolean)
          : [],
        createdAt: data.created_at || null,
        description: data.description || "",
        status: (data.status || "open").toLowerCase(),
        email: data.student_email || "",
        phone: data.student_phone || "",
      });
    } catch (error) {
      console.error("Failed to load offer", error);
      setOffer(null);
      setOfferError("We couldn't load this offer. Please try again later.");
    } finally {
      setIsLoadingOffer(false);
    }
  }, [id]);

  const mergeMessages = (responses) =>
    responses
      .flat()
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  const loadConversation = useCallback(async () => {
    if (!offer?.id) return;
    setIsLoadingMessages(true);
    try {
      const responses = await fetchResponses(offer.id);
      if (!responses.length) {
        setActiveResponse(null);
        setMessages([]);
        return;
      }

      const matchingResponse = responses.find((resp) => resp.instructor_id === currentUserId);
      const ownerResponse = offer.userId === currentUserId ? responses[0] : null;
      const effectiveResponse = matchingResponse || ownerResponse || responses[0];
      setActiveResponse(effectiveResponse || null);

      const messageGroups = await Promise.all(
        responses.map((resp) => fetchResponseMessages(offer.id, resp.id))
      );
      setMessages(mergeMessages(messageGroups));
    } catch (error) {
      console.error("Failed to load conversation", error);
      if (!messages.length) {
        toast.error("Unable to load offer discussion right now.");
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [offer?.id, offer?.userId, currentUserId, messages.length]);

  useEffect(() => {
    if (shouldDeferRender || !id) return;
    hydrateOffer();
  }, [id, shouldDeferRender, hydrateOffer]);

  useEffect(() => {
    if (!offer?.id) return;
    loadConversation();

    const interval = setInterval(loadConversation, 10000);
    return () => clearInterval(interval);
  }, [offer?.id, loadConversation]);

  const handleSendMessage = useCallback(
    async ({ text, file, audio }) => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      if (file || audio) {
        toast.error("Attachments are not supported for offer messages.");
      }

      try {
        let response = activeResponse;
        if (!response || (response.instructor_id !== currentUserId && offer?.userId !== currentUserId)) {
          response = await createResponse(offer.id, {});
          setActiveResponse(response);
          setMessages([]);
        }

        const sent = await sendResponseMessage(offer.id, response.id, trimmed, replyTo?.id);
        setMessages((prev) => [...prev, sent]);
        setReplyTo(null);
      } catch (error) {
        console.error("Failed to send message", error);
        toast.error("Failed to send message. Please try again.");
      }
    },
    [activeResponse, currentUserId, offer?.id, offer?.userId, replyTo?.id]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!activeResponse?.id || !offer?.id) return;
      try {
        await deleteResponseMessage(offer.id, activeResponse.id, messageId);
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
      } catch (error) {
        console.error("Failed to delete message", error);
        toast.error("Could not delete the message.");
      }
    },
    [activeResponse?.id, offer?.id]
  );

  const toggleStatus = useCallback(async () => {
    if (!offer) return;
    const nextStatus = offer.status === "open" ? "closed" : "open";

    setIsTogglingStatus(true);
    setOffer((prev) => (prev ? { ...prev, status: nextStatus } : prev));

    try {
      await updateOffer(offer.id, { status: nextStatus });
      toast.success(`Offer ${nextStatus === "open" ? "reopened" : "closed"} successfully.`);
    } catch (error) {
      console.error("Failed to toggle status", error);
      setOffer((prev) => (prev ? { ...prev, status: prev.status === "open" ? "closed" : "open" } : prev));
      toast.error("Unable to update the offer status.");
    } finally {
      setIsTogglingStatus(false);
    }
  }, [offer]);

  const handleDeleteOffer = useCallback(async () => {
    if (!offer?.id) return;
    if (!window.confirm("Delete this offer? This action cannot be undone.")) {
      return;
    }

    setIsDeletingOffer(true);
    try {
      await deleteOffer(offer.id);
      toast.success("Offer deleted successfully.");
      router.push("/dashboard/instructor/offers");
    } catch (error) {
      console.error("Failed to delete offer", error);
      toast.error("Unable to delete this offer.");
      setIsDeletingOffer(false);
    }
  }, [offer?.id, router]);

  const copyOfferLink = useCallback(() => {
    if (typeof window === "undefined") return;
    const link = window.location.href;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(() => toast.success("Offer link copied to clipboard."))
        .catch(() => {
          toast.info(link);
        });
    } else {
      toast.info(link);
    }
  }, []);

  if (shouldDeferRender) {
    return null;
  }

  if (isLoadingOffer) {
    return (
      <div className="mx-auto mt-12 w-full max-w-4xl">
        <SkeletonBlock />
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <SkeletonChat />
        </div>
      </div>
    );
  }

  if (offerError || !offer) {
    return (
      <div className="mx-auto mt-12 w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
        <p className="text-lg font-semibold">{offerError || "Offer not found."}</p>
        <button
          type="button"
          onClick={hydrateOffer}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const priceLabel = offer.budget === null ? "Not specified" : formatCurrency(offer.budget, { fallback: "—" });
  const postedLabel = offer.createdAt ? formatDate(offer.createdAt) : "—";

  const contactButtons = [
    offer.email && {
      key: "email",
      label: "Email",
      icon: <FaEnvelope />,
      action: () => window.open(`mailto:${offer.email}`, "_blank"),
      className: "bg-gray-600 hover:bg-gray-700",
    },
    offer.phone && {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <FaWhatsapp />,
      action: () => window.open(`https://wa.me/${offer.phone.replace(/\D/g, "")}`, "_blank"),
      className: "bg-green-500 hover:bg-green-600",
    },
    {
      key: "message",
      label: "Message",
      icon: <FaComments />,
      action: () => router.push(`/messages?to=${offer.userId}`),
      className: "bg-blue-600 hover:bg-blue-700",
    },
  ].filter(Boolean);

  return (
    <section className="mx-auto w-full max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/instructor/offers"
        className="mb-6 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700"
      >
        ← Back to Offers
      </Link>

      <article className="rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
        <header className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{offer.title}</h1>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                Type: {offer.offerType || "—"}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                  offer.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                Status: {offer.status}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                Posted: {postedLabel}
              </span>
            </div>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              offer.type === "student" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
            }`}
          >
            {offer.type === "student" ? "Student Request" : "Instructor Offer"}
          </span>
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <FaClock className="text-yellow-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Timeframe</p>
                  <p className="text-base font-semibold text-gray-800">{offer.duration || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaDollarSign className="text-yellow-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Budget</p>
                  <p className="text-base font-semibold text-gray-800">{priceLabel}</p>
                </div>
              </div>
              {offer.tags.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tags</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-3 whitespace-pre-line text-gray-700">
                {offer.description || "No description provided."}
              </p>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              {isMyOffer ? (
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href={`/dashboard/instructor/offers/edit/${offer.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white transition hover:bg-yellow-600"
                  >
                    <FaEdit /> Edit Offer
                  </Link>
                  <button
                    type="button"
                    onClick={toggleStatus}
                    disabled={isTogglingStatus}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {offer.status === "open" ? "Close Offer" : "Reopen Offer"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOffer}
                    disabled={isDeletingOffer}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    <FaTrashAlt /> Delete Offer
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-600">Connect with the {offer.type === "student" ? "student" : "instructor"}:</p>
                  <div className="flex flex-wrap gap-3">
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
              )}
              <button
                type="button"
                onClick={copyOfferLink}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <FaLink /> Copy offer link
              </button>
            </div>
          </aside>
        </div>
      </article>

      <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Offer discussion</h2>
          {replyTo && (
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              Replying to {replyTo.sender_name || "message"}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 max-h-[26rem] space-y-4 overflow-y-auto pr-2">
          {isLoadingMessages ? (
            <SkeletonChat />
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
                      {isCurrentUser ? "You" : message.sender_name || offer.name}
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
                        Reply
                      </button>
                      {isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="font-semibold text-red-600 hover:text-red-700"
                        >
                          Delete
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
              No messages yet. Start the conversation below.
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

OfferDetailsPage.getLayout = (page) => <InstructorLayout>{page}</InstructorLayout>;

export default OfferDetailsPage;

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});
