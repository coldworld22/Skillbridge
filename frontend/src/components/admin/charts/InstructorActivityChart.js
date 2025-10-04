// components/admin/charts/InstructorActivityChart.js
import { useTranslation } from "next-i18next";
import useLazyRecharts from "./useLazyRecharts";

export default function InstructorActivityChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.instructorTutorialCount");
  const { chartsLib, chartsLoadError, resizeObserverSupported, loading } =
    useLazyRecharts();

  const BarChart = chartsLib?.BarChart;
  const Bar = chartsLib?.Bar;
  const XAxis = chartsLib?.XAxis;
  const YAxis = chartsLib?.YAxis;
  const Tooltip = chartsLib?.Tooltip;
  const ResponsiveContainer = chartsLib?.ResponsiveContainer;
  const CartesianGrid = chartsLib?.CartesianGrid;

  const renderFallbackMessage = () => {
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
    BarChart &&
    Bar &&
    XAxis &&
    YAxis &&
    Tooltip &&
    ResponsiveContainer &&
    CartesianGrid;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">👨‍🏫 {heading}</h2>
      {shouldRenderChart ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="instructor" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tutorials" fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {renderFallbackMessage()}
        </div>
      )}
    </div>
  );
}
