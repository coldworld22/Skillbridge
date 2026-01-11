import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
import { acceptTenantInviteToken } from "@/services/auth/authService";

export default function AcceptInvite() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [status, setStatus] = useState("pending");
  const [tenantName, setTenantName] = useState(null);

  const token = useMemo(() => {
    if (!router.isReady) return null;
    const raw = router.query.token;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.isReady, router.query.token]);

  useEffect(() => {
    if (!token) return;
    const acceptInvite = async () => {
      try {
        const res = await acceptTenantInviteToken(token);
        setTenantName(res?.data?.tenant?.name || null);
        setStatus("success");
        toast.success(
          t("invite_accepted", {
            defaultValue: "Invite accepted. You can now sign in.",
          })
        );
      } catch (err) {
        setStatus("error");
        toast.error(
          t("invite_accept_failed", {
            defaultValue: "Unable to accept invite. Please contact support.",
          })
        );
      }
    };
    acceptInvite();
  }, [token, t]);

  useEffect(() => {
    if (router.isReady && !token) {
      setStatus("missing");
    }
  }, [router.isReady, token]);

  const statusCopy = () => {
    if (status === "missing") {
      return t("invite_missing", {
        defaultValue: "Invite token missing. Please check your link.",
      });
    }
    if (status === "error") {
      return t("invite_error", {
        defaultValue: "We could not process your invite.",
      });
    }
    if (status === "success") {
      return t("invite_success", {
        defaultValue: tenantName
          ? `You're now a member of ${tenantName}.`
          : "You're now a member."
      });
    }
    return t("invite_processing", {
      defaultValue: "Processing your invite...",
    });
  };

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${styles.card} ${styles.compactCard}`}
      >
        <h2 className={styles.title}>
          {t("accept_invite", { defaultValue: "Accept invite" })}
        </h2>
        <p className={styles.statusText}>{statusCopy()}</p>
        <div className={styles.centered}>
          <Link href="/auth/login" className={styles.link}>
            {t("go_to_login", { defaultValue: "Go to login" })}
          </Link>
          {status === "success" && (
            <Link href="/dashboard" className={styles.link}>
              {t("go_to_dashboard", { defaultValue: "Go to dashboard" })}
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "auth"], nextI18NextConfig)),
    },
  };
}
