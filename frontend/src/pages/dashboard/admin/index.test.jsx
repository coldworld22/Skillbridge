import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/hooks/withAdminGuard", () => ({
  __esModule: true,
  default: (component) => component,
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

const welcomeBannerMock = jest.fn();
jest.mock("@/components/admin/WelcomeBanner", () => ({
  __esModule: true,
  default: (props) => {
    welcomeBannerMock(props);
    return <div data-testid="welcome-banner">{props.name}</div>;
  },
}));

jest.mock("@/components/admin/StatsGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="stats-grid" />,
}));

jest.mock("@/components/admin/charts/RevenueChart", () => ({
  __esModule: true,
  default: () => <div data-testid="revenue-chart" />,
}));

jest.mock("@/components/admin/charts/SignupsChart", () => ({
  __esModule: true,
  default: () => <div data-testid="signups-chart" />,
}));

jest.mock("@/components/admin/charts/CategoryPieChart", () => ({
  __esModule: true,
  default: () => <div data-testid="category-pie-chart" />,
}));

jest.mock("@/components/admin/charts/InstructorActivityChart", () => ({
  __esModule: true,
  default: () => <div data-testid="instructor-activity-chart" />,
}));

jest.mock("@/services/admin/adminService", () => ({
  fetchAdminDashboardStats: jest.fn().mockResolvedValue({
    totalUsers: 10,
    instructors: 5,
    students: 5,
    tutorials: 3,
    classes: 2,
    monthlyRevenue: [],
    monthlySignups: [],
    tutorialsByCategory: [],
    instructorTutorialCount: [],
  }),
}));

jest.mock("@/services/admin/alertService", () => ({
  fetchRecentAlerts: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/services/admin/moderationService", () => ({
  fetchFlaggedMessages: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/services/admin/licenseService", () => ({
  fetchLicenseStatus: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useAuthStore from "@/store/auth/authStore";

const mockUseAuthStore = useAuthStore;

import AdminDashboardHome from "./index";

describe("AdminDashboardHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { full_name: "Default" } });
  });

  it("renders welcome banner with the user's full name when available", async () => {
    mockUseAuthStore.mockReturnValue({ user: { full_name: "Jane Doe" } });

    render(<AdminDashboardHome />);

    await waitFor(() => {
      expect(screen.getByTestId("welcome-banner")).toHaveTextContent("Jane Doe");
    });

    expect(welcomeBannerMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jane Doe" })
    );
  });

  it("falls back to 'Admin' when the user is null", async () => {
    mockUseAuthStore.mockReturnValue({ user: null });

    render(<AdminDashboardHome />);

    await waitFor(() => {
      expect(screen.getByTestId("welcome-banner")).toHaveTextContent("Admin");
    });

    expect(welcomeBannerMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Admin" })
    );
  });
});
