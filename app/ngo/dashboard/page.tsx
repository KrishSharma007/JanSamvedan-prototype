"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  address: string | null;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

export default function NgoDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Debug: Check user role
    if (user) {
      const userData = JSON.parse(user);
      console.log("NGO Dashboard - User data:", userData);
      if (userData.role !== "NGO") {
        console.error("User is not an NGO, role:", userData.role);
        setError("Access denied: This page is for NGO users only");
        setLoading(false);
        return;
      }
    }

    async function load() {
      try {
        console.log(
          "Fetching reports for NGO from:",
          `${API_BASE}/reports/for-ngo`
        );
        const res = await fetch(`${API_BASE}/reports/for-ngo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Failed to load reports:", res.status, errorData);
          throw new Error(errorData.error || "Failed to load reports");
        }
        const data = await res.json();
        setReports(data);
      } catch (e: any) {
        console.error("Error loading reports:", e);
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">NGO - Area Reports</h1>
        {reports.length === 0 ? (
          <div className="text-gray-600">No reports found for your area.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="border rounded p-4 bg-white">
                <div className="flex justify-between">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-gray-500">{r.complaintId}</div>
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {r.description}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {r.category} • {r.priority} • {r.status}
                </div>
                <div className="text-xs text-gray-500">
                  {r.address || "No address"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
