import api from "@/services/api/api";
import { fetchAdminClasses } from "@/services/admin/classService";
import { mapStatusFilterToQuery } from "@/components/admin/online-classes/AdminClassesTable";

jest.mock("@/services/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { data: [], meta: {} } })),
  },
}));

describe("AdminClassesTable status filter integration", () => {
  const scheduleFilters = ["All", "Upcoming", "Ongoing", "Completed"];
  const backendStatuses = ["draft", "published", "archived", "Published"];

  beforeEach(() => {
    api.get.mockClear();
  });

  scheduleFilters.forEach((filter) => {
    it(`omits the status query parameter when schedule filter "${filter}" is applied`, async () => {
      await fetchAdminClasses({
        page: 1,
        limit: 5,
        status: mapStatusFilterToQuery(filter),
      });

      const lastCall = api.get.mock.calls[api.get.mock.calls.length - 1][0];
      expect(lastCall).toContain("/users/classes/admin?");
      expect(lastCall).not.toContain("status=");
    });
  });

  backendStatuses.forEach((status) => {
    it(`passes backend status "${status}" through to the API query`, async () => {
      await fetchAdminClasses({
        page: 1,
        limit: 5,
        status: mapStatusFilterToQuery(status),
      });

      const lastCall = api.get.mock.calls[api.get.mock.calls.length - 1][0];
      expect(lastCall).toContain("/users/classes/admin?");
      expect(lastCall).toContain(`status=${status.toLowerCase()}`);
    });
  });
});
