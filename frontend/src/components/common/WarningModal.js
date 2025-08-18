import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";

export default function WarningModal({ isOpen, title, message, onClose, confirmText }) {
  const { t } = useTranslation();

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
                <Dialog.Title className="text-lg font-semibold text-yellow-600">
                  {t(title || "Warning")}
                </Dialog.Title>
                {message && (
                  <p className="mt-2 text-sm text-gray-600">{t(message)}</p>
                )}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={onClose}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    {t(confirmText || "OK")}
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
