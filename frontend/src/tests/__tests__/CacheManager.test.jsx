import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CacheManager from "@/components/pwa/CacheManager";
import { clearCache as mockClearCache } from "../../services/admin/cacheService";
import { toast as mockToast } from "react-toastify";

jest.mock("../../services/admin/cacheService", () => ({
  clearCache: jest.fn(),
}));
jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const { toast } = require('react-toastify');

var toastMock;

jest.mock('react-toastify', () => {
  toastMock = { success: jest.fn(), error: jest.fn() };
  return { toast: toastMock };
});

const setupEnvironment = () => {
  Object.defineProperty(window, 'caches', {
    value: { delete: jest.fn().mockResolvedValue(true) },
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { ready: Promise.resolve({}), controller: {} },
    configurable: true,
  });
};

describe("CacheManager", () => {
  beforeEach(() => {
    setupEnvironment();
    mockClearCache.mockReset();
    Object.values(mockToast).forEach((fn) => fn.mockReset());
  });

  afterEach(() => {
    delete window.caches;
    delete window.navigator.serviceWorker;
  });

  it("shows message when cache cleared", async () => {
    mockClearCache.mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText("Clear Cache");
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText("cache_clear_success");
    expect(mockToast.success).toHaveBeenCalledWith("cache_clear_success");
  });

  it("shows forbidden message when clearing cache is not allowed", async () => {
    mockClearCache.mockRejectedValue({ response: { status: 403 } });
    render(<CacheManager />);
    const button = await screen.findByText("Clear Cache");
    fireEvent.click(button);
    await screen.findByText("cache_clear_forbidden");
    expect(mockToast.error).toHaveBeenCalledWith("cache_clear_forbidden");
  });

  it("shows error message when clearing cache fails", async () => {
    mockClearCache.mockRejectedValue(new Error("fail"));
    render(<CacheManager />);
    const button = await screen.findByText("Clear Cache");
    fireEvent.click(button);
    await screen.findByText("cache_clear_failed");
    expect(mockToast.error).toHaveBeenCalledWith("cache_clear_failed");
  });

  it("falls back to server cache clearing when Cache API is unavailable", async () => {
    delete window.caches;
    mockClearCache.mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText("Clear Cache");
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText("cache_api_unavailable");
    expect(mockToast.info).toHaveBeenCalledWith("cache_api_unavailable");
  });
});
