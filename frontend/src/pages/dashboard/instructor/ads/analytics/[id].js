// pages/instructor/ads/analytics/[id].js
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import Head from "next/head";
import { fetchAdById } from "@/services/admin/adService";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";

export default function InstructorAdAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [ad, setAd] = useState(null);

  const generateMockAnalytics = () => ({
    views: Math.floor(Math.random() * 300),
    ctr: `${(Math.random() * 2).toFixed(1)}%`,
    conversions: Math.floor(Math.random() * 50),
    reach: Math.floor(Math.random() * 800),
    devices: ["Mobile", "Desktop"],
    locationStats: [
      { country: "Egypt", views: Math.floor(Math.random() * 150) },
      { country: "Saudi Arabia", views: Math.floor(Math.random() * 150) },
      { country: "UAE", views: Math.floor(Math.random() * 150) },
    ],
    analytics: [
      { day: "Mon", views: Math.floor(Math.random() * 100) },
      { day: "Tue", views: Math.floor(Math.random() * 100) },
      { day: "Wed", views: Math.floor(Math.random() * 100) },
      { day: "Thu", views: Math.floor(Math.random() * 100) },
      { day: "Fri", views: Math.floor(Math.random() * 100) },
      { day: "Sat", views: Math.floor(Math.random() * 100) },
      { day: "Sun", views: Math.floor(Math.random() * 100) },
    ],
  });

  useEffect(() => {
    if (!id) return;
    fetchAdById(id)
      .then((data) => {
        if (data) {
          setAd({ ...data, ...generateMockAnalytics() });
        } else {
          setAd(null);
        }
      })
      .catch(() => setAd(null));
  }, [id]);

  if (!ad) {
    return (
      <InstructorLayout>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Loading ad analytics...
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <Head>
        <title>Ad Analytics - {ad.title}</title>
      </Head>

      <div className="p-4 sm:p-6 space-y-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ad.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analytics overview for your ad campaign
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
          <div>
            <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover rounded-md border" />
          </div>
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div><strong>Description:</strong> {ad.description}</div>
            <div><strong>Audience:</strong> {ad.targetRoles.join(", ")}</div>
            <div><strong>Duration:</strong> {ad.startAt} → {ad.endAt}</div>
            <div><strong>Ad Type:</strong> {ad.adType}</div>
            <div><strong>Status:</strong> {ad.isActive ? "Active" : "Inactive"}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">📊 Performance Metrics</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            {["Views", "CTR", "Conversions", "Reach"].map((label, i) => (
              <div key={label} className="bg-gray-50 p-4 rounded border">
                <div className="text-xs uppercase mb-1">{label}</div>
                <div className="text-base font-bold">
                  {label === "Views" ? ad.views :
                   label === "CTR" ? ad.ctr :
                   label === "Conversions" ? ad.conversions : ad.reach}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📈 Views Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ad.analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🌍 Views by Country</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ad.locationStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </InstructorLayout>
  );
}
