import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
                {title && (
                  <Dialog.Title className="text-xl font-semibold mb-4 text-gray-800">
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
      {message && <p className="text-gray-600 mb-6">{t(message)}</p>}
      <div className="flex justify-end gap-4">
        <Button
          onClick={onClose}
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          {t(cancelText)}
        </Button>
        <Button
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
          className="bg-red-500 text-white hover:bg-red-600"
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
      {message && <p className="text-gray-600 mb-4">{t(message)}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(placeholder)}
        className="border border-gray-300 rounded w-full px-3 py-2 mb-6"
      />
      <div className="flex justify-end gap-4">
        <Button
          onClick={onClose}
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          {t(cancelText)}
        </Button>
        <Button
          onClick={() => {
            onConfirm?.(value);
            onClose();
          }}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {t(confirmText)}
        </Button>
      </div>
    </Modal>
  );
}
