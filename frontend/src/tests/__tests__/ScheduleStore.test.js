import useScheduleStore from '@/store/schedule/scheduleStore';

beforeEach(() => {
  const { clear } = useScheduleStore.getState();
  clear();
  window.localStorage.clear();
});

test('addEvents deduplicates and sorts by start date', () => {
  const { addEvents } = useScheduleStore.getState();
  addEvents([
    { id: 'a', title: 'first', start: '2025-01-02T00:00:00Z' },
    { id: 'b', title: 'second', start: '2025-01-01T00:00:00Z' },
  ]);
  addEvents([
    { id: 'a', title: 'first updated', start: '2025-01-02T00:00:00Z' },
    { id: 'c', title: 'third', start: '2025-01-03T00:00:00Z' },
  ]);
  const ids = useScheduleStore.getState().events.map((e) => e.id);
  expect(ids).toEqual(['b', 'a', 'c']);
});
