import { create } from "zustand";
import { fetchTutorialProgress, saveTutorialProgress } from "@/services/tutorialService";

const OFFLINE_KEY = "skillbridge_offlineProgress";

const useTutorialProgressStore = create((set, get) => ({
  status: {}, // { [tutorialId]: { enrolled, progress, status } }
  async fetchStatus(id) {
    const existing = get().status[id];
    if (existing) return existing;
    try {
      const data = await fetchTutorialProgress(id);
      set((state) => ({ status: { ...state.status, [id]: data } }));
      return data;
    } catch (err) {
      // Fallback to offline progress if available
      if (typeof window !== "undefined") {
        try {
          const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
          const progress = offline[id] || 0;
          const data = { enrolled: false, status: null, progress };
          set((state) => ({ status: { ...state.status, [id]: data } }));
          return data;
        } catch {}
      }
      return { enrolled: false, status: null, progress: 0 };
    }
  },
  async updateProgress(id, progress) {
    try {
      const data = await saveTutorialProgress(id, progress);
      set((state) => ({
        status: {
          ...state.status,
          [id]:
            data || {
              ...(state.status[id] || {}),
              enrolled: true,
              status: data?.status ?? state.status[id]?.status ?? null,
              progress,
            },
        },
      }));
      if (typeof window !== "undefined") {
        const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
        delete offline[id];
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
      }
    } catch {
      if (typeof window !== "undefined") {
        const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
        offline[id] = progress;
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
      }
    }
  },
  async syncOffline() {
    if (typeof window === "undefined") return;
    let offline;
    try {
      offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
    } catch {
      offline = {};
    }
    const ids = Object.keys(offline);
    for (const id of ids) {
      try {
        const progress = offline[id];
        const data = await saveTutorialProgress(id, progress);
        set((state) => ({
          status: {
            ...state.status,
            [id]:
              data || {
                ...(state.status[id] || {}),
                enrolled: true,
                status: data?.status ?? state.status[id]?.status ?? null,
                progress,
              },
          },
        }));
        delete offline[id];
      } catch {
        // keep if failed
      }
    }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
  },
}));

export default useTutorialProgressStore;
