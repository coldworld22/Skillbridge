import { render, screen } from "@testing-library/react";
import CategoryPieChart from "@/components/admin/charts/CategoryPieChart";
import useLazyRecharts from "@/components/admin/charts/useLazyRecharts";

jest.mock("@/components/admin/charts/useLazyRecharts");

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

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

  it("renders a no-data message when there are no tutorials", () => {
    render(<CategoryPieChart data={[]} />);

    expect(
      screen.getByText("No tutorials by category available")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
  });
});
