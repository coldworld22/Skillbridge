// components/admin/charts/CategoryPieChart.js
import { useTranslation } from "next-i18next";
import useLazyRecharts from "./useLazyRecharts";

const COLORS = ['#facc15', '#60a5fa', '#f87171', '#34d399'];

export default function CategoryPieChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.tutorialsByCategory");
  const { chartsLib, chartsLoadError, resizeObserverSupported, loading } =
    useLazyRecharts();

  const PieChart = chartsLib?.PieChart;
  const Pie = chartsLib?.Pie;
  const Cell = chartsLib?.Cell;
  const Tooltip = chartsLib?.Tooltip;
  const ResponsiveContainer = chartsLib?.ResponsiveContainer;

  const hasData = Array.isArray(data) && data.some(({ value }) => value > 0);

  const renderFallbackMessage = () => {
    if (loading) {
      return t("adminDashboardHome.loadingCharts", "Loading charts…");
    }

    if (!resizeObserverSupported) {
      return t("adminDashboardHome.chartsUnavailableResizeObserver", {
        defaultValue:
          "Charts are unavailable because ResizeObserver is not supported in this browser.",
      });
    }

    if (chartsLoadError) {
      return t("adminDashboardHome.chartsFailedToLoad", {
        defaultValue: "Charts failed to load. Please refresh to try again.",
      });
    }

    return t("adminDashboardHome.loadingCharts", {
      defaultValue: "Loading charts…",
    });
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
        hasData ? (
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
            {t(
              "adminDashboardHome.noTutorialsByCategoryData",
              "No tutorials by category available"
            )}
          </div>
        )
      ) : (
        <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {renderFallbackMessage()}
        </div>
      )}
    </div>
  );
}
