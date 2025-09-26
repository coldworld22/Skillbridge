import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import StudentProfileEdit from "@/pages/dashboard/student/profile/edit";
import {
  getStudentProfile as mockGetStudentProfile,
  updateStudentProfile as mockUpdateStudentProfile,
} from "@/services/student/studentService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("next/dynamic", () => () => () => null);

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue ?? key,
  }),
}));

jest.mock("react-toastify", () => {
  const toast = {
    error: jest.fn(),
    success: jest.fn(),
    promise: jest.fn((promise) => promise),
  };
  return { toast };
});

jest.mock("@/components/layouts/StudentLayout", () => ({ children }) => <div>{children}</div>);

jest.mock("@/services/student/studentService", () => ({
  getStudentProfile: jest.fn(),
  updateStudentProfile: jest.fn(),
  uploadStudentAvatar: jest.fn(),
  uploadStudentIdentity: jest.fn(),
}));

jest.mock("@/store/auth/authStore", () => {
  const setUser = jest.fn();
  const logout = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({
      user: { id: 42, role: "student" },
      logout,
      hasHydrated: true,
      setUser,
    })),
  };
});

const notificationFetch = jest.fn();
jest.mock("@/store/notifications/notificationStore", () => ({
  __esModule: true,
  default: jest.fn((selector) => selector({ fetch: notificationFetch })),
}));

const messageFetch = jest.fn();
jest.mock("@/store/messages/messageStore", () => ({
  __esModule: true,
  default: jest.fn((selector) => selector({ fetch: messageFetch })),
}));

jest.mock("@/services/notificationService", () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/messageService", () => ({
  sendChatMessage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/utils/socialLinks", () => ({
  toSocialLinksArray: jest.fn(() => []),
}));

jest.mock("@/utils/socialPlatforms", () => ({
  allowedPlatforms: [],
  defaultPlatformIcon: { Icon: () => null, className: "" },
}));

jest.mock("@/utils/logger", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

jest.mock("@/utils/getUserCountry", () => ({
  getUserCountry: jest.fn(() => "US"),
}));

jest.mock("libphonenumber-js", () => ({
  isValidPhoneNumber: jest.fn(() => true),
}));

describe("StudentProfileEdit topics normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits normalized topics array when profile topics are provided as a string", async () => {
    const apiTopicsString = '["AI","Blockchain"]';
    const normalizedResponse = {
      full_name: "Test Student",
      phone: "+14155552671",
      gender: "male",
      date_of_birth: "2000-01-01T00:00:00.000Z",
      avatar_url: null,
      student: {
        education_level: "Bachelor",
        topics: ["AI", "Blockchain"],
        learning_goals: "Become an expert",
      },
      social_links: [],
    };

    mockGetStudentProfile.mockResolvedValue(normalizedResponse);
    mockGetStudentProfile.mockResolvedValueOnce({
      ...normalizedResponse,
      student: {
        ...normalizedResponse.student,
        topics: apiTopicsString,
      },
    });

    mockUpdateStudentProfile.mockResolvedValue({});

    render(<StudentProfileEdit />);

    await waitFor(() => {
      expect(mockGetStudentProfile).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByDisplayValue("Test Student")).toBeInTheDocument();

    const saveButton = await screen.findByRole("button", { name: "save_changes" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateStudentProfile).toHaveBeenCalledWith(
        expect.objectContaining({ topics: ["AI", "Blockchain"] })
      );
    });
  });
});
