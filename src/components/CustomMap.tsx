"use client";

import React, { useEffect, useRef } from "react";
import { TouristPoint } from "../data/mockData";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CustomMapProps {
  points: TouristPoint[];
  selectedPoint: TouristPoint | null;
  onSelectPoint: (point: TouristPoint) => void;
}

export default function CustomMap({ points, selectedPoint, onSelectPoint }: CustomMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center of Governador Valadares
    const gvCenter: L.LatLngExpression = [-18.8582, -41.9485];
    
    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: gvCenter,
      zoom: 13,
      zoomControl: false, // Custom position or disabled for mobile-first layout
      attributionControl: false,
    });

    // Premium clean tile layer: CartoDB Positron (perfect match for our off-white design system)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and handle selections
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add new markers
    points.forEach((point) => {
      const isSelected = selectedPoint?.id === point.id;

      // Custom DOM Icon matching the orange brand design system exactly
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex items-center justify-center">
            ${isSelected ? '<span class="absolute w-12 h-12 rounded-full bg-brand/20 animate-ping"></span>' : ""}
            <div class="w-9 h-9 rounded-full bg-brand border-2 border-white flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-95 ${
              isSelected ? "scale-110 ring-4 ring-brand/20" : ""
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="absolute top-10 bg-white border border-gray-100/80 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm whitespace-nowrap pointer-events-none ${
              isSelected ? "text-brand scale-100" : "text-text-main opacity-70 scale-95"
            }">
              ${point.name}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([point.coords.lat, point.coords.lng], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          onSelectPoint(point);
        });

      markersRef.current[point.id] = marker;
    });
  }, [points, selectedPoint, onSelectPoint]);

  // Fly to selected point if changed from outside (e.g. SearchBar or QRCodeScanner)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoint) return;

    map.flyTo([selectedPoint.coords.lat, selectedPoint.coords.lng], 15, {
      animate: true,
      duration: 1.5,
    });
  }, [selectedPoint]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden select-none">
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
}
