import React from "react";
import { render, screen } from "@testing-library/react";
import withAuthProtection from "@/hooks/withAuthProtection";

const mockReplace = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    asPath: "/dashboard",
    replace: mockReplace,
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

const mockAuthState = {
  user: null,
  accessToken: null,
  logout: jest.fn(),
  hasHydrated: false,
};

jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: (selector) => {
    if (typeof selector === "function") {
      return selector(mockAuthState);
    }
    return mockAuthState;
  },
}));

describe("withAuthProtection fallback UI", () => {
  const ProtectedMessage = () => <div data-testid="protected">Protected</div>;
  const ProtectedComponent = withAuthProtection(ProtectedMessage, {
    roles: ["admin"],
    permissions: ["manage_online_classes"],
  });

  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.accessToken = null;
    mockAuthState.logout = jest.fn();
    mockAuthState.hasHydrated = false;
    mockReplace.mockReset();
  });

  it("shows a session loading message while hydration is pending", () => {
    render(<ProtectedComponent />);
    expect(screen.getByTestId("auth-guard-message").textContent).toContain(
      "Loading your session"
    );
  });

  it("informs the user about the login redirect when no session is available", () => {
    mockAuthState.hasHydrated = true;

    render(<ProtectedComponent />);
    expect(screen.getByTestId("auth-guard-message").textContent).toContain(
      "Redirecting you to the login page"
    );
  });

  it("informs the user about the access denied redirect when permissions are missing", () => {
    mockAuthState.hasHydrated = true;
    mockAuthState.user = { id: "1", permissions: [], roles: ["admin"] };

    render(<ProtectedComponent />);
    expect(screen.getByTestId("auth-guard-message").textContent).toContain(
      "Redirecting you to the access denied page"
    );
  });

  it("renders the protected component once the session is ready and authorized", () => {
    mockAuthState.hasHydrated = true;
    mockAuthState.user = {
      id: "admin-1",
      permissions: ["manage_online_classes"],
      roles: ["admin"],
    };

    render(<ProtectedComponent />);
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });
});
