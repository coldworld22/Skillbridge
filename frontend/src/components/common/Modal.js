import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import styles from "./Modal.module.scss";

export default function Modal({ isOpen, onClose, title, children }) {
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
                {title && (
                  <Dialog.Title className={styles.title}>
                    {title}
                  </Dialog.Title>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "confirm",
  cancelText = "cancel",
  ns = "dashboard",
}) {
  const { t } = useTranslation(ns);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(title)}>
      {message && <p className={styles.message}>{t(message)}</p>}
      <div className={styles.actions}>
        <Button onClick={onClose} variant="neutral">
          {t(cancelText)}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
        >
          {t(confirmText)}
        </Button>
      </div>
    </Modal>
  );
}

export function PromptModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "confirm",
  cancelText = "cancel",
  placeholder = "",
  ns = "dashboard",
}) {
  const { t } = useTranslation(ns);
  const [value, setValue] = useState("");
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(title)}>
      {message && <p className={styles.message}>{t(message)}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(placeholder)}
        className={styles.input}
      />
      <div className={styles.actions}>
        <Button onClick={onClose} variant="neutral">
          {t(cancelText)}
        </Button>
        <Button
          variant="accent"
          onClick={() => {
            onConfirm?.(value);
            onClose();
          }}
        >
          {t(confirmText)}
        </Button>
      </div>
    </Modal>
  );
}
