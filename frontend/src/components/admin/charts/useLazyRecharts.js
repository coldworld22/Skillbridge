import { useEffect, useState } from "react";

export function useLazyRecharts({ disableResizeObserver = false } = {}) {
  const [chartsLib, setChartsLib] = useState(null);
  const [chartsLoadError, setChartsLoadError] = useState(false);
  const [resizeObserverSupported, setResizeObserverSupported] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

    const loadChartsLibrary = async () => {
      if (disableResizeObserver) {
        if (!isMounted) {
          return;
        }
        setChartsLib(null);
        setChartsLoadError(false);
        setResizeObserverSupported(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setChartsLoadError(false);

      const supported = await ensureResizeObserver();
      if (!isMounted) {
        return;
      }

      if (!supported) {
        setResizeObserverSupported(false);
        setChartsLib(null);
        setLoading(false);
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
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChartsLibrary();

    return () => {
      isMounted = false;
    };
  }, [disableResizeObserver]);

  return { chartsLib, chartsLoadError, resizeObserverSupported, loading };
}

export default useLazyRecharts;
