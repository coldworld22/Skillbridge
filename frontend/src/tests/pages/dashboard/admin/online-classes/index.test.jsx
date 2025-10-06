import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import AdminClassesTable, {
  FAILED_SIGNATURE_RETRY_DELAY_MS,
} from "@/components/admin/online-classes/AdminClassesTable";

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

  it("approves a class without showing an error toast", async () => {
    approveAdminClassMock.mockResolvedValue({ publishStatus: "published" });

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Approve" })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]);

    await waitFor(() => {
      expect(approveAdminClassMock).toHaveBeenCalledWith("class-1");
    });

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Class approved");
    });

    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("rejects a class without showing an error toast", async () => {
    rejectAdminClassMock.mockResolvedValue(undefined);

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Reject" })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);

    const reasonField = await screen.findByPlaceholderText("Enter rejection reason");
    fireEvent.change(reasonField, { target: { value: "Not a good fit" } });

    fireEvent.click(screen.getByRole("button", { name: "Yes, Reject" }));

    await waitFor(() => {
      expect(rejectAdminClassMock).toHaveBeenCalledWith("class-1", "Not a good fit");
    });

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Class rejected");
    });

    expect(toastErrorMock).not.toHaveBeenCalled();
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

  it("retries fetching classes automatically after a failure", async () => {
    jest.useFakeTimers();
    try {
      const networkError = new Error("Network error");
      fetchAdminClassesMock.mockRejectedValueOnce(networkError);

      render(<AdminClassesTable />);

      await waitFor(() => {
        expect(fetchAdminClassesMock).toHaveBeenCalledTimes(1);
      });

      expect(toastErrorMock).toHaveBeenCalledWith("Failed to load classes");

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(fetchAdminClassesMock).toHaveBeenCalledTimes(2);
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("stops retrying and surfaces an auth error when the server returns 403", async () => {
    const forbiddenError = Object.assign(new Error("Forbidden"), {
      response: { status: 403 },
    });
    fetchAdminClassesMock.mockRejectedValue(forbiddenError);

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to load classes. Please sign in again to continue."
        )
      ).toBeInTheDocument();
    });

    expect(fetchAdminClassesMock).toHaveBeenCalledTimes(1);
  });

  it("resets to a valid page when total pages shrink without looping", async () => {
    const pageOneClass = { ...baseClass, id: "class-page-1", title: "Page 1 Class" };
    const adjustedPageClass = {
      ...baseClass,
      id: "class-adjusted",
      title: "Adjusted Page Class",
    };
    let callCount = 0;
    fetchAdminClassesMock.mockImplementation(({ page }) => {
      callCount += 1;
      if (callCount === 1) {
        expect(page).toBe(1);
        return Promise.resolve({
          data: [pageOneClass],
          meta: { totalPages: 3, total: 15 },
        });
      }

      if (callCount === 2) {
        expect(page).toBe(3);
        return Promise.resolve({
          data: [adjustedPageClass],
          meta: { totalPages: 2, total: 10 },
        });
      }

      throw new Error(`Unexpected additional fetch call: ${callCount} (page=${page})`);
    });

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(fetchAdminClassesMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Page 1 Class")).toBeInTheDocument();

    const pageThreeButton = await screen.findByRole("button", { name: "3" });
    await act(async () => {
      fireEvent.click(pageThreeButton);
    });

    await waitFor(() => {
      expect(fetchAdminClassesMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByText("Adjusted Page Class")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "2" })).toHaveClass("bg-yellow-500");
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchAdminClassesMock).toHaveBeenCalledTimes(2);
  });
});
