// 📁 src/pages/auth/register.js
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialRegister from "@/shared/components/auth/SocialRegister";
import styles from "@/shared/components/auth/auth.module.scss";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { registerSchema } from "@/utils/auth/validationSchemas";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { recordGoogleAdsConversion } from "@/utils/googleAds";

function RegisterForm({ recaptchaCfg, cfgLoading, setRecaptchaCfg, setCfgLoading }) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const { register: registerUser, user, hasHydrated } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const { executeRecaptcha } = useGoogleReCaptcha() || {};

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema(t)),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "Student",
    },
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) router.replace("/website");
  }, [user, hasHydrated]);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  const onSubmit = async (data) => {
    try {
      const { full_name, email, phone, password, role } = data;
      let cfg = recaptchaCfg;
      if (!cfg && cfgLoading) {
        cfg = await fetchSocialLoginConfig().catch(() => null);
        setRecaptchaCfg(cfg);
        setCfgLoading(false);
      }
      let token;
      if (cfg?.recaptcha?.active && executeRecaptcha) {
        token = await executeRecaptcha("register");
      }
      await registerUser({
        full_name,
        email,
        phone,
        password,
        role,
        recaptchaToken: token,
      });
      toast.success(t("registration_successful"));
      recordGoogleAdsConversion("signup", {
        user_role: role,
        language: router.locale || "en",
      });
      fetchNotifications();
      router.push("/auth/login");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        t("registration_failed");
      toast.error(msg);
    }
  };

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4 }}
        className={styles.card}
      >
        <div className={styles.logoRing}>
          <img
            src={settings.logo_url ? `${API_BASE_URL}${settings.logo_url}` : "/images/logo.png"}
            alt={(settings.appName || "SkillBridge") + " Logo"}
            width={80}
            height={80}
            className={styles.logoImg}
          />
        </div>

        <h2 className={styles.title}>
          {t("create_account", { appName: settings.appName || "SkillBridge" })}
        </h2>

        <div className={styles.roleToggle}>
          {["Student", "Instructor"].map((type) => (
            <motion.button
              key={type}
              onClick={() => setValue("role", type)}
              whileHover={{ scale: 1.05 }}
              className={`${styles.roleButton} ${watch("role") === type ? styles.roleButtonActive : ""}`}
            >
              {t(type.toLowerCase())}
            </motion.button>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <InputField label={t("full_name")} type="text" placeholder={t("full_name")} {...register("full_name")} />
          {errors.full_name && <p className={styles.error}>{errors.full_name.message}</p>}

          <InputField label={t("email")} type="email" placeholder={t("email")} {...register("email")} />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}

          <div className={`${styles.field} ${styles.phoneField}`}>
            <label className={styles.label}>{t("phone")}</label>
            <div className={styles.phoneWrapper}>
              <PhoneInput
                international
                value={watch("phone")}
                onChange={(value) => setValue("phone", value ?? "")}
                defaultCountry="SA"
                placeholder={t("phone")}
              />
            </div>
            {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
          </div>

          <InputField
            label={t("password")}
            type="password"
            placeholder={t("password")}
            {...register("password")}
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}

          <InputField
            label={t("confirm_password")}
            type="password"
            placeholder={t("confirm_password")}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword.message}</p>}

          <motion.button
            whileHover={{ scale: isSubmitting || (cfgLoading && !recaptchaCfg) ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || (cfgLoading && !recaptchaCfg) ? 1 : 0.98 }}
            type="submit"
            disabled={isSubmitting || (cfgLoading && !recaptchaCfg)}
            className={styles.primaryButton}
          >
            {isSubmitting ? t("registering") : t("register")}
          </motion.button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine} aria-hidden />
          <span className={styles.dividerLabel}>{t("or", { defaultValue: "Or" })}</span>
          <span className={styles.dividerLine} aria-hidden />
        </div>
        <SocialRegister />

        <p className={`${styles.helper} ${styles.smallText}`}>
          {t("already_have_account")}{" "}
          <a href="/auth/login" className={styles.link}>
            {t("login")}
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function Register() {
  const [recaptchaCfg, setRecaptchaCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);

  useEffect(() => {
    fetchSocialLoginConfig()
      .then(setRecaptchaCfg)
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  if (recaptchaCfg?.recaptcha?.active) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaCfg.recaptcha.siteKey}>
        <RegisterForm
          recaptchaCfg={recaptchaCfg}
          cfgLoading={cfgLoading}
          setRecaptchaCfg={setRecaptchaCfg}
          setCfgLoading={setCfgLoading}
        />
      </GoogleReCaptchaProvider>
    );
  }

  return (
    <RegisterForm
      recaptchaCfg={recaptchaCfg}
      cfgLoading={cfgLoading}
      setRecaptchaCfg={setRecaptchaCfg}
      setCfgLoading={setCfgLoading}
    />
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
