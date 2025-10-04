// components/admin/charts/CategoryPieChart.js
import { useTranslation } from "next-i18next";
import useLazyRecharts from "./useLazyRecharts";

const COLORS = ['#facc15', '#60a5fa', '#f87171', '#34d399'];

export default function CategoryPieChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.tutorialsByCategory");
  const { chartsLib, chartsLoadError, resizeObserverSupported, loading } =
    useLazyRecharts();

  const hasData = Array.isArray(data) && data.length > 0;
  const PieChart = chartsLib?.PieChart;
  const Pie = chartsLib?.Pie;
  const Cell = chartsLib?.Cell;
  const Tooltip = chartsLib?.Tooltip;
  const ResponsiveContainer = chartsLib?.ResponsiveContainer;

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

    if (loading) {
      return t("adminDashboardHome.loadingCharts", "Loading charts…");
    }

    if (!hasData) {
      return t(
        "adminDashboardHome.noCategoryData",
        "No category data available."
      );
    }

    return t("adminDashboardHome.loadingCharts", "Loading charts…");
  };

  const shouldRenderChart =
    !loading &&
    resizeObserverSupported &&
    !chartsLoadError &&
    hasData &&
    PieChart &&
    Pie &&
    Cell &&
    Tooltip &&
    ResponsiveContainer;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📚 {heading}</h2>
      {shouldRenderChart ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {renderFallbackMessage()}
        </div>
      )}
    </div>
  );
}
