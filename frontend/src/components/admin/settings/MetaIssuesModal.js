import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useTranslation } from "next-i18next";

export default function MetaIssuesModal({ issues, open, onClose, lastChecked, onEdit }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.metaIssues" });
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  {t("title", { count: issues.length })}
                </Dialog.Title>
                <div className="mt-2">
                  {issues.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("noIssues")}</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {issues.map((iss, idx) => (
                        <li key={idx} className="border-b pb-1">
                          <div className="font-medium">{iss.path}</div>
                          <div className="text-red-600">{t("missing", { fields: iss.missing.join(", ") })}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {lastChecked && (
                    <p className="mt-2 text-xs text-gray-500">
                      {t("lastChecked", { date: new Date(lastChecked).toLocaleString() })}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {issues.length > 0 && (
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                      onClick={() => {
                        onClose();
                        onEdit && onEdit();
                      }}
                    >
                      {t("editMeta")}
                    </button>
                  )}
                  <button className="bg-gray-100 px-4 py-2 rounded" onClick={onClose}>
                    {t("close")}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
