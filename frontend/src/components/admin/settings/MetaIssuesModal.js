import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useTranslation } from "next-i18next";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

export default function MetaIssuesModal({ issues, open, onClose, lastChecked, onEdit }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.metaIssues" });
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className={modalStyles.dialog} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={modalStyles.backdrop} />
        </Transition.Child>

        <div className={modalStyles.container}>
          <div className={modalStyles.inner} style={{ textAlign: "left" }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={modalStyles.panel} style={{ maxWidth: "34rem" }}>
                <Dialog.Title className={modalStyles.title}>
                  {t("title", { count: issues.length })}
                </Dialog.Title>
                <div className="mt-2">
                  {issues.length === 0 ? (
                    <p className={modalStyles.muted}>{t("noIssues")}</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {issues.map((iss, idx) => (
                        <li key={idx} style={{ borderBottom: "1px solid var(--border-color, #e5e7eb)", paddingBottom: "0.35rem" }}>
                          <div className={modalStyles.name}>{iss.path}</div>
                          <div style={{ color: "#b91c1c" }}>{t("missing", { fields: iss.missing.join(", ") })}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {lastChecked && (
                    <p className={modalStyles.mutedSmall} style={{ marginTop: "0.5rem" }}>
                      {t("lastChecked", { date: new Date(lastChecked).toLocaleString() })}
                    </p>
                  )}
                </div>
                <div className={modalStyles.ctaRow} style={{ marginTop: "1rem" }}>
                  {issues.length > 0 && (
                    <Button
                      variant="accent"
                      onClick={() => {
                        onClose();
                        onEdit && onEdit();
                      }}
                    >
                      {t("editMeta")}
                    </Button>
                  )}
                  <Button variant="neutral" onClick={onClose}>
                    {t("close")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
