import React, { useEffect, useMemo, useState } from "react";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

const defaultMessages = {
  loading: "Loading charts…",
  failed: "Charts failed to load. Please refresh to try again.",
  unsupported: "Charts are unavailable because ResizeObserver is not supported in this browser.",
};

export default function AnalyticsCharts({
  t,
  locations = [],
  devices = [],
  registrationTrend = [],
}) {
  const [chartsLib, setChartsLib] = useState(null);
  const [resizeObserverSupported, setResizeObserverSupported] = useState(true);
  const [chartsLoadError, setChartsLoadError] = useState(false);

  const getMessage = useMemo(() => {
    const translate = typeof t === "function" ? t : null;
    return {
      loading: translate
        ? translate("classAnalyticsPage.loadingCharts", defaultMessages.loading)
        : defaultMessages.loading,
      failed: translate
        ? translate(
            "classAnalyticsPage.chartsFailedToLoad",
            defaultMessages.failed
          )
        : defaultMessages.failed,
      unsupported: translate
        ? translate(
            "classAnalyticsPage.chartsUnavailableResizeObserver",
            defaultMessages.unsupported
          )
        : defaultMessages.unsupported,
    };
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.ResizeObserver) {
      setResizeObserverSupported(false);
      return;
    }

    let isMounted = true;

    import("recharts")
      .then((module) => {
        if (!isMounted) return;
        setChartsLib(module);
      })
      .catch((error) => {
        console.error("Failed to load Recharts", error);
        if (!isMounted) return;
        setChartsLoadError(true);
        setChartsLib(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const ResponsiveContainer = chartsLib?.ResponsiveContainer;
  const PieChart = chartsLib?.PieChart;
  const Pie = chartsLib?.Pie;
  const Cell = chartsLib?.Cell;
  const Legend = chartsLib?.Legend;
  const Tooltip = chartsLib?.Tooltip;
  const BarChart = chartsLib?.BarChart;
  const Bar = chartsLib?.Bar;
  const XAxis = chartsLib?.XAxis;
  const YAxis = chartsLib?.YAxis;
  const CartesianGrid = chartsLib?.CartesianGrid;

  const renderFallback = () => (
    <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {resizeObserverSupported ? (chartsLoadError ? getMessage.failed : getMessage.loading) : getMessage.unsupported}
    </div>
  );

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            🌍 {t ? t("classAnalyticsPage.top_countries") : "Top Countries"}
          </h2>
          {resizeObserverSupported && ResponsiveContainer && PieChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={locations} dataKey="value" nameKey="name" outerRadius={100}>
                  {(locations ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            renderFallback()
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📱 {t ? t("classAnalyticsPage.devices_used") : "Devices Used"}
          </h2>
          {resizeObserverSupported && ResponsiveContainer && PieChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" outerRadius={100}>
                  {(devices ?? []).map((entry, index) => (
                    <Cell key={`cell-dev-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            renderFallback()
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          📈 {t ? t("classAnalyticsPage.registration_trend") : "Registration Trend"}
        </h2>
        {resizeObserverSupported && ResponsiveContainer && BarChart ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          renderFallback()
        )}
      </div>
    </>
  );
}
