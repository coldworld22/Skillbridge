import { create } from "zustand";
import { persist } from "zustand/middleware";

const useScheduleStore = create(
  persist(
    (set, get) => ({
      events: [],
      addEvents: (items) =>
        set((state) => {
          const byId = {};
          [...state.events, ...items].forEach((e) => {
            byId[e.id] = e;
          });
          const events = Object.values(byId).sort(
            (a, b) => new Date(a.start) - new Date(b.start)
          );
          return { events };
        }),
      clear: () => set({ events: [] }),
      removeEvents: (ids) =>
        set((state) => ({ events: state.events.filter((e) => !ids.includes(e.id)) })),
      prunePastEvents: () =>
        set((state) => {
          const now = new Date();
          return { events: state.events.filter((e) => new Date(e.start) >= now) };
        }),
    }),
    { name: "schedule-store" }
  )
);

export default useScheduleStore;
