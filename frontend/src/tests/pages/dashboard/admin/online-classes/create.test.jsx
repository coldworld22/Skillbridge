import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { toast } from "react-toastify";

import { CreateOnlineClass } from "@/pages/dashboard/admin/online-classes/create";

const pushMock = jest.fn();
const addEventsMock = jest.fn();
const fetchNotificationsMock = jest.fn();
const fetchMessagesMock = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

typeof window !== "undefined" && (window.HTMLElement.prototype.scrollIntoView = jest.fn());

jest.mock("next/dynamic", () => () => (props) => <div data-testid="dynamic" {...props} />);

jest.mock("react-quill", () => ({
  __esModule: true,
  default: () => <div data-testid="react-quill" />,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
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

jest.mock("@/components/shared/FloatingInput", () => ({
  __esModule: true,
  default: ({ label, name, value = "", onChange, type = "text" }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
      />
    </label>
  ),
}));

jest.mock("@/hooks/useMediaUploader", () => ({
  __esModule: true,
  default: () => ({
    uploadProgress: 0,
    imageUploading: false,
    videoUploading: false,
    handleImageUpload: jest.fn(),
    handleVideoUpload: jest.fn(),
    setUploadProgress: jest.fn(),
  }),
}));

const useAuthStoreMock = jest.fn(() => ({ user: { id: "admin-1" } }));
jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: (...args) => useAuthStoreMock(...args),
}));

jest.mock("@/store/schedule/scheduleStore", () => ({
  __esModule: true,
  default: (selector) => (selector ? selector({ addEvents: addEventsMock }) : { addEvents: addEventsMock }),
}));

jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: (selector) => (selector ? selector({ fetch: fetchNotificationsMock }) : { fetch: fetchNotificationsMock }),
}));

jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: (selector) => (selector ? selector({ fetch: fetchMessagesMock }) : { fetch: fetchMessagesMock }),
}));

jest.mock("@/services/admin/categoryService", () => ({
  fetchAllCategories: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock("@/services/admin/classService", () => ({
  createAdminClass: jest.fn().mockResolvedValue({ id: "class-1", title: "Test" }),
}));

jest.mock("@/services/admin/classTagService", () => ({
  fetchClassTags: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock("@/services/instructor/classService", () => ({
  createClassLesson: jest.fn(),
}));

jest.mock("@/services/admin/planService", () => ({
  fetchPlanIdentifiers: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock("@/services/admin/instructorService", () => ({
  fetchAllInstructors: jest.fn().mockResolvedValue({
    instructors: [],
    meta: { hasNextPage: false },
  }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("CreateOnlineClass date validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents progressing when the end date is before the start date", async () => {
    render(<CreateOnlineClass />);

    fireEvent.change(screen.getByLabelText("class_title_label"), { target: { value: "Sample Class" } });
    fireEvent.change(screen.getByLabelText("start_date_label"), { target: { value: "2024-01-10" } });
    fireEvent.change(screen.getByLabelText("end_date_label"), { target: { value: "2024-01-09" } });

    const form = screen.getByRole("button", { name: "next" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("End date must be after the start date.");
    });
  });

  it("allows progressing when the end date is after the start date", async () => {
    render(<CreateOnlineClass />);

    fireEvent.change(screen.getByLabelText("class_title_label"), { target: { value: "Sample Class" } });
    fireEvent.change(screen.getByLabelText("start_date_label"), { target: { value: "2024-01-10" } });
    fireEvent.change(screen.getByLabelText("end_date_label"), { target: { value: "2024-01-11" } });

    const form = screen.getByRole("button", { name: "next" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("lesson_plan")).toBeInTheDocument();
    });

    expect(toast.error).not.toHaveBeenCalled();
  });
});
