import { create } from "zustand";
import { fetchTutorialProgress, saveTutorialProgress } from "@/services/tutorialService";
import localforage from "localforage";

const OFFLINE_KEY = "skillbridge_offlineProgress";
const MAX_OFFLINE_ENTRIES = 50;
const OFFLINE_STORE = localforage.createInstance({
  name: "skillbridge",
  storeName: "offlineProgress",
});

async function enforceLimit() {
  try {
    const keys = await OFFLINE_STORE.keys();
    if (keys.length <= MAX_OFFLINE_ENTRIES) return;
    const records = await Promise.all(
      keys.map(async (key) => {
        const item = await OFFLINE_STORE.getItem(key);
        return { key, ts: item?.ts || 0 };
      })
    );
    records.sort((a, b) => b.ts - a.ts);
    const toRemove = records.slice(MAX_OFFLINE_ENTRIES).map((r) => r.key);
    await Promise.all(toRemove.map((k) => OFFLINE_STORE.removeItem(k)));
  } catch (err) {
    console.error("Failed to enforce offline entry limit", err);
  }
}

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
      if (typeof window !== "undefined") {
        try {
          const record = await OFFLINE_STORE.getItem(id.toString());
          if (record) {
            const data = { enrolled: false, status: null, progress: record.progress };
            set((state) => ({ status: { ...state.status, [id]: data } }));
            return data;
          }
        } catch (e) {
          console.error("Failed to load offline progress", e);
        }
        try {
          const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
          const progress = offline[id] || 0;
          const data = { enrolled: false, status: null, progress };
          set((state) => ({ status: { ...state.status, [id]: data } }));
          return data;
        } catch (parseErr) {
          console.error("Failed to parse legacy offline progress", parseErr);
        }
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
        try {
          await OFFLINE_STORE.removeItem(id.toString());
        } catch (e) {
          console.error("Failed to remove offline progress", e);
        }
        try {
          const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
          delete offline[id];
          localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
        } catch (parseErr) {
          console.error("Failed to clean legacy offline progress", parseErr);
        }
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        try {
          await OFFLINE_STORE.setItem(id.toString(), { progress, ts: Date.now() });
          await enforceLimit();
        } catch (e) {
          console.error("Failed to save offline progress", e);
        }
      }
    }
  },
  async syncOffline() {
    if (typeof window === "undefined") return;
    const keys = await OFFLINE_STORE.keys();
    for (const id of keys) {
      try {
        const record = await OFFLINE_STORE.getItem(id);
        const progress = record?.progress;
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
        await OFFLINE_STORE.removeItem(id);
      } catch (err) {
        console.error(`Failed to sync offline progress for ${id}`, err);
      }
    }
    try {
      const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}");
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
        } catch (err) {
          console.error(`Failed to sync legacy offline progress for ${id}`, err);
        }
      }
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
    } catch (parseErr) {
      console.error("Failed to parse legacy offline progress during sync", parseErr);
    }
  },
}));

export default useTutorialProgressStore;
