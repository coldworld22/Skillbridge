const createInterceptorStore = () => {
  const handlers = [];
  const use = jest.fn((fulfilled, rejected) => {
    const handler = { fulfilled, rejected };
    handlers.push(handler);
    return handlers.length - 1;
  });
  const eject = jest.fn((id) => {
    if (typeof id === "number" && id >= 0 && id < handlers.length) {
      handlers[id] = null;
    }
  });

  return { handlers, use, eject };
};

const requestInterceptors = createInterceptorStore();
const responseInterceptors = createInterceptorStore();
const apiPostMock = jest.fn();
const apiRequestMock = jest.fn();
const apiMockInstance = jest.fn((config) => apiRequestMock(config));

apiMockInstance.post = apiPostMock;
apiMockInstance.request = apiRequestMock;
apiMockInstance.interceptors = {
  request: requestInterceptors,
  response: responseInterceptors,
};

jest.mock("@/services/api/api", () => ({
  __esModule: true,
  default: apiMockInstance,
  __mock: {
    requestInterceptors,
    responseInterceptors,
    postMock: apiPostMock,
    requestMock: apiRequestMock,
  },
}));

const toastInfoMock = jest.fn();
const toastErrorMock = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    info: toastInfoMock,
    error: toastErrorMock,
  },
}));

const pushMock = jest.fn();
jest.mock("next/router", () => ({
  __esModule: true,
  default: { push: pushMock },
}));

const loggerLogMock = jest.fn();
const loggerWarnMock = jest.fn();
const loggerErrorMock = jest.fn();
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    log: loggerLogMock,
    warn: loggerWarnMock,
    error: loggerErrorMock,
  },
}));

const mockGetState = jest.fn();
jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: {
    getState: mockGetState,
  },
}));

const ensureCsrfTokenMock = jest.fn();
const clearCachedCsrfTokenMock = jest.fn();
jest.mock("@/services/api/csrf", () => ({
  __esModule: true,
  ensureCsrfToken: ensureCsrfTokenMock,
  clearCachedCsrfToken: clearCachedCsrfTokenMock,
}));

describe("tokenInterceptor refresh logic", () => {
  let responseInterceptor;
  let authState;

  beforeEach(() => {
    toastInfoMock.mockReset();
    toastErrorMock.mockReset();
    pushMock.mockReset();
    loggerLogMock.mockReset();
    loggerWarnMock.mockReset();
    loggerErrorMock.mockReset();
    ensureCsrfTokenMock.mockReset();
    clearCachedCsrfTokenMock.mockReset();
    mockGetState.mockReset();

    apiMockInstance.mockClear();
    apiPostMock.mockReset();
    apiRequestMock.mockReset();
    requestInterceptors.use.mockClear();
    requestInterceptors.eject.mockClear();
    responseInterceptors.use.mockClear();
    responseInterceptors.eject.mockClear();
    requestInterceptors.handlers.length = 0;
    responseInterceptors.handlers.length = 0;

    authState = {
      accessToken: "old-access",
      user: { id: 1 },
      setToken: jest.fn(),
      setUser: jest.fn(),
      logout: jest.fn(),
    };

    mockGetState.mockReturnValue(authState);

    jest.isolateModules(() => {
      require("@/services/api/tokenInterceptor");
    });

    const handlers = responseInterceptors.handlers;
    responseInterceptor = handlers[handlers.length - 1].rejected;
  });

  it("retries refresh after a 403 by forcing a new CSRF token", async () => {
    ensureCsrfTokenMock
      .mockResolvedValueOnce("csrf-one")
      .mockResolvedValueOnce("csrf-two");

    apiPostMock
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockResolvedValueOnce({ data: { accessToken: "fresh-access" } });

    apiRequestMock.mockResolvedValue({ data: "ok" });

    const error = {
      config: {
        url: "/secure/resource",
        method: "get",
        headers: {},
      },
      response: { status: 401 },
    };

    const result = await responseInterceptor(error);

    expect(result).toEqual({ data: "ok" });

    expect(ensureCsrfTokenMock).toHaveBeenCalledTimes(2);
    expect(ensureCsrfTokenMock).toHaveBeenNthCalledWith(1, undefined);
    expect(ensureCsrfTokenMock).toHaveBeenNthCalledWith(2, { forceRefresh: true });

    expect(clearCachedCsrfTokenMock).toHaveBeenCalledTimes(1);
    expect(clearCachedCsrfTokenMock.mock.invocationCallOrder[0]).toBeLessThan(
      ensureCsrfTokenMock.mock.invocationCallOrder[1]
    );

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(
      1,
      "/auth/refresh",
      null,
      expect.objectContaining({
        headers: { "x-csrf-token": "csrf-one" },
        withCredentials: true,
      })
    );
    expect(apiPostMock).toHaveBeenNthCalledWith(
      2,
      "/auth/refresh",
      null,
      expect.objectContaining({
        headers: { "x-csrf-token": "csrf-two" },
        withCredentials: true,
      })
    );

    expect(apiRequestMock).toHaveBeenCalledWith(error.config);
    expect(authState.setToken).toHaveBeenCalledWith("fresh-access");
    expect(authState.logout).not.toHaveBeenCalled();
    expect(toastInfoMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(error.config.headers.Authorization).toBe("Bearer fresh-access");
  });
});
