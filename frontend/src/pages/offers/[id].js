import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import {
  fetchResponses,
  fetchMessages as fetchResponseMessages,
  sendMessage as sendResponseMessage,
  deleteMessage as deleteResponseMessage,
} from "@/services/offerResponseService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  FaArrowLeft,
  FaTag,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaComment,
  FaPaperPlane,
} from "react-icons/fa";
import { resolveApiBase } from "@/utils/serverApi";
import nextI18NextConfig from "../../../next-i18next.config.js";
import styles from "./offers.module.scss";

dayjs.extend(relativeTime);

const mapOffer = (offer) =>
  offer
    ? {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        type: offer.offer_type === "class" ? "instructor" : "student",
        price: offer.budget || "",
        duration: offer.timeframe || "",
        tags: offer.tags?.map((t) => t.name) || [],
        date: offer.created_at || offer.updated_at,
        expires_at: offer.expires_at,
        owner: offer.student_name,
        ownerRole: offer.student_role,
      }
    : null;

const OfferDetailsPage = ({ initialOffer = null }) => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const [offer, setOffer] = useState(initialOffer);
  const [response, setResponse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef(null);
  const [loading, setLoading] = useState(!initialOffer);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialOffer) {
      setOffer(initialOffer);
      setLoading(false);
      setError(null);
    }
  }, [initialOffer]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const hydrateOffer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOfferById(id);
        if (!cancelled) {
          setOffer(mapOffer(data));
        }
      } catch (err) {
        if (!cancelled) {
          setOffer(null);
          setError("Failed to load offer");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const hydrateResponses = async () => {
      try {
        const resps = await fetchResponses(id);
        if (cancelled) return;
        if (resps.length) {
          const first = resps[0];
          setResponse(first);
          const msgs = await fetchResponseMessages(id, first.id);
          if (cancelled) return;
          setMessages(
            msgs.map((m) => ({
              id: m.id,
              sender: m.sender_name,
              senderId: m.sender_id,
              text: m.message,
              time: m.sent_at,
            }))
          );
        } else {
          setResponse(null);
          setMessages([]);
        }
      } catch (err) {
        if (!cancelled) {
          setResponse(null);
          setMessages([]);
        }
      }
    };

    if (!initialOffer || String(initialOffer.id) !== String(id)) {
      hydrateOffer();
    } else {
      setLoading(false);
    }

    hydrateResponses();

    return () => {
      cancelled = true;
    };
  }, [id, initialOffer]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !response) return;
    try {
      const sent = await sendResponseMessage(id, response.id, newMessage.trim());
      const msg = {
        id: sent.id,
        sender: user?.full_name || "You",
        senderId: user?.id,
        text: sent.message,
        time: sent.sent_at,
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (_) {}
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteResponseMessage(id, response.id, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (_) {}
  };

  if (!offer) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>
          {error || (loading ? "Loading offer details..." : "Offer not found.")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHead title={`${offer.title} – Offer`} />
      <Head>
        <meta name="description" content={`Offer details: ${offer.description}`} />
      </Head>
      <Navbar />

      <main className={styles.hero}>
        <div className={styles.container}>
          <Link
            href="/offers"
            className={styles.backLink}
          >
            <FaArrowLeft /> Back to Offers
          </Link>

          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <h1 className={styles.detailTitle}>{offer.title}</h1>
              <span
                className={`${styles.pill} ${
                  offer.type === "student" ? styles.pillStudent : styles.pillInstructor
                }`}
              >
                {offer.type === "student" ? "Student Request" : "Instructor Offer"}
              </span>
            </div>

            <p className={styles.detailDesc}>{offer.description}</p>

            <div className={styles.detailMeta}>
              <span className={styles.metaUser}>
                {offer.type === "student" ? <FaUserGraduate /> : <FaChalkboardTeacher />}
                {offer.owner} ({offer.ownerRole})
              </span>
              <span>Price: {offer.price}</span>
              <span>Duration: {offer.duration}</span>
            </div>

            <p className={styles.cardMeta}>
              Created: {dayjs(offer.date).format("MMM D, YYYY")}
              {offer.expires_at && (
                <> • Ends: {dayjs(offer.expires_at).format("MMM D, YYYY")}</>
              )}
            </p>

            <div className={styles.chipList}>
              {offer.tags?.map((tag, i) => (
                <span
                  key={i}
                  className={styles.chip}
                >
                  <FaTag /> {tag}
                </span>
              ))}
            </div>

            {/* Negotiation Chat */}
            <div className={styles.chatBox}>
              <div className={styles.chatHeader}>
                <span className={styles.chatTitle}>
                  <FaComment /> Negotiation / Discussion
                </span>
                <span className={styles.mutedSmall}>
                  {messages.length} messages
                </span>
              </div>

              <div
                ref={chatRef}
                className={styles.messages}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={styles.bubble}
                  >
                    <div className={styles.msgHeader}>
                      <span className={styles.msgSender}>{msg.sender}</span>
                      <span>{dayjs(msg.time).fromNow()}</span>
                    </div>
                    <div className={styles.bubbleRow}>
                      <span>{msg.text}</span>
                      {msg.senderId === user?.id && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className={styles.deleteBtn}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.inputRow}>
                <input
                  type="text"
                  placeholder="Type your message or offer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={styles.input}
                />
                <button
                  onClick={handleSend}
                  className={styles.sendBtn}
                  type="button"
                >
                  <FaPaperPlane /> Send
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OfferDetailsPage;

export async function getServerSideProps({ locale, params }) {
  const { id } = params || {};
  const apiBase = resolveApiBase(false).replace(/\/$/, '');
  let initialOffer = null;

  if (id) {
    try {
      const res = await fetch(`${apiBase}/offers/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const raw = json?.data ?? json ?? null;
        if (raw) {
          initialOffer = mapOffer(raw);
        }
      } else if (res.status === 404) {
        return { notFound: true };
      }
    } catch (err) {
      console.warn(`Failed to preload offer ${id}`, err);
    }
  }

  if (!initialOffer) {
    return { notFound: true };
  }

  return {
    props: {
      initialOffer,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
