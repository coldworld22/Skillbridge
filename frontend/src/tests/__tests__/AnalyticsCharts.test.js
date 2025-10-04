import React from "react";
import { render, screen } from "@testing-library/react";
import AnalyticsCharts from "../../pages/dashboard/admin/online-classes/[id]/AnalyticsCharts";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: ({ fill }) => <div data-testid="cell" data-fill={fill} />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const defaultProps = {
  t: (_key, fallback) => fallback ?? _key,
  locations: [{ name: "USA", value: 10 }],
  devices: [{ name: "Desktop", value: 5 }],
  registrationTrend: [{ date: "2024-01-01", students: 3 }],
};

describe("AnalyticsCharts", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete global.ResizeObserver;
    if (typeof window !== "undefined") {
      delete window.ResizeObserver;
    }
  });

  it("renders charts when ResizeObserver is available", async () => {
    const ResizeObserverMock = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    global.ResizeObserver = ResizeObserverMock;
    if (typeof window !== "undefined") {
      window.ResizeObserver = ResizeObserverMock;
    }

    render(<AnalyticsCharts {...defaultProps} />);

    const pieCharts = await screen.findAllByTestId("pie-chart");
    expect(pieCharts).toHaveLength(2);
    expect(await screen.findByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders fallback messaging when ResizeObserver is unsupported", async () => {
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "ResizeObserver", {
        configurable: true,
        get: () => undefined,
        set: () => {},
      });
    }
    delete global.ResizeObserver;

    render(<AnalyticsCharts {...defaultProps} />);

    const fallbacks = await screen.findAllByText(
      "Charts are unavailable because ResizeObserver is not supported in this browser."
    );
    expect(fallbacks).toHaveLength(3);
  });
});
