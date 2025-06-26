import { create } from "zustand";
import { persist } from "zustand/middleware";

const useScheduleStore = create(
  persist(
    (set, get) => ({
      events: [],
      addEvents: (items) =>
        set((state) => ({ events: [...state.events, ...items] })),
      clear: () => set({ events: [] }),
    }),
    { name: "schedule-store" }
  )
);

export default useScheduleStore;
