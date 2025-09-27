import { computeScheduleStatus } from "@/utils/classSchedule";

describe("computeScheduleStatus", () => {
  const now = new Date();

  it("returns Upcoming when the start date is in the future", () => {
    const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(computeScheduleStatus(futureStart.toISOString())).toBe("Upcoming");
  });

  it("returns Ongoing when the class has started and no end date is provided", () => {
    const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(computeScheduleStatus(pastStart.toISOString(), null)).toBe("Ongoing");
  });

  it("returns Ongoing when the class is between the start and end dates", () => {
    const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(
      computeScheduleStatus(pastStart.toISOString(), futureEnd.toISOString())
    ).toBe("Ongoing");
  });

  it("returns Completed when the end date has passed", () => {
    const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pastEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(
      computeScheduleStatus(pastStart.toISOString(), pastEnd.toISOString())
    ).toBe("Completed");
  });
});
