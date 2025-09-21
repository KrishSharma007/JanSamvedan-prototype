"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Eye,
  Calendar,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type ApiReport = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  reportedDate?: string | null;
  createdAt?: string;
};

const statusToColorClass = (status: string) => {
  switch (status) {
    case "RESOLVED":
      return "bg-green-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "ASSIGNED":
      return "bg-yellow-500";
    case "PENDING":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const priorityToSize = (priority: string) => {
  switch (priority) {
    case "high":
      return 16;
    case "medium":
      return 12;
    case "low":
      return 8;
    default:
      return 12;
  }
};

function closeAnyPopups() {
  document.querySelectorAll(".map-popup").forEach((n) => n.remove());
}

function showPopupForEl(el: HTMLElement, issue: ApiReport) {
  // Popups disabled per request
}

export default function CityMapPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapView, setMapView] = useState<"normal">("normal");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    async function loadReports() {
      try {
        const res = await fetch(`${API_BASE}/reports/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load reports");
        const data = (await res.json()) as ApiReport[];
        setReports(data);
      } catch (_) {
        // noop minimal
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [router]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      try {
        if (m && m.remove) m.remove();
        else if (m && m.setMap) m.setMap(null);
      } catch {}
    });
    markersRef.current = [];
    closeAnyPopups();
  };

  const renderMarkers = () => {
    const w = window as any;
    if (!mapRef.current || !w.mappls) return;
    clearMarkers();

    const filtered = reports.filter((r) => {
      // Exclude resolved complaints from city map
      if (r.status === "RESOLVED") return false;

      const cat =
        categoryFilter === "all" ||
        (r.category || "").toLowerCase().includes(categoryFilter);
      const st =
        statusFilter === "all" || r.status === statusFilter.toUpperCase();
      const srch =
        !searchTerm ||
        (r.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.address || "").toLowerCase().includes(searchTerm.toLowerCase());
      return cat && st && srch;
    });

    filtered.forEach((issue) => {
      if (issue.latitude == null || issue.longitude == null) return;
      const colorClass = statusToColorClass(issue.status);
      const size = Math.max(14, priorityToSize(issue.priority));
      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "9999px";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
      el.style.backgroundColor = colorClass.includes("green")
        ? "#22c55e"
        : colorClass.includes("blue")
        ? "#3b82f6"
        : colorClass.includes("yellow")
        ? "#eab308"
        : colorClass.includes("red")
        ? "#ef4444"
        : "#6b7280";
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
      el.style.zIndex = "10000";
      el.title = `${issue.category || "Issue"}: ${issue.title || ""}`;

      const m = new (window as any).mappls.Marker({
        map: mapRef.current,
        position: { lat: issue.latitude, lng: issue.longitude },
        element: el,
      });
      markersRef.current.push(m);
    });

    const first = filtered.find(
      (r) => r.latitude != null && r.longitude != null
    );
    if (first)
      mapRef.current.setCenter({ lat: first.latitude, lng: first.longitude });

    // Close popups on map interactions
    try {
      mapRef.current.addListener("drag", closeAnyPopups);
      mapRef.current.addListener("zoomend", closeAnyPopups);
      mapRef.current.addListener("click", closeAnyPopups);
    } catch {}
  };

  // Wait for SDK then init map
  useEffect(() => {
    const w = window as any;
    if (mapRef.current || !w.mappls) return;

    let n = 0;
    const id = setInterval(() => {
      if (w.mappls) {
        try {
          const defaultCenter = { lat: 28.6139, lng: 77.209 };
          if (w.mappls.vectorMap) {
            mapRef.current = w.mappls.vectorMap("mappls-container", {
              center: defaultCenter,
              zoom: 12,
            });
          } else if (w.mappls.Map) {
            mapRef.current = new w.mappls.Map("mappls-container", {
              center: defaultCenter,
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

  // Re-render markers on data/filter changes
  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, searchTerm, reports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-background border-r border-border overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              City Map
            </h1>
            <p className="text-muted-foreground mb-6">
              Interactive civic issues map
            </p>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location or issue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="garbage">Garbage</SelectItem>
                      <SelectItem value="street light">Street Light</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="park">Park</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={mapView === "normal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapView("normal")}
                  className="flex-1"
                >
                  Normal View
                </Button>
              </div>
            </div>

            {/* Issues count */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">
                Issues ({reports.filter((r) => r.status !== "RESOLVED").length})
              </h3>
              {reports
                .filter((r) => r.status !== "RESOLVED")
                .map((issue) => (
                  <Card key={issue.id} className={`transition-colors`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div
                          className={`${statusToColorClass(
                            issue.status
                          )} w-3 h-3 rounded-full mt-1`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {issue.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {issue.address || ""}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {issue.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map container */}
          <div id="mappls-container" className="w-full h-full min-h-[500px]" />

          {/* Attribution */}
          <div className="absolute bottom-4 left-4 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground">
            Map powered by Mappls (MapMyIndia)
          </div>
        </div>
      </div>
    </div>
  );
}
