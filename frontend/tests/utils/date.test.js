const timeZones = ['UTC', 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'];

describe('toLocalDateStartISO', () => {
  const originalTZ = process.env.TZ;

  afterAll(() => {
    process.env.TZ = originalTZ;
  });

  test.each(timeZones)('preserves calendar day for %s', async (timeZone) => {
    process.env.TZ = timeZone;
    jest.resetModules();
    const { toLocalDateStartISO } = await import('@/utils/date');

    const iso = toLocalDateStartISO('2024-03-21');
    const result = new Date(iso);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(21);
  });
});
