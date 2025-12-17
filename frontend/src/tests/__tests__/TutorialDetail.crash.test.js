import { render, screen, waitFor } from "@testing-library/react";
import TutorialDetail from "../../pages/tutorials/[id]";
import useAuthStore from "@/store/auth/authStore";
import * as tutorialService from "../../services/tutorialService";

function createMock(name, extraProps = {}) {
  function MockComponent(props) {
    return <div data-testid={name} {...extraProps} {...props} />;
  }
  MockComponent.displayName = name;
  return MockComponent;
}

jest.mock("../../components/website/sections/Navbar", () => createMock("Navbar"));
jest.mock("../../components/website/sections/Footer", () => createMock("Footer"));
jest.mock("../../components/shared/CustomVideoPlayer", () =>
  createMock("CustomVideoPlayer", { "data-testid": "player" }),
);
jest.mock("../../components/tutorials/detail/TutorialHeader", () =>
  createMock("TutorialHeader"),
);
jest.mock("../../components/tutorials/detail/TutorialOverview", () =>
  createMock("TutorialOverview"),
);
jest.mock("../../components/tutorials/detail/InstructorBio", () =>
  createMock("InstructorBio"),
);
jest.mock("../../components/tutorials/detail/ChapterList", () =>
  createMock("ChapterList"),
);
jest.mock("../../components/tutorials/detail/EnrollBanner", () =>
  createMock("EnrollBanner"),
);
jest.mock("../../components/tutorials/detail/LoginPrompt", () =>
  createMock("LoginPrompt"),
);
jest.mock("../../components/tutorials/detail/VideoPreviewList", () =>
  createMock("VideoPreviewList", { "data-testid": "video-preview-list" }),
);
jest.mock("../../components/tutorials/detail/TestQuiz", () =>
  createMock("TestQuiz"),
);
jest.mock("../../components/tutorials/detail/BackButton", () =>
  createMock("BackButton"),
);
jest.mock("../../components/tutorials/detail/ReviewsSection", () =>
  createMock("ReviewsSection"),
);
jest.mock("../../components/tutorials/detail/CommentsSection", () =>
  createMock("CommentsSection"),
);
jest.mock("../../components/tutorials/detail/RelatedTutorials", () =>
  createMock("RelatedTutorials"),
);
jest.mock("../../components/classes/CourseProgress", () =>
  createMock("CourseProgress"),
);
jest.mock("../../components/tutorials/detail/TutorialSkeleton", () =>
  createMock("TutorialSkeleton"),
);

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  dismiss: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { id: "72da5bff-d18b-4cc9-8097-41e826d5a30b" },
    asPath: "/tutorials/72da5bff-d18b-4cc9-8097-41e826d5a30b",
    push: jest.fn(),
  }),
}));

jest.mock("../../hooks/useTutorialProgress", () =>
  jest.fn(() => ({
    progress: { completedChapters: [], lastIndex: 0 },
    saveTime: jest.fn(),
    completeChapter: jest.fn(),
    setIndex: jest.fn(),
    startTimeFor: jest.fn(() => 0),
  })),
);

jest.mock("../../services/tutorialService");

jest.mock("../../store/cart/cartStore", () => ({
  __esModule: true,
  default: (selector) =>
    selector({
      addItem: jest.fn(),
      items: [],
    }),
}));

const {
  fetchTutorialDetails,
  fetchPublishedTutorials,
  fetchTutorialAssignments,
  fetchTutorialProgress,
  getMyTutorialWishlist,
  getMyTutorialFavorites,
} = tutorialService;

const tutorialFixture = {
  id: "72da5bff-d18b-4cc9-8097-41e826d5a30b",
  title: "Instructor Test",
  description: "instructor test",
  preview: "https://cdn.example.com/tutorials/preview.mp4",
  price: 19,
  currency: "USD",
  instructor: "instructor 1",
  instructorAvatar: "https://cdn.example.com/instructor.png",
  instructorBio: "Seasoned instructor",
  chapters: [
    {
      id: "395a2ae9-4f46-4408-ae34-93bbd9cbb0ef",
      title: "test1",
      videoUrl: "https://cdn.example.com/chapters/1.mp4",
      is_preview: true,
    },
    {
      id: "4b1f4731-9320-4158-8103-888d914f3ddb",
      title: "test2",
      videoUrl: "https://cdn.example.com/chapters/2.mp4",
      is_preview: false,
    },
  ],
};

describe("TutorialDetail regression - tutorial detail page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
    });
    fetchTutorialDetails.mockResolvedValue(tutorialFixture);
    fetchPublishedTutorials.mockResolvedValue([]);
    fetchTutorialAssignments.mockResolvedValue([]);
    fetchTutorialProgress.mockResolvedValue({});
    getMyTutorialWishlist.mockResolvedValue([]);
    getMyTutorialFavorites.mockResolvedValue([]);
  });

  it("renders a tutorial with preview and chapters without crashing", async () => {
    render(<TutorialDetail />);

    await waitFor(() =>
      expect(fetchTutorialDetails).toHaveBeenCalledWith(
        "72da5bff-d18b-4cc9-8097-41e826d5a30b",
      ),
    );

    expect(
      await screen.findByTestId("video-preview-list"),
    ).toBeInTheDocument();
  });

  it("keeps showing the skeleton while tutorial data is loading", async () => {
    let resolveDetails;
    fetchTutorialDetails.mockReturnValue(
      new Promise((resolve) => {
        resolveDetails = resolve;
      }),
    );

    render(<TutorialDetail />);

    await waitFor(() =>
      expect(fetchTutorialDetails).toHaveBeenCalledWith(
        "72da5bff-d18b-4cc9-8097-41e826d5a30b",
      ),
    );

    expect(await screen.findByTestId("TutorialSkeleton")).toBeInTheDocument();

    resolveDetails(tutorialFixture);

    await waitFor(() =>
      expect(screen.getByTestId("video-preview-list")).toBeInTheDocument(),
    );
  });
});
