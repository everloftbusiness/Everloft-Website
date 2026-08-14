"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  Layers,
  Globe,
  Copy,
  Check,
  LocateFixed,
  Building2,
  Clock,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function createOfficeMarkerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "everloft-office-map-pin",
    html: `
      <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 38px; height: 38px; background: linear-gradient(135deg, #064e3b 0%, #047857 100%); border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 12px 24px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="transform: rotate(45deg); width: 10px; height: 10px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 8px rgba(251,191,36,0.9);"></div>
        </div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 46],
    popupAnchor: [0, -40],
  });
}

export function ContactOfficeMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const streetLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const satelliteLayerRef = useRef<import("leaflet").TileLayer | null>(null);

  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [copied, setCopied] = useState(false);

  // Everloft Headquarters Coordinates (Kadavanthra, Kochi, Kerala)
  const officeLat = 9.9674;
  const officeLng = 76.2996;
  const addressString = "1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${officeLat},${officeLng}`;

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
        center: [officeLat, officeLng],
        zoom: 16,
        zoomControl: false,
        maxZoom: 19,
        scrollWheelZoom: false,
      });

      // Street Layer
      const streetLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
        }
      );

      // Satellite Layer
      const satelliteLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google Satellite Imagery",
        maxZoom: 20,
      });

      streetLayer.addTo(map);
      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;

      // Marker
      const icon = createOfficeMarkerIcon(L);
      const marker = L.marker([officeLat, officeLng], { icon }).addTo(map);

      marker.bindPopup(
        `<div style="font-family: inherit; padding: 4px;">
          <b style="color: #064e3b; font-size: 13px;">Everloft Headquarters</b><br/>
          <span style="color: #64748b; font-size: 11px;">${addressString}</span><br/>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 6px; background: #064e3b; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-decoration: none;">Get Directions</a>
        </div>`
      );

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
  }, [directionsUrl]);

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
    mapInstanceRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapInstanceRef.current?.zoomOut();
  }

  function handleResetView() {
    mapInstanceRef.current?.flyTo([officeLat, officeLng], 16, { duration: 1 });
  }

  function handleCopy() {
    navigator.clipboard.writeText(addressString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mt-16 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
            Headquarters & Operations Hub
          </div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Visit Our Office
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {addressString}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="rounded-full text-xs h-8 gap-1.5 font-semibold"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Address"}
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
          >
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5" />
              Get Directions
            </a>
          </Button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative h-[380px] sm:h-[440px] w-full overflow-hidden rounded-3xl border border-border shadow-xl bg-slate-900">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Top-Right Control Cluster */}
        <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-2.5 items-end">
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
              onClick={handleResetView}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-90"
              title="Center on Office"
              aria-label="Center on Office"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Info Pill */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:right-auto z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-background/95 p-3.5 shadow-xl backdrop-blur-md border border-border max-w-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Everloft Office HQ</p>
            <p className="text-[11px] text-muted-foreground truncate">Kadavanthra, Ernakulam, Kerala</p>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline shrink-0"
          >
            Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
