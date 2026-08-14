"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, ZoomIn, ZoomOut, Search, Loader2, Sparkles, X, Layers, Globe, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchLocationSuggestionsAction, type LocationSuggestion } from "@/features/properties/actions/onboarding.actions";

export type Coordinates = {
  lat: number;
  lng: number;
};

// Luxury Everloft Custom HTML Marker Icon for Leaflet
function createEverloftMarkerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "everloft-custom-map-pin",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.45); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 32px; height: 32px; background: linear-gradient(135deg, #065f46 0%, #047857 100%); border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 10px 20px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="transform: rotate(45deg); width: 8px; height: 8px; background: #fbbf24; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 40],
    popupAnchor: [0, -36],
  });
}

export function InteractiveLocationMap({
  lat,
  lng,
  onPositionChange,
  propertyName,
}: {
  lat: number | null;
  lng: number | null;
  onPositionChange: (coords: { lat: number; lng: number }) => void;
  propertyName?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const streetLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const satelliteLayerRef = useRef<import("leaflet").TileLayer | null>(null);

  const [mapType, setMapType] = useState<"streets" | "satellite">("satellite"); // Default to high-res satellite
  const [isMapReady, setIsMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default coordinates: Bangalore (12.9716, 77.5946) if none provided
  const currentLat = lat ?? 12.9715987;
  const currentLng = lng ?? 77.5945627;

  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Dynamically import leaflet
      const L = await import("leaflet");

      // Inject Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: lat && lng ? 17 : 14,
        zoomControl: false,
        maxZoom: 20,
      });

      // 1. Street Layer (CartoDB Voyager)
      const streetLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 19,
      });

      // 2. High-Resolution Satellite Layer with Hybrid Labels (Google Satellite Hybrid)
      const satelliteLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Satellite Imagery',
        maxZoom: 20,
      });

      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;

      // Add default layer based on initial state (Satellite)
      satelliteLayer.addTo(map);

      // Create Custom Draggable Marker
      const customIcon = createEverloftMarkerIcon(L);
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
        autoPan: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px 6px;">
          <strong style="color: #065f46; font-size: 13px;">${propertyName || "Property Location"}</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Drag this pin or click anywhere on the map to fine-tune location.</p>
        </div>
      `);

      // Event: Marker dragged
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onPositionChange({ lat: Number(position.lat.toFixed(6)), lng: Number(position.lng.toFixed(6)) });
      });

      // Event: Map clicked
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onPositionChange({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsMapReady(true);

      // Trigger size invalidation after mount to ensure crisp tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between Street View and Satellite View
  const toggleMapType = useCallback((type: "streets" | "satellite") => {
    setMapType(type);
    if (!mapInstanceRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;

    if (type === "satellite") {
      mapInstanceRef.current.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(mapInstanceRef.current);
    }
  }, []);

  // Update marker & pan map when lat/lng props change from external auto-detect
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

    mapInstanceRef.current.invalidateSize();
    const currentMarkerPos = markerRef.current.getLatLng();
    if (Math.abs(currentMarkerPos.lat - lat) > 0.00005 || Math.abs(currentMarkerPos.lng - lng) > 0.00005) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
    }
  }, [lat, lng, isMapReady]);

  // Debounced Live Search Suggestions
  const handleQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    setNoResultsFound(false);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocationSuggestionsAction(value, currentLat, currentLng);
        setSuggestions(results);
        setShowSuggestions(true);
        setNoResultsFound(results.length === 0);
      } catch {
        setSuggestions([]);
        setNoResultsFound(true);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  }, [currentLat, currentLng]);

  function handleSelectSuggestion(suggestion: LocationSuggestion) {
    if (!mapInstanceRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([suggestion.lat, suggestion.lng]);
    mapInstanceRef.current.setView([suggestion.lat, suggestion.lng], 17, { animate: true });
    onPositionChange({ lat: suggestion.lat, lng: suggestion.lng });
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function handleSearchSubmit() {
    if (!searchQuery.trim() || !mapInstanceRef.current || !markerRef.current) return;

    // If suggestions are currently visible, pick the top one
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    setIsSearching(true);
    setNoResultsFound(false);
    try {
      const results = await searchLocationSuggestionsAction(searchQuery, currentLat, currentLng);
      if (results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setNoResultsFound(true);
        setShowSuggestions(true);
      }
    } catch {
      setNoResultsFound(true);
      setShowSuggestions(true);
    } finally {
      setIsSearching(false);
    }
  }

  function handleRecenter() {
    if (mapInstanceRef.current && lat && lng) {
      mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
    }
  }

  function handleZoomIn() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  }

  function handleZoomOut() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  }

  return (
    <div className="relative overflow-visible rounded-2xl border border-border bg-slate-950 shadow-md">
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <MapPin className="h-4 w-4" />
            <span>Interactive Location Pin</span>
          </div>

          {/* Map Layer Switcher Tabs: Satellite vs Streets */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-white/15 p-0.5">
            <button
              type="button"
              onClick={() => toggleMapType("satellite")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mapType === "satellite"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => toggleMapType("streets")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mapType === "streets"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MapIcon className="h-3 w-3" />
              <span>Street Map</span>
            </button>
          </div>
        </div>

        {/* Quick Search on Map with Autocomplete Dropdown */}
        <div className="relative flex items-center gap-1.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Indian area, locality..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0 || noResultsFound) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchSubmit();
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              className="h-7 w-48 sm:w-60 rounded-lg bg-slate-900 border border-white/15 px-2.5 pr-7 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {isSearching ? (
              <Loader2 className="absolute right-2 top-1.5 h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Search className="absolute right-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
            )}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isSearching || !searchQuery.trim()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchSubmit();
            }}
            className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Go
          </Button>

          {/* Autocomplete Suggestions Menu (India Filtered + Proximity Sorted) */}
          {showSuggestions && (
            <div className="absolute right-0 top-9 z-[1000] w-72 sm:w-84 rounded-xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-xl p-1 text-xs">
              {suggestions.length > 0 ? (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>🇮🇳 Nearby Suggestions</span>
                    <span className="text-[9px] text-emerald-400 font-normal">Sorted by proximity</span>
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors group"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-100 truncate group-hover:text-emerald-300">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.distanceLabel && (
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 shrink-0 ml-1">
                          {item.distanceLabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : noResultsFound ? (
                <div className="p-3 text-center text-slate-300 space-y-1.5">
                  <p className="font-semibold text-amber-400 flex items-center justify-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Specific building not on open map
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Try searching locality name (e.g. <em>Bettadasanapura, Electronic City, Bangalore</em>) or paste the Google Maps share link above for 100% pinpoint accuracy!
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative aspect-[21/10] w-full min-h-[300px] bg-slate-900 overflow-hidden rounded-b-2xl">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Floating Custom Controls */}
        <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter pin"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 text-white border border-white/20 shadow-md backdrop-blur hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Navigation className="h-4 w-4 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 text-white border border-white/20 shadow-md backdrop-blur hover:bg-slate-800 active:scale-95 transition-all"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 text-white border border-white/20 shadow-md backdrop-blur hover:bg-slate-800 active:scale-95 transition-all"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* Coordinates Badge */}
        {lat !== null && lng !== null && (
          <div className="absolute bottom-4 left-4 z-[400] rounded-lg bg-slate-950/85 px-3 py-1.5 text-xs font-mono text-emerald-400 backdrop-blur-md border border-white/10 shadow-md flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
