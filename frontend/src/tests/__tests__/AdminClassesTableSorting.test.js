import { compareValues } from "@/components/admin/online-classes/AdminClassesTable";

describe("compareValues", () => {
  const sample = [
    { title: "B", start_date: "2024-05-02", price: 10 },
    { title: "A", start_date: "2024-04-01", price: 20 },
    { title: "C", start_date: "2024-05-01", price: 5 },
  ];

  test("sorts strings using localeCompare", () => {
    const sorted = [...sample].sort((a, b) => compareValues(a, b, "title"));
    expect(sorted.map((c) => c.title)).toEqual(["A", "B", "C"]);
  });

  test("sorts dates numerically", () => {
    const sorted = [...sample].sort((a, b) => compareValues(a, b, "start_date"));
    expect(sorted.map((c) => c.start_date)).toEqual([
      "2024-04-01",
      "2024-05-01",
      "2024-05-02",
    ]);
  });

  test("sorts numbers numerically", () => {
    const sorted = [...sample].sort((a, b) => compareValues(a, b, "price"));
    expect(sorted.map((c) => c.price)).toEqual([5, 10, 20]);
  });
});
