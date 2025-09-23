import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key,
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("lucide-react", () => {
  const React = require("react");
  const createIcon = (name) =>
    React.forwardRef(({ children, ...props }, ref) => (
      <svg ref={ref} data-icon={name} {...props}>
        {children}
      </svg>
    ));

  return {
    Bell: createIcon("Bell"),
    ChevronDown: createIcon("ChevronDown"),
    Mail: createIcon("Mail"),
    Moon: createIcon("Moon"),
    Sun: createIcon("Sun"),
    Search: createIcon("Search"),
    Home: createIcon("Home"),
    LogOut: createIcon("LogOut"),
  };
});

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/services/instructor/instructorService", () => ({
  toggleInstructorStatus: jest.fn(),
}));

jest.mock("@/utils/url", () => ({
  buildUrl: jest.fn((url) => url),
}));

const mockAuthState = {
  user: { role: "student", is_online: false },
  hasHydrated: true,
  logout: jest.fn(),
  setUser: jest.fn(),
};

jest.mock("@/store/auth/authStore", () => {
  return {
    __esModule: true,
    default: jest.fn((selector) => selector(mockAuthState)),
  };
});

const mockNotificationState = {
  items: [
    { id: "1", message: undefined, read: false },
  ],
  fetch: jest.fn().mockResolvedValue(undefined),
  startPolling: jest.fn(),
  stopPolling: jest.fn(),
  markRead: jest.fn(),
};

jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: jest.fn((selector) => selector(mockNotificationState)),
}));

const mockMessageState = {
  items: [],
  fetch: jest.fn(),
  startPolling: jest.fn(),
  stopPolling: jest.fn(),
  markRead: jest.fn(),
};

jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: jest.fn((selector) => selector(mockMessageState)),
}));

const mockAppConfigState = {
  settings: {},
  fetch: jest.fn(),
};

jest.mock("@/store/appConfigStore", () => ({
  __esModule: true,
  default: jest.fn((selector) => selector(mockAppConfigState)),
}));

import { useRouter } from "next/router";
import Header from "../Header";

describe("Header notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      pathname: "/dashboard/student",
      query: {},
      push: jest.fn(),
    });
  });

  it("renders notifications that are missing a message without throwing", async () => {
    const { container } = render(<Header />);

    expect(() => {
      const toggle = container.querySelector('[aria-label="Toggle notifications"]');
      if (toggle) {
        fireEvent.click(toggle);
      }
    }).not.toThrow();

    await waitFor(() => {
      expect(
        screen.getByText("Notification message unavailable")
      ).toBeInTheDocument();
    });
  });
});
