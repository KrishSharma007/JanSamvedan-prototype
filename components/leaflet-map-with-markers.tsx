"use client";

import { useEffect, useRef, useState } from 'react';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  category?: string;
  status?: string;
  priority?: string;
  address?: string;
  color?: string;
  size?: number;
}

interface LeafletMapWithMarkersProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Marker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: Marker) => void;
  height?: string;
  className?: string;
  showAttribution?: boolean;
  focusOnMarker?: string; // ID of marker to focus on
  autoFitBounds?: boolean; // Whether to auto-fit bounds to show all markers
  mapView?: 'normal' | 'satellite' | 'terrain'; // Map view type
  onMapViewChange?: (view: string) => void; // Callback for view changes
}

export function LeafletMapWithMarkers({ 
  latitude, 
  longitude, 
  zoom = 12,
  markers = [],
  onLocationSelect,
  onMarkerClick,
  height = "400px",
  className = "",
  showAttribution = true,
  focusOnMarker,
  autoFitBounds = false,
  mapView = 'normal',
  onMapViewChange
}: LeafletMapWithMarkersProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  const createMarkerIcon = (marker: Marker, isFocused: boolean = false) => {
    const L = (window as any).L;
    const color = marker.color || getStatusColor(marker.status);
    const baseSize = marker.size || getPrioritySize(marker.priority);
    const size = isFocused ? Math.max(baseSize * 1.5, 20) : baseSize;
    const borderWidth = isFocused ? 3 : 2;
    const shadowSize = isFocused ? 8 : 6;
    
    return L.divIcon({
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        box-shadow: 0 0 ${shadowSize}px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isFocused ? '12px' : '10px'};
        color: white;
        font-weight: bold;
        transition: all 0.3s ease;
        z-index: ${isFocused ? 1000 : 100};
      ">${marker.category?.charAt(0).toUpperCase() || '•'}</div>`,
      className: `custom-marker ${isFocused ? 'focused-marker' : ''}`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "RESOLVED": return "#22c55e";
      case "IN_PROGRESS": return "#3b82f6";
      case "ASSIGNED": return "#eab308";
      case "PENDING": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getPrioritySize = (priority?: string) => {
    // More responsive sizes based on priority
    switch (priority) {
      case "high": return 20;
      case "medium": return 16;
      case "low": return 12;
      default: return 16;
    }
  };

  const getTileLayer = (view: string) => {
    const L = (window as any).L;
    switch (view) {
      case 'satellite':
        return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
        });
      case 'terrain':
        return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap (CC-BY-SA)'
        });
      default: // normal
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });
    }
  };


  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Add initial tile layer
      tileLayerRef.current = getTileLayer(mapView);
      tileLayerRef.current.addTo(mapInstanceRef.current);

      // Add click event for location selection
      if (onLocationSelect) {
        mapInstanceRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(lat, lng);
        });
      }
    } else {
      // Update existing map center
      mapInstanceRef.current.setView([latitude, longitude], zoom);
    }
  }, [isLoaded, latitude, longitude, zoom, onLocationSelect, showAttribution]);

  // Handle map view changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = getTileLayer(mapView);
    tileLayerRef.current.addTo(mapInstanceRef.current);
  }, [mapView, markers]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;
    clearMarkers();

    const bounds = L.latLngBounds();
    let focusedMarker: any = null;

    markers.forEach(marker => {
      if (marker.latitude && marker.longitude) {
        const isFocused = focusOnMarker === marker.id;
        const icon = createMarkerIcon(marker, isFocused);
        const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
          .addTo(mapInstanceRef.current);

        // Add click event for marker
        if (onMarkerClick) {
          leafletMarker.on('click', () => {
            onMarkerClick(marker);
          });
        }

        // Add popup with marker info
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${marker.title || 'Issue'}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${marker.category || 'Unknown Category'}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Status: ${marker.status || 'Unknown'}</p>
            ${marker.address ? `<p style="margin: 0; font-size: 11px; color: #888;">${marker.address}</p>` : ''}
          </div>
        `;
        leafletMarker.bindPopup(popupContent);

        // Add to bounds for auto-fit
        bounds.extend([marker.latitude, marker.longitude]);

        // Store focused marker for later centering
        if (isFocused) {
          focusedMarker = leafletMarker;
        }

        markersRef.current.push(leafletMarker);
      }
    });

    // Handle focus and auto-fit
    if (focusedMarker) {
      // Focus on specific marker with higher zoom
      mapInstanceRef.current.setView([focusedMarker.getLatLng().lat, focusedMarker.getLatLng().lng], 16);
      // Open popup for focused marker
      focusedMarker.openPopup();
    } else if (autoFitBounds && markers.length > 0) {
      // Auto-fit to show all markers
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [isLoaded, markers, onMarkerClick, focusOnMarker, autoFitBounds]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height }} 
      className={`rounded-lg border ${className}`}
    />
  );
}
