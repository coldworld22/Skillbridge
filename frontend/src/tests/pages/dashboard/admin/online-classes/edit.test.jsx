import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { EditClassPage } from "@/pages/dashboard/admin/online-classes/edit/[id]";

const pushMock = jest.fn();
const backMock = jest.fn();
const fetchNotificationsMock = jest.fn();
const fetchMessagesMock = jest.fn();
const fetchAdminClassByIdMock = jest.fn();
const updateAdminClassMock = jest.fn();
const fetchPlanIdentifiersMock = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { id: "class-123" },
    push: pushMock,
    back: backMock,
  }),
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key,
    i18n: { dir: () => "ltr" },
  }),
}));

jest.mock("@/hooks/withAuthProtection", () => ({
  __esModule: true,
  default: (component) => component,
}));

jest.mock("@/components/layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: (selector) => (selector ? selector({ fetch: fetchNotificationsMock }) : { fetch: fetchNotificationsMock }),
}));

jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: (selector) => (selector ? selector({ fetch: fetchMessagesMock }) : { fetch: fetchMessagesMock }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/services/admin/classService", () => ({
  fetchAdminClassById: (...args) => fetchAdminClassByIdMock(...args),
  updateAdminClass: (...args) => updateAdminClassMock(...args),
}));

jest.mock("@/services/admin/planService", () => ({
  fetchPlanIdentifiers: (...args) => fetchPlanIdentifiersMock(...args),
}));

describe("EditClassPage included plans", () => {
  const originalFormData = global.FormData;

  beforeEach(() => {
    jest.clearAllMocks();

    fetchPlanIdentifiersMock.mockResolvedValue([
      { id: 1, slug: "basic" },
      { id: 2, slug: "premium" },
    ]);

    fetchAdminClassByIdMock.mockResolvedValue({
      title: "Sample Class",
      access_type: "free",
      included_plans: [1],
    });

    updateAdminClassMock.mockResolvedValue({ success: true });

    global.FormData = class {
      constructor() {
        this.store = new Map();
      }
      append(key, value) {
        this.store.set(key, value);
      }
      get(key) {
        return this.store.get(key);
      }
    };
  });

  afterEach(() => {
    global.FormData = originalFormData;
  });

  it("normalizes stored plan identifiers and submits an empty array when the last plan is removed", async () => {
    render(<EditClassPage />);

    const planCheckbox = await screen.findByLabelText("basic");
    expect(planCheckbox).toBeChecked();

    fireEvent.click(planCheckbox);
    expect(planCheckbox).not.toBeChecked();

    const form = planCheckbox.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form);

    await waitFor(() => {
      expect(updateAdminClassMock).toHaveBeenCalledTimes(1);
    });

    const [, payload] = updateAdminClassMock.mock.calls[0];
    expect(payload.get("included_plans")).toBe(JSON.stringify([]));
  });
});
