import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";
import { fetchAdminClasses, deleteAdminClass } from "@/services/admin/classService";
import { toast } from "react-toastify";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <a {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockAuthState = {
  user: { id: 1, permissions: [] },
  hasHydrated: true,
};

jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: (selector) => selector(mockAuthState),
}));

const mockNotificationStore = { fetch: jest.fn() };
jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: (selector) => selector(mockNotificationStore),
}));

const mockMessageStore = { fetch: jest.fn() };
jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: (selector) => selector(mockMessageStore),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/services/notificationService", () => ({
  createNotification: jest.fn(),
}));

jest.mock("@/services/messageService", () => ({
  sendChatMessage: jest.fn(),
}));

jest.mock("@/services/admin/classService", () => ({
  fetchAdminClasses: jest.fn(),
  updateAdminClass: jest.fn(),
  deleteAdminClass: jest.fn(),
  approveAdminClass: jest.fn(),
  rejectAdminClass: jest.fn(),
  toggleClassStatus: jest.fn(),
}));

describe("AdminClassesTable schedule filtering", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it("retains access to upcoming classes spread across multiple pages", async () => {
    mockedFetchAdminClasses.mockResolvedValue({
      data: [],
      meta: { totalPages: 1, total: 0 },
    });
    mockedFetchAdminClasses
      .mockResolvedValueOnce({
        data: [
          {
            id: "1",
            title: "Ongoing Class",
            instructor: "Teacher A",
            start_date: "2024-01-01",
            end_date: "2024-01-05",
            category: "Math",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Ongoing",
            price: 0,
          },
        ],
        meta: { totalPages: 2, total: 3 },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "1",
            title: "Ongoing Class",
            instructor: "Teacher A",
            start_date: "2024-01-01",
            end_date: "2024-01-05",
            category: "Math",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Ongoing",
            price: 0,
          },
        ],
        meta: { totalPages: 2, total: 3 },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "3",
            title: "Future Class",
            instructor: "Teacher C",
            start_date: "2025-01-01",
            end_date: "2025-01-02",
            category: "Science",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Upcoming",
            price: 0,
          },
        ],
        meta: { totalPages: 2, total: 3 },
      });

    render(<AdminClassesTable />);

    await screen.findByText("Ongoing Class");

    const [scheduleSelect] = screen.getAllByRole("combobox");
    fireEvent.change(scheduleSelect, { target: { value: "Upcoming" } });

    await waitFor(() => {
      expect(mockedFetchAdminClasses).toHaveBeenCalledTimes(3);
    });

    expect(
      mockedFetchAdminClasses.mock.calls.some(([params]) => params.page === 2)
    ).toBe(true);

    expect(await screen.findByText("Future Class")).toBeInTheDocument();
  });
});

describe("AdminClassesTable error handling", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it("shows a single toast and avoids duplicate retries when the fetch fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminClasses.mockRejectedValue(new Error("Network error"));

    render(<AdminClassesTable />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    expect(mockedFetchAdminClasses).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Failed to load classes");

    consoleSpy.mockRestore();
  });
});

describe("AdminClassesTable deletion navigation", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;
  const mockedDeleteAdminClass = deleteAdminClass;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    mockedDeleteAdminClass.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it("returns to a valid page and updates totals after deleting the last class on a page", async () => {
    const pageSize = 5;
    const createClass = (index) => ({
      id: `class-${index}`,
      title: `Class ${index}`,
      instructor: `Instructor ${index}`,
      start_date: `2024-0${index}-01`,
      end_date: `2024-0${index}-02`,
      category: "Category",
      publishStatus: "draft",
      approvalStatus: "Approved",
      scheduleStatus: "Upcoming",
      price: 0,
    });

    const firstPageData = Array.from({ length: pageSize }, (_, idx) =>
      createClass(idx + 1)
    );
    const lastPageItem = createClass(pageSize + 1);

    mockedFetchAdminClasses
      .mockResolvedValueOnce({
        data: firstPageData,
        meta: { totalPages: 2, total: pageSize + 1 },
      })
      .mockResolvedValueOnce({
        data: [lastPageItem],
        meta: { totalPages: 2, total: pageSize + 1 },
      })
      .mockResolvedValueOnce({
        data: firstPageData,
        meta: { totalPages: 1, total: pageSize },
      });

    mockedDeleteAdminClass.mockResolvedValue();

    render(<AdminClassesTable />);

    await screen.findByText("Class 1");

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    await screen.findByText(lastPageItem.title);

    fireEvent.click(screen.getByTitle("Delete Class"));

    const confirmButton = await screen.findByRole("button", {
      name: "Yes, Delete",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockedDeleteAdminClass).toHaveBeenCalledWith(lastPageItem.id);
    });

    await waitFor(() => {
      expect(mockedFetchAdminClasses).toHaveBeenCalledTimes(3);
    });

    expect(mockedFetchAdminClasses.mock.calls[2][0]).toMatchObject({ page: 1 });

    await screen.findByText("Class 1");
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(pageSize + 1);
    });
    expect(screen.queryByText(lastPageItem.title)).not.toBeInTheDocument();

    expect(toast.success).toHaveBeenCalledWith("Class deleted");
  });
});
