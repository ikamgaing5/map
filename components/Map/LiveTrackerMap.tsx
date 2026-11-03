"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Navigation, Layers, ZoomIn, ZoomOut, Compass } from "lucide-react";
import { formatDistance, formatSpeed, formatTimeAgo } from "@/lib/utils";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  batteryLevel?: number | null;
  timestamp?: string | Date | null;
}

interface LiveTrackerMapProps {
  childName: string;
  currentLocation?: LocationData | null;
  historyPoints?: Array<{ latitude: number; longitude: number; timestamp?: string | Date }>;
  totalDistanceMeters?: number;
}

export default function LiveTrackerMap({
  childName,
  currentLocation,
  historyPoints = [],
  totalDistanceMeters = 0,
}: LiveTrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocation?.latitude || 48.8566;
    const initialLng = currentLocation?.longitude || 2.3522;
    const initialZoom = currentLocation ? 16 : 12;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
    });

    // OpenStreetMap standard tiles (100% private, free, no trackers)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributeurs',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Marker, Accuracy circle, and Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      const latLng: L.LatLngExpression = [currentLocation.latitude, currentLocation.longitude];

      // Custom pulsing DivIcon for child
      const customIcon = L.divIcon({
        className: "custom-child-marker",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(37, 99, 235, 0.35); animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">
              ${childName.charAt(0).toUpperCase()}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!markerRef.current) {
        markerRef.current = L.marker(latLng, { icon: customIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(latLng);
        markerRef.current.setIcon(customIcon);
      }

      // Accuracy Circle
      if (currentLocation.accuracy && currentLocation.accuracy > 0) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(latLng, {
            radius: currentLocation.accuracy,
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng(latLng);
          accuracyCircleRef.current.setRadius(currentLocation.accuracy);
        }
      }

      // Auto-recenter if enabled
      if (autoCenter) {
        map.panTo(latLng, { animate: true });
      }
    }

    // Polyline for history trace
    if (historyPoints && historyPoints.length > 0) {
      const latLngs: L.LatLngExpression[] = historyPoints.map((p) => [p.latitude, p.longitude]);

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latLngs, {
          color: "#4f46e5",
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1,
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latLngs);
      }
    }
  }, [currentLocation, historyPoints, childName, autoCenter]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map && currentLocation) {
      map.setView([currentLocation.latitude, currentLocation.longitude], 17, { animate: true });
      setAutoCenter(true);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Floating Info Overlay */}
      {currentLocation ? (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-200/80 max-w-xs text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {childName}
            </span>
            <span className="text-slate-500 text-xs">
              {formatTimeAgo(currentLocation.timestamp)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 mt-2 border-t border-slate-100 pt-2 text-xs">
            <div>
              <span className="text-slate-400 block">Vitesse</span>
              <span className="font-semibold text-slate-800">
                {formatSpeed(currentLocation.speed)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Précision</span>
              <span className="font-semibold text-slate-800">
                ±{Math.round(currentLocation.accuracy || 10)} m
              </span>
            </div>
            {totalDistanceMeters > 0 && (
              <div className="col-span-2 mt-1">
                <span className="text-slate-400 block">Distance parcourue</span>
                <span className="font-semibold text-indigo-600">
                  {formatDistance(totalDistanceMeters)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-md border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-500 animate-spin" />
          En attente de la première position GPS...
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute bottom-5 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          title="Recentrer sur l'enfant"
          className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition active:scale-95 flex items-center justify-center"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom +"
          className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition active:scale-95 flex items-center justify-center"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom -"
          className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition active:scale-95 flex items-center justify-center"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

