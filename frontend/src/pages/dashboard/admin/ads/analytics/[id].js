// pages/admin/ads/analytics/[id].js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import PageHead from "@/components/common/PageHead";
import { fetchAdById, fetchAdAnalytics } from "@/services/admin/adService";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";

export default function AdAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [ad, setAd] = useState(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchAdById(id), fetchAdAnalytics(id)])
      .then(([adData, analytics]) => {
        if (adData) {
          setAd({ ...adData, ...(analytics || {}) });
        } else {
          setAd(null);
        }
      })
      .catch(() => setAd(null));
  }, [id]);

  if (!ad) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-sm text-muted-foreground">Loading ad analytics...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHead title={`Ad Analytics - ${ad.title}`} />
  
      <div className="p-4 sm:p-6 space-y-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ad.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analytics overview for this campaign
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 text-sm">Edit</button>
            <button className={`px-4 py-2 rounded text-sm text-white ${ad.isActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {ad.isActive ? "Deactivate" : "Activate"}
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">Delete</button>
          </div>
        </div>
  
        {/* Ad Info */}
        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
          <div>
            <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover rounded-md border" />
          </div>
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div><strong>Description:</strong> {ad.description}</div>
            <div>
              <strong>Target Roles:</strong>
              <div className="mt-1 flex gap-2 flex-wrap">
                {ad.targetRoles.map(role => (
                  <span key={role} className="bg-gray-100 px-2 py-0.5 rounded text-xs capitalize">{role}</span>
                ))}
              </div>
            </div>
            <div><strong>Duration:</strong> 📅 {ad.startAt} → {ad.endAt}</div>
            <div><strong>Ad Type:</strong> 📌 <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{ad.adType}</span></div>
            <div>
              <strong>Status:</strong> ⚙️
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {ad.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
  
        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">📊 Performance Metrics</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            {[
              { label: "Views", value: ad.views, icon: "👁️" },
              { label: "CTR", value: ad.ctr, icon: "📈" },
              { label: "Conversions", value: ad.conversions, icon: "🎯" },
              { label: "Reach", value: ad.reach, icon: "📊" },
              { label: "Top Devices", value: ad.devices?.join(", "), icon: "📱" }
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 p-4 rounded border">
                <div className="text-xs uppercase mb-1">{item.icon} {item.label}</div>
                <div className="text-base font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Chart: Views Over Time */}
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
  
        {/* Chart: Views by Country */}
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
    </AdminLayout>
  );
  
}
