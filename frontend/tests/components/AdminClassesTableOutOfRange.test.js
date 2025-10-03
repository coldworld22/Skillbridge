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

describe("AdminClassesTable out-of-range handling", () => {
  const mockedFetchAdminClasses = fetchAdminClasses;

  beforeEach(() => {
    mockedFetchAdminClasses.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it("avoids repeated fetches when the resolved total pages drop below the current page", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const responses = [
      {
        data: [
          {
            id: "p1",
            title: "Class Page 1",
            instructor: "Instructor 1",
            start_date: "2024-01-01",
            end_date: "2024-01-05",
            category: "Category",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Upcoming",
            price: 0,
          },
        ],
        meta: { totalPages: 3, total: 3 },
      },
      {
        data: [
          {
            id: "p2",
            title: "Class Page 2",
            instructor: "Instructor 2",
            start_date: "2024-02-01",
            end_date: "2024-02-05",
            category: "Category",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Upcoming",
            price: 0,
          },
        ],
        meta: { totalPages: 3, total: 3 },
      },
      {
        data: [],
        meta: { totalPages: 1, total: 1 },
      },
      {
        data: [
          {
            id: "s1",
            title: "Shrunk Class",
            instructor: "Instructor 3",
            start_date: "2024-03-01",
            end_date: "2024-03-05",
            category: "Category",
            publishStatus: "draft",
            approvalStatus: "Approved",
            scheduleStatus: "Upcoming",
            price: 0,
          },
        ],
        meta: { totalPages: 1, total: 1 },
      },
    ];

    const signatures = [];

    mockedFetchAdminClasses.mockImplementation(async (params) => {
      signatures.push(JSON.stringify(params));
      const response = responses[signatures.length - 1];
      if (!response) {
        throw new Error(`Unexpected fetch call ${signatures.length}`);
      }
      return response;
    });

    render(<AdminClassesTable />);

    await screen.findByText("Class Page 1");

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    await screen.findByText("Class Page 2");

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    await waitFor(() => {
      expect(mockedFetchAdminClasses).toHaveBeenCalledTimes(4);
    });

    await screen.findByText("Shrunk Class");

    signatures.forEach((signature, index) => {
      if (index === 0) return;
      expect(signature).not.toBe(signatures[index - 1]);
    });

    const error185 = consoleErrorSpy.mock.calls.some((call) =>
      call.some(
        (arg) =>
          typeof arg === "string" &&
          arg.includes("Too many re-renders")
      )
    );

    expect(error185).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
