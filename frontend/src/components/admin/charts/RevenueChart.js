// components/admin/charts/RevenueChart.js
import { useTranslation } from "next-i18next";
import useLazyRecharts from "./useLazyRecharts";

export default function RevenueChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.monthlyRevenue");
  const { chartsLib, chartsLoadError, resizeObserverSupported, loading } =
    useLazyRecharts();

  const LineChart = chartsLib?.LineChart;
  const Line = chartsLib?.Line;
  const XAxis = chartsLib?.XAxis;
  const YAxis = chartsLib?.YAxis;
  const Tooltip = chartsLib?.Tooltip;
  const ResponsiveContainer = chartsLib?.ResponsiveContainer;
  const CartesianGrid = chartsLib?.CartesianGrid;

  const renderFallbackMessage = () => {
    if (!resizeObserverSupported) {
      return t(
        "adminDashboardHome.chartsUnavailableResizeObserver",
        "Charts are unavailable because ResizeObserver is not supported in this browser."
      );
    }

    if (chartsLoadError) {
      return t(
        "adminDashboardHome.chartsFailedToLoad",
        "Charts failed to load. Please refresh to try again."
      );
    }

    return t("adminDashboardHome.loadingCharts", "Loading charts…");
  };

  const shouldRenderChart =
    !loading &&
    resizeObserverSupported &&
    !chartsLoadError &&
    LineChart &&
    Line &&
    XAxis &&
    YAxis &&
    Tooltip &&
    ResponsiveContainer &&
    CartesianGrid;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📈 {heading}</h2>
      {shouldRenderChart ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value) => `$${value}`} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#facc15"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {renderFallbackMessage()}
        </div>
      )}
    </div>
  );
}
