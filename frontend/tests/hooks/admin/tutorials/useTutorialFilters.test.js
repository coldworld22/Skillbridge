import { renderHook, act } from "@testing-library/react";
import useTutorialFilters from "@/hooks/admin/tutorials/useTutorialFilters";

describe("useTutorialFilters", () => {
  it("filters tutorials when title or instructor fields are null", () => {
    const tutorials = [
      {
        id: 1,
        title: null,
        instructor: "Alice Example",
        category: "All",
        status: "Published",
        approvalStatus: "Approved",
      },
      {
        id: 2,
        title: "React Basics",
        instructor: null,
        category: "All",
        status: "Draft",
        approvalStatus: "Pending",
      },
      {
        id: 3,
        title: null,
        instructor: null,
        category: "All",
        status: "Draft",
        approvalStatus: "Pending",
      },
    ];

    const { result } = renderHook(() => useTutorialFilters(tutorials));

    act(() => {
      result.current.setSearchQuery("alice");
    });

    expect(result.current.filteredTutorials).toHaveLength(1);
    expect(result.current.filteredTutorials[0].id).toBe(1);

    act(() => {
      result.current.setSearchQuery("react");
    });

    expect(result.current.filteredTutorials).toHaveLength(1);
    expect(result.current.filteredTutorials[0].id).toBe(2);

    act(() => {
      result.current.setSearchQuery("missing");
    });

    expect(result.current.filteredTutorials).toHaveLength(0);
  });
});
