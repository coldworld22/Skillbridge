import { render, screen } from "@testing-library/react";
import CategoryPieChart from "@/components/admin/charts/CategoryPieChart";
import useLazyRecharts from "@/components/admin/charts/useLazyRecharts";

jest.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (_key, fallback) => fallback ?? _key }),
}));

jest.mock("@/components/admin/charts/useLazyRecharts");

const chartsLibMock = {
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: ({ fill }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
};

describe("CategoryPieChart", () => {
  beforeEach(() => {
    useLazyRecharts.mockReturnValue({
      chartsLib: chartsLibMock,
      chartsLoadError: false,
      resizeObserverSupported: true,
      loading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the pie chart when data is provided", () => {
    const sampleData = [
      { name: "Category A", value: 10 },
      { name: "Category B", value: 5 },
    ];

    render(<CategoryPieChart data={sampleData} title="Test Chart" />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("cell")).toHaveLength(sampleData.length);
    expect(screen.queryByText("No category data available.")).not.toBeInTheDocument();
  });

  it("shows an empty state message when there is no data", () => {
    render(<CategoryPieChart data={[]} title="Empty Chart" />);

    expect(
      screen.getByText("No category data available.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
  });
});
