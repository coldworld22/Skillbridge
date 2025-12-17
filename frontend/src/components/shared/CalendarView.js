import dynamic from "next/dynamic";

const CalendarView = dynamic(() => import("./CalendarView.client"), {
  ssr: false,
  loading: () => (
    <section style={{ overflow: "hidden", borderRadius: "1.5rem", border: "1px dashed #e5e7eb", background: "rgba(255,255,255,0.6)", padding: "4rem 1.5rem", textAlign: "center" }}>
      <div style={{ display: "grid", gap: "0.75rem", justifyContent: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
        <div style={{ height: "1rem", width: "10rem", borderRadius: "0.75rem", background: "#e5e7eb", margin: "0 auto" }} />
        <div style={{ height: "1rem", width: "16rem", borderRadius: "0.75rem", background: "#e5e7eb", margin: "0 auto" }} />
        <div style={{ height: "0.8rem", width: "12rem", borderRadius: "0.75rem", background: "#f3f4f6", margin: "0 auto" }} />
      </div>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>Loading calendar…</p>
    </section>
  ),
});

export default CalendarView;
