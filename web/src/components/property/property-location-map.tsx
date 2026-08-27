"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  Layers,
  Globe,
  Compass,
  Copy,
  Check,
  ExternalLink,
  Car,
  Utensils,
  Plane,
  Sparkles,
  ShieldCheck,
  LocateFixed,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function createEverloftGuestMarkerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "everloft-guest-map-pin",
    html: `
      <div style="position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.45); border-radius: 50%; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 38px; height: 38px; background: linear-gradient(135deg, #064e3b 0%, #047857 100%); border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 12px 24px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="transform: rotate(45deg); width: 11px; height: 11px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 8px rgba(251,191,36,0.9);"></div>
        </div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 48],
    popupAnchor: [0, -42],
  });
}

export function PropertyLocationMap({
  propertyName,
  address,
  area,
  city,
  state,
  country = "India",
  pinCode,
  latitude,
  longitude,
  googleMapsUrl,
}: {
  propertyName: string;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pinCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const streetLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const satelliteLayerRef = useRef<import("leaflet").TileLayer | null>(null);

  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Fallback coordinates if none provided
  const lat = latitude ?? (city?.toLowerCase().includes("goa") ? 15.5494 : city?.toLowerCase().includes("jaipur") ? 26.9124 : 12.9716);
  const lng = longitude ?? (city?.toLowerCase().includes("goa") ? 73.7535 : city?.toLowerCase().includes("jaipur") ? 75.7873 : 77.5946);

  const fullLocationString = [address, area, city, state, pinCode, country].filter(Boolean).join(", ");
  const mapsLink =
    googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${propertyName}, ${fullLocationString}`)}`;
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        maxZoom: 19,
        scrollWheelZoom: false,
      });

      // Street Layer (OpenStreetMap Standard)
      const streetLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

      // Marker
      const customIcon = createEverloftGuestMarkerIcon(L);
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(
        `<div style="font-family: inherit; padding: 6px;">
          <div style="font-weight: 700; color: #064e3b; font-size: 13px;">${propertyName}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${fullLocationString}</div>
          <div style="margin-top: 8px;">
            <a href="${directionsLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #047857; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-decoration: none;">Get Directions</a>
          </div>
        </div>`
      );

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, propertyName, fullLocationString, directionsLink]);

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

  function handleResetView() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
  }

  function toggleExpand() {
    setIsExpanded((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize({ animate: true });
    }, 250);
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(fullLocationString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section id="property-location" className="border-t border-border/80 pt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <MapPin className="h-4 w-4" />
            Location & Neighbourhood
          </div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Where You&apos;ll Be
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {[area, city, state].filter(Boolean).join(", ")} • Peaceful luxury neighborhood with seamless transit access
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="rounded-full text-xs h-8 gap-1.5 font-semibold"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Address Copied!" : "Copy Address"}
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
          >
            <a href={directionsLink} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5" />
              Get Directions
            </a>
          </Button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-border/80 shadow-lg bg-slate-900 w-full transition-all duration-300 ${
          isExpanded ? "h-[540px] sm:h-[620px]" : "h-[380px] sm:h-[460px]"
        }`}
      >
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Top-Right Glassmorphic Map Control Cluster */}
        <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-2.5 items-end">
          {/* Street / Satellite Segmented Pill Switcher */}
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

          {/* Dedicated Tactile Zoom & Center Controls */}
          <div className="flex flex-col rounded-2xl bg-background/95 p-1.5 shadow-lg backdrop-blur-md border border-border gap-1">
            {/* Zoom In Button */}
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

            {/* Zoom Out Button */}
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

            {/* Center on Property */}
            <button
              type="button"
              onClick={handleResetView}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
              title="Center on Property Pin"
              aria-label="Center on Property Pin"
            >
              <LocateFixed className="h-4 w-4" />
            </button>

            <div className="h-px w-full bg-border/80" />

            {/* Expand / Collapse Map Height */}
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

        {/* Bottom Floating Info Pill */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:right-auto z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-background/95 p-3.5 shadow-xl backdrop-blur-md border border-border max-w-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{propertyName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{fullLocationString}</p>
          </div>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline shrink-0"
          >
            Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Neighbourhood Highlights Grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Plane className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Airport & Transit Hubs</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Direct highway access, quick cab & metro connectivity.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Utensils className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Dining & Gourmet Cafes</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Top curated restaurants, coffee roasters & food delivery available.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">24/7 Gated Security</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Safe residential sanctuary with private parking and on-ground concierge.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
