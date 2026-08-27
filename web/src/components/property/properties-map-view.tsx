"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Layers,
  Globe,
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Minimize2,
  Sparkles,
  BedDouble,
  Users,
  Bath,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PublicPropertyListItem } from "@/features/properties/types/property.types";

function getCityCoordinates(city: string | null | undefined, index = 0): [number, number] {
  const c = (city || "").toLowerCase();
  let baseLat = 12.9716;
  let baseLng = 77.5946;

  if (c.includes("goa") || c.includes("gokarna")) {
    baseLat = 15.2993;
    baseLng = 74.1240;
  } else if (c.includes("jaipur") || c.includes("rajasthan")) {
    baseLat = 26.9124;
    baseLng = 75.7873;
  } else if (c.includes("mumbai") || c.includes("lonavala") || c.includes("alibaug")) {
    baseLat = 18.7557;
    baseLng = 73.4091;
  } else if (c.includes("udaipur")) {
    baseLat = 24.5854;
    baseLng = 73.7125;
  } else if (c.includes("kerala") || c.includes("alappuzha") || c.includes("kochi") || c.includes("munnar")) {
    baseLat = 9.9312;
    baseLng = 76.2673;
  } else if (c.includes("delhi") || c.includes("gurgaon")) {
    baseLat = 28.6139;
    baseLng = 77.2090;
  }

  // Slight deterministic spread if multiple properties share same city fallback
  const offsetLat = (Math.sin(index * 1.5) * 0.025);
  const offsetLng = (Math.cos(index * 1.5) * 0.025);
  return [baseLat + offsetLat, baseLng + offsetLng];
}

function createPropertyPriceMarkerIcon(
  L: typeof import("leaflet"),
  priceLabel: string,
  propertyName: string
) {
  return L.divIcon({
    className: "everloft-property-price-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: #064e3b; color: #ffffff; padding: 5px 10px; border-radius: 9999px; font-family: inherit; font-size: 11px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 8px 18px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
          <span style="display: inline-block; width: 6px; height: 6px; background: #fbbf24; border-radius: 50%;"></span>
          <span>${priceLabel}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #064e3b; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [110, 36],
    iconAnchor: [55, 36],
    popupAnchor: [0, -38],
  });
}

