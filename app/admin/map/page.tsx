"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Filter,
  Download,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;
type ApiReport = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

export default function AdminMapPage() {
  const [mapView, setMapView] = useState<"normal">("normal");
  const [timeFilter, setTimeFilter] = useState("today");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    inProgress: number;
    resolvedToday: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/reports/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setStats({
          total: data.totalReports,
          pending: data.pendingReports,
          inProgress: data.inProgressReports,
          resolvedToday: data.resolvedToday,
        });
        // Load reports for map markers
        const repRes = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (repRes.ok) {
          const repData = await repRes.json();
          setReports(repData);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      try {
        if (m && m.remove) m.remove();
        else if (m && m.setMap) m.setMap(null);
      } catch {}
    });
    markersRef.current = [];
  };

  const renderMarkers = () => {
    if (!mapRef.current || !(window as any).mappls) return;
    clearMarkers();
    reports.forEach((r) => {
      if (r.latitude == null || r.longitude == null) return;
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "9999px";
      el.style.border = "2px solid white";
      el.style.backgroundColor = "#2563eb";
      const m = new (window as any).mappls.Marker({
        map: mapRef.current,
        position: { lat: r.latitude, lng: r.longitude },
        element: el,
      });
      markersRef.current.push(m);
    });
  };

  // Initialize Mappls map in the main area
  useEffect(() => {
    const w = window as any;
    if (mapRef.current || !w.mappls) return;
    let n = 0;
    const id = setInterval(() => {
      if (w.mappls) {
        try {
          const center = { lat: 28.6139, lng: 77.209 };
          if (w.mappls.vectorMap) {
            mapRef.current = w.mappls.vectorMap("admin-mappls-container", {
              center,
              zoom: 12,
            });
          } else if (w.mappls.Map) {
            mapRef.current = new w.mappls.Map("admin-mappls-container", {
              center,
              zoom: 12,
            });
          }
          clearInterval(id);
          renderMarkers();
        } catch {}
      }
      n += 1;
      if (n > 50) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when reports change
  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <div className="w-80 bg-background border-r border-border overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Admin Map View
            </h1>
            <p className="text-muted-foreground mb-6">
              Real-time civic issues monitoring
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {stats?.pending ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {stats?.inProgress ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    In Progress
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {stats?.resolvedToday ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Resolved Today
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-primary">
                    {stats?.total ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Issues
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="roads">Roads</SelectItem>
                    <SelectItem value="water">Water Works</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="sanitation">Sanitation</SelectItem>
                    <SelectItem value="parks">Parks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hotspots */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issue Hotspots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  No hotspot data available
                </div>
              </CardContent>
            </Card>

            {/* Department Status */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Department Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  No department stats available
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full justify-start" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Map Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="sm"
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="sm"
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule Report
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Map Area */}
        <div className="flex-1 relative">
          {/* Mappls Map */}
          <div id="admin-mappls-container" className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
