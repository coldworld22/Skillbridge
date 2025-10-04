import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";
import { fetchAdminClasses } from "@/services/admin/classService";
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

describe("AdminClassesTable page size control", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    toast.error.mockClear();
  });

  it("fetches and renders every available class when 'All' is selected", async () => {
    const initialData = [
      {
        id: "1",
        title: "Algebra 101",
        instructor: "Teacher A",
        start_date: "2024-01-01",
        end_date: "2024-01-05",
        category: "Math",
        publishStatus: "draft",
        approvalStatus: "Approved",
        scheduleStatus: "Upcoming",
        price: 0,
      },
      {
        id: "2",
        title: "Geometry Basics",
        instructor: "Teacher B",
        start_date: "2024-02-01",
        end_date: "2024-02-05",
        category: "Math",
        publishStatus: "draft",
        approvalStatus: "Approved",
        scheduleStatus: "Upcoming",
        price: 0,
      },
    ];

    const fullData = [
      ...initialData,
      {
        id: "3",
        title: "Trigonometry Essentials",
        instructor: "Teacher C",
        start_date: "2024-03-01",
        end_date: "2024-03-05",
        category: "Math",
        publishStatus: "draft",
        approvalStatus: "Approved",
        scheduleStatus: "Upcoming",
        price: 0,
      },
    ];

    mockedFetchAdminClasses.mockResolvedValue({
      data: fullData,
      meta: { totalPages: 1, total: fullData.length },
    });
    mockedFetchAdminClasses
      .mockResolvedValueOnce({
        data: initialData,
        meta: { totalPages: 1, total: fullData.length },
      })
      .mockResolvedValueOnce({
        data: fullData,
        meta: { totalPages: 1, total: fullData.length },
      });

    render(<AdminClassesTable />);

    await screen.findByText("Algebra 101");

    const pageSizeSelect = screen.getByDisplayValue("5");
    fireEvent.change(pageSizeSelect, { target: { value: "all" } });

    await waitFor(() => {
      expect(mockedFetchAdminClasses).toHaveBeenCalledTimes(2);
    });

    const [, secondCallArgs] = mockedFetchAdminClasses.mock.calls;
    expect(secondCallArgs[0]).toMatchObject({ limit: fullData.length });

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(fullData.length + 1);
    });

    for (const cls of fullData) {
      expect(await screen.findByText(cls.title)).toBeInTheDocument();
    }
  });
});

describe("AdminClassesTable error handling", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    toast.error.mockClear();
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