export function PropertiesMapView({ properties }: { properties: PublicPropertyListItem[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const streetLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const satelliteLayerRef = useRef<import("leaflet").TileLayer | null>(null);

  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeProperty, setActiveProperty] = useState<PublicPropertyListItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = await import("leaflet");

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Determine initial center and bounds
      const coordinatesList: [number, number][] = properties.map((p, idx) => {
        if (p.latitude && p.longitude) return [p.latitude, p.longitude];
        return getCityCoordinates(p.city, idx);
      });

      const initialCenter: [number, number] = coordinatesList.length > 0 ? coordinatesList[0] : [12.9716, 77.5946];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        maxZoom: 19,
        scrollWheelZoom: true,
      });

      // Street Layer (CartoDB Voyager)
      const streetLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
        }
      );

      // Satellite Layer (Esri World Imagery HD Satellite)
      const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      });

      streetLayer.addTo(map);
      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;

      // Add markers for all properties
      const markerGroup = L.featureGroup();

      properties.forEach((property, idx) => {
        const [pLat, pLng] = property.latitude && property.longitude
          ? [property.latitude, property.longitude]
          : getCityCoordinates(property.city, idx);

        const priceLabel = property.nightlyPrice
          ? `${formatCurrency(property.nightlyPrice, property.currency)}`
          : "On Request";

        const icon = createPropertyPriceMarkerIcon(L, priceLabel, property.name);
        const marker = L.marker([pLat, pLng], { icon });

        // Interactive Popup Card
        const popupContent = `
          <div style="font-family: inherit; width: 230px; border-radius: 14px; overflow: hidden; box-shadow: none;">
            ${property.coverImageUrl ? `
              <div style="position: relative; width: 100%; height: 110px; background: #0f172a; overflow: hidden;">
                <img src="${property.coverImageUrl}" alt="${property.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700;">
                  ${property.typeName || "Luxury Stay"}
                </div>
              </div>
            ` : ""}
            <div style="padding: 10px 12px; background: #ffffff;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                ${property.name}
              </h4>
              <p style="margin: 3px 0 6px 0; font-size: 11px; color: #64748b;">
                ${[property.area, property.city].filter(Boolean).join(", ")}
              </p>
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 6px;">
                <div>
                  <span style="font-size: 13px; font-weight: 800; color: #064e3b;">${priceLabel}</span>
                  <span style="font-size: 10px; color: #64748b;"> / nt <b style="color: #047857;">+ GST</b></span>
                </div>
                <a href="/properties/${property.slug}" style="display: inline-flex; align-items: center; gap: 4px; background: #064e3b; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 9999px; text-decoration: none;">
                  View →
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 230, className: "everloft-map-popup" });
        marker.addTo(markerGroup);
      });

      markerGroup.addTo(map);

      // Fit bounds to show all pins if multiple
      if (coordinatesList.length > 1) {
        map.fitBounds(markerGroup.getBounds(), { padding: [40, 40], maxZoom: 14 });
      }

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [properties]);

  function switchMapType(type: "streets" | "satellite") {
    if (!mapInstanceRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;
    setMapType(type);
    if (type === "streets") {
      mapInstanceRef.current.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(mapInstanceRef.current);
    }
  }

  function handleZoomIn() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1, { animate: true });
  }

  function handleZoomOut() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1, { animate: true });
  }

  function handleFitAll() {
    if (!mapInstanceRef.current || properties.length === 0) return;
    const L = (window as unknown as { L: typeof import("leaflet") }).L;
    if (!L) return;
    const bounds = L.latLngBounds(
      properties.map((p, idx) => {
        if (p.latitude && p.longitude) return [p.latitude, p.longitude];
        return getCityCoordinates(p.city, idx);
      })
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
  }

  function toggleExpand() {
    setIsExpanded((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize({ animate: true });
    }, 250);
  }

  if (properties.length === 0) {
    return (
      <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <MapPin className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <p className="font-serif text-lg font-bold text-foreground">No properties found on map</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Try resetting your filters or selecting another city to see available curated stays.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border/80 shadow-xl bg-slate-900 transition-all duration-300 ${
        isExpanded ? "h-[640px] sm:h-[760px]" : "h-[480px] sm:h-[580px]"
      }`}
    >
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Top-Right Glassmorphic Map Control Cluster */}
      <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-2.5 items-end">
        {/* Streets / Satellite Switcher */}
        <div className="flex items-center rounded-2xl bg-background/95 p-1 shadow-lg backdrop-blur-md border border-border">
          <button
            type="button"
            onClick={() => switchMapType("streets")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              mapType === "streets"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Streets</span>
          </button>
          <button
            type="button"
            onClick={() => switchMapType("satellite")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              mapType === "satellite"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Satellite</span>
          </button>
        </div>

        {/* Dedicated Tactile Controls */}
        <div className="flex flex-col rounded-2xl bg-background/95 p-1.5 shadow-lg backdrop-blur-md border border-border gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </button>

          <div className="h-px w-full bg-border/80" />

          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="h-4 w-4 stroke-[2.5]" />
          </button>

          <div className="h-px w-full bg-border/80" />

          <button
            type="button"
            onClick={handleFitAll}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
            title="Fit All Properties"
            aria-label="Fit All Properties"
          >
            <LocateFixed className="h-4 w-4" />
          </button>

          <div className="h-px w-full bg-border/80" />

          <button
            type="button"
            onClick={toggleExpand}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
            title={isExpanded ? "Collapse Map Height" : "Expand Map Height"}
            aria-label={isExpanded ? "Collapse Map Height" : "Expand Map Height"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend Pill */}
      <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-2 rounded-2xl bg-background/95 px-3.5 py-2 shadow-xl backdrop-blur-md border border-border">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-foreground">
          {properties.length} {properties.length === 1 ? "Property" : "Properties"} on Map
        </span>
        <span className="text-[11px] text-muted-foreground">· Click pins to preview & book</span>
      </div>
    </div>
  );
}
