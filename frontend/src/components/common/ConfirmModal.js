// src/components/common/ConfirmModal.js

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import styles from "./Modal.module.scss";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
}) {
  const { t } = useTranslation();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className={styles.dialog} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter={styles.fadeEnter}
          enterFrom={styles.fadeEnterFrom}
          enterTo={styles.fadeEnterTo}
          leave={styles.fadeLeave}
          leaveFrom={styles.fadeLeaveFrom}
          leaveTo={styles.fadeLeaveTo}
        >
          <div className={styles.backdrop} />
        </Transition.Child>

        <div className={styles.container}>
          <div className={styles.inner}>
            <Transition.Child
              as={Fragment}
              enter={styles.scaleEnter}
              enterFrom={styles.scaleEnterFrom}
              enterTo={styles.scaleEnterTo}
              leave={styles.scaleLeave}
              leaveFrom={styles.scaleLeaveFrom}
              leaveTo={styles.scaleLeaveTo}
            >
              <Dialog.Panel className={styles.panel}>
                <Dialog.Title className={styles.title}>
                  {t(title || "Confirm")}
                </Dialog.Title>
                {message && <p className={styles.message}>{t(message)}</p>}
                <div className={styles.actions}>
                  <Button onClick={onClose} variant="neutral">
                    {t(cancelText || "Cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      onConfirm?.();
                      onClose();
                    }}
                  >
                    {t(confirmText || "Confirm")}
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
