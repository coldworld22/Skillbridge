import React from "react";
import { render, waitFor } from "@testing-library/react";
import withAuthProtection from "@/hooks/withAuthProtection";
import useAuthStore from "@/store/auth/authStore";
import { useRouter } from "next/router";

jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/router", () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

describe("withAuthProtection permission handling", () => {
  const mockLogout = jest.fn();
  let replaceMock;
  let mockEvents;
  const buildValidToken = () => {
    const future = Math.floor(Date.now() / 1000) + 60;
    const payload = Buffer.from(JSON.stringify({ exp: future })).toString("base64");
    return `header.${payload}.signature`;
  };

  beforeEach(() => {
    replaceMock = jest.fn();
    mockEvents = {
      on: jest.fn(),
      off: jest.fn(),
    };
    jest.clearAllMocks();
    mockLogout.mockReset();
    useRouter.mockReturnValue({
      replace: replaceMock,
      asPath: "/dashboard/admin/online-classes",
      events: mockEvents,
    });
  });

  it("allows access when the user has the required permission regardless of casing", async () => {
    useAuthStore.mockReturnValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        permissions: ["MANAGE_ONLINE_CLASSES"],
      },
      accessToken: buildValidToken(),
      logout: mockLogout,
      hasHydrated: true,
    });

    const Dummy = () => <div data-testid="protected">Protected</div>;
    const ProtectedDummy = withAuthProtection(Dummy, {
      roles: ["admin"],
      permissions: ["manage_online_classes"],
    });

    const { findByTestId } = render(<ProtectedDummy />);

    expect(await findByTestId("protected")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalledWith("/error/403");
  });

  it("redirects to 403 when the user lacks the normalized permission", async () => {
    useAuthStore.mockReturnValue({
      user: {
        id: "admin-2",
        role: "admin",
        permissions: ["VIEW_DASHBOARD"],
      },
      accessToken: buildValidToken(),
      logout: mockLogout,
      hasHydrated: true,
    });

    const Dummy = () => <div data-testid="protected">Protected</div>;
    const ProtectedDummy = withAuthProtection(Dummy, {
      roles: ["admin"],
      permissions: ["manage_online_classes"],
    });

    render(<ProtectedDummy />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/error/403");
    });
  });
});
