import React, { useEffect, useState } from "react";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

export default function AnalyticsCharts({
  t,
  locations,
  devices,
  registrationTrend,
  disableResizeObserver = false,
}) {
  const [chartsLib, setChartsLib] = useState(null);
  const [chartsLoadError, setChartsLoadError] = useState(false);
  const [resizeObserverSupported, setResizeObserverSupported] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (disableResizeObserver) {
      setChartsLib(null);
      setChartsLoadError(false);
      setResizeObserverSupported(false);
      return () => {
        isMounted = false;
      };
    }

    const ensureResizeObserver = async () => {
      if (typeof window === "undefined") {
        return false;
      }

      if (window.ResizeObserver) {
        return true;
      }

      try {
        const polyfillModule = await import("resize-observer-polyfill");
        if (!isMounted) {
          return false;
        }
        const ResizeObserverPolyfill = polyfillModule?.default ?? polyfillModule;
        if (ResizeObserverPolyfill && !window.ResizeObserver) {
          window.ResizeObserver = ResizeObserverPolyfill;
          return true;
        }
      } catch (error) {
        console.warn("Failed to load ResizeObserver polyfill", error);
      }

      return Boolean(window.ResizeObserver);
    };

    const loadCharts = async () => {
      const supported = await ensureResizeObserver();
      if (!isMounted) {
        return;
      }

      if (!supported) {
        setResizeObserverSupported(false);
        return;
      }

      try {
        const module = await import("recharts");
        if (!isMounted) {
          return;
        }
        setChartsLib(module);
        setChartsLoadError(false);
        setResizeObserverSupported(true);
      } catch (error) {
        console.error("Failed to load Recharts", error);
        if (!isMounted) {
          return;
        }
        setChartsLoadError(true);
        setChartsLib(null);
      }
    };

    loadCharts();

    return () => {
      isMounted = false;
    };
  }, [disableResizeObserver]);

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

  const renderFallbackMessage = () => {
    if (!resizeObserverSupported) {
      return t(
        "classAnalyticsPage.chartsUnavailableResizeObserver",
        "Charts are unavailable because ResizeObserver is not supported in this browser."
      );
    }

    if (chartsLoadError) {
      return t(
        "classAnalyticsPage.chartsFailedToLoad",
        "Charts failed to load. Please refresh to try again."
      );
    }

    return t("classAnalyticsPage.loadingCharts", "Loading charts…");
  };

  const shouldRenderCharts =
    resizeObserverSupported &&
    !chartsLoadError &&
    ResponsiveContainer &&
    PieChart &&
    Pie &&
    Cell &&
    Legend &&
    Tooltip &&
    BarChart &&
    Bar &&
    XAxis &&
    YAxis &&
    CartesianGrid;

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            🌍 {t("classAnalyticsPage.top_countries")}
          </h2>
          {shouldRenderCharts ? (
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
            <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {renderFallbackMessage()}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📱 {t("classAnalyticsPage.devices_used")}
          </h2>
          {shouldRenderCharts ? (
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
            <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {renderFallbackMessage()}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          📈 {t("classAnalyticsPage.registration_trend")}
        </h2>
        {shouldRenderCharts ? (
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
          <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {renderFallbackMessage()}
          </div>
        )}
      </div>
    </>
  );
}
