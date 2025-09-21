"use client";

import { useEffect, useState } from "react";
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
import { LeafletMapWithMarkers } from "@/components/leaflet-map-with-markers";

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
  const [mapView, setMapView] = useState<"normal" | "satellite" | "terrain">("normal");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<ApiReport | null>(null);
  const [trackReportId, setTrackReportId] = useState<string | null>(null);

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

    // Check if we're tracking a specific report
    const trackId = localStorage.getItem('trackReportId');
    if (trackId) {
      setTrackReportId(trackId);
      // Clear the tracking ID after reading it
      localStorage.removeItem('trackReportId');
    }
  }, [router]);

  // Filter reports based on current filters
  const filteredReports = reports.filter((r) => {
    // If tracking a specific report, only show that report
    if (trackReportId && r.id !== trackReportId) return false;
    
    // Exclude resolved complaints from city map (unless tracking specific report)
    if (r.status === "RESOLVED" && !trackReportId) return false;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RESOLVED": return "#22c55e";
      case "IN_PROGRESS": return "#3b82f6";
      case "ASSIGNED": return "#eab308";
      case "PENDING": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // Convert reports to markers for the map
  const mapMarkers = filteredReports
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      id: r.id,
      latitude: r.latitude!,
      longitude: r.longitude!,
      title: r.title,
      category: r.category,
      status: r.status,
      priority: r.priority,
      address: r.address,
      color: getStatusColor(r.status),
      size: Math.max(16, priorityToSize(r.priority))
    }));

  const handleMarkerClick = (marker: any) => {
    const report = reports.find(r => r.id === marker.id);
    if (report) {
      setSelectedMarker(report);
    }
  };

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

            {/* Tracking notification */}
            {trackReportId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📍 Tracking specific report. Only this report is shown on the map.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setTrackReportId(null)}
                >
                  Show All Reports
                </Button>
              </div>
            )}

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

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mapView === "normal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapView("normal")}
                  className="flex-1"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Normal
                </Button>
                <Button
                  variant={mapView === "satellite" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapView("satellite")}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Satellite
                </Button>
                <Button
                  variant={mapView === "terrain" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapView("terrain")}
                  className="flex-1"
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Terrain
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
          <LeafletMapWithMarkers
            latitude={28.6139}
            longitude={77.209}
            zoom={12}
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            height="100%"
            className="min-h-[500px]"
            showAttribution={true}
            focusOnMarker={trackReportId || undefined}
            autoFitBounds={!trackReportId && mapMarkers.length > 0}
            mapView={mapView}
            onMapViewChange={setMapView}
          />
        </div>
      </div>
    </div>
  );
}
