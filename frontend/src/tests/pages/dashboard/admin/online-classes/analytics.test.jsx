import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";

const mockRouter = {
  query: { id: "123" },
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => "ltr" },
  }),
}));

jest.mock("@/hooks/withAuthProtection", () => ({
  __esModule: true,
  default: (Component) => Component,
}));

jest.mock("@/utils/currency", () => ({
  formatCurrency: (value) => `$${Number(value ?? 0).toFixed(2)}`,
}));

jest.mock("@/components/layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

jest.mock("resize-observer-polyfill", () => ({
  __esModule: true,
  default: class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Bar: () => <div data-testid="bar" />,
}));

const mockFetchAdminClassAnalytics = jest.fn();
jest.mock("@/services/admin/classService", () => ({
  fetchAdminClassAnalytics: (...args) => mockFetchAdminClassAnalytics(...args),
}));

import AnalyticsPage from "@/pages/dashboard/admin/online-classes/[id]/analytics";

describe("Admin class analytics page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAdminClassAnalytics.mockResolvedValue({ totalStudents: 3 });
  });

  it("renders with minimal analytics payload", async () => {
    render(<AnalyticsPage />);

    await waitFor(() => expect(mockFetchAdminClassAnalytics).toHaveBeenCalledWith("123"));

    await waitFor(() => {
      const totalRevenueCard = screen
        .getByText((content) => content.includes("classAnalyticsPage.total_revenue"))
        .closest("div");
      expect(totalRevenueCard).not.toBeNull();
      expect(within(totalRevenueCard).getByText("$0.00")).toBeInTheDocument();
    });

    const totalStudentsValue = screen.getByText(
      (content, element) => element?.textContent === "3"
    );
    expect(totalStudentsValue).toBeInTheDocument();

    const fullPaymentsRow = screen
      .getByText((content) => content.includes("classAnalyticsPage.full_payments"))
      .closest("li");
    expect(fullPaymentsRow).not.toBeNull();
    expect(fullPaymentsRow.textContent).toContain("$0.00");
    expect(fullPaymentsRow.textContent).toContain("classAnalyticsPage.students_label");

    const subscriptionRow = screen
      .getByText((content) => content.includes("classAnalyticsPage.subscription_seats"))
      .closest("li");
    expect(subscriptionRow).not.toBeNull();
    expect(subscriptionRow.textContent).toContain("$0.00");

    const freeRow = screen
      .getByText((content) => content.includes("classAnalyticsPage.free_seats"))
      .closest("li");
    expect(freeRow).not.toBeNull();
    expect(freeRow.textContent).toContain("classAnalyticsPage.students_label");
  });

  it("loads charts using the ResizeObserver polyfill when not supported natively", async () => {
    const originalResizeObserver = global.ResizeObserver;
    // Simulate browsers without native ResizeObserver support.
    delete global.ResizeObserver;

    render(<AnalyticsPage />);

    await waitFor(() => expect(mockFetchAdminClassAnalytics).toHaveBeenCalledWith("123"));

    await waitFor(() => {
      expect(screen.getAllByTestId("responsive").length).toBeGreaterThan(0);
      expect(global.ResizeObserver).toBeTruthy();
    });

    global.ResizeObserver = originalResizeObserver;
  });
});
