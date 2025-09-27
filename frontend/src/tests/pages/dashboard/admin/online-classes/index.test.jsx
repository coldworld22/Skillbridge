import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";

const fetchAdminClassesMock = jest.fn();
const toggleClassStatusMock = jest.fn();
const approveAdminClassMock = jest.fn();
const rejectAdminClassMock = jest.fn();
const deleteAdminClassMock = jest.fn();
const updateAdminClassMock = jest.fn();

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => "ltr" },
  }),
}));

jest.mock("@/services/admin/classService", () => ({
  __esModule: true,
  fetchAdminClasses: (...args) => fetchAdminClassesMock(...args),
  toggleClassStatus: (...args) => toggleClassStatusMock(...args),
  approveAdminClass: (...args) => approveAdminClassMock(...args),
  rejectAdminClass: (...args) => rejectAdminClassMock(...args),
  deleteAdminClass: (...args) => deleteAdminClassMock(...args),
  updateAdminClass: (...args) => updateAdminClassMock(...args),
}));

jest.mock("@/services/notificationService", () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/messageService", () => ({
  sendChatMessage: jest.fn().mockResolvedValue(undefined),
}));

const notificationFetchMock = jest.fn();
jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: (selector) =>
    selector
      ? selector({ fetch: notificationFetchMock })
      : { fetch: notificationFetchMock },
}));

const messageFetchMock = jest.fn();
jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: (selector) =>
    selector ? selector({ fetch: messageFetchMock }) : { fetch: messageFetchMock },
}));

const authState = {
  user: { id: "admin-1", permissions: ["ADD_ONLINE_CLASS_RULE"] },
  hasHydrated: true,
};
jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: (selector) =>
    selector
      ? selector(authState)
      : authState,
}));

const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: (...args) => toastSuccessMock(...args),
    error: (...args) => toastErrorMock(...args),
  },
}));

describe("AdminClassesTable status toggling", () => {
  const baseClass = {
    id: "class-1",
    title: "Sample Class",
    instructor: "John Doe",
    instructor_id: "admin-1",
    start_date: "2024-01-10",
    end_date: "2024-01-12",
    category: "Tech",
    price: 0,
    scheduleStatus: "Upcoming",
    publishStatus: "draft",
    approvalStatus: "Pending",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchAdminClassesMock.mockResolvedValue({
      data: [baseClass],
      meta: { totalPages: 1, total: 1 },
    });
  });

  it("replaces the entire row with the refreshed class after toggling publish status", async () => {
    const refreshedClass = {
      ...baseClass,
      publishStatus: "published",
      approvalStatus: "Approved",
    };
    toggleClassStatusMock.mockResolvedValue(refreshedClass);

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Draft" })).toBeInTheDocument();
    });

    expect(screen.getByText("Approve")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Draft" }));

    await waitFor(() => {
      expect(toggleClassStatusMock).toHaveBeenCalledWith("class-1");
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Published" })).toBeInTheDocument();
    });

    expect(
      screen.getByText("Approved", { selector: "span" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith("Status updated");
  });
});
