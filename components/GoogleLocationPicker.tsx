
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

type SelectedLocation = {
  latitude: number;
  longitude: number;
  placeId: string | null;
};

type PlaceSuggestion = {
  placePrediction?: google.maps.places.PlacePrediction;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onLocationChange: (location: SelectedLocation | null) => void;
  disabled?: boolean;
};

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser environment required."));
  }

  // FIX: Check the Maps namespace, not importLibrary itself.
  if (
    typeof window.google !== "undefined" &&
    typeof window.google.maps !== "undefined"
  ) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      googleMapsPromise = null;
      reject(new Error("Google Maps API key is missing."));
      return;
    }

    const script = document.createElement("script");

    script.id = "google-maps-api";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      "&v=weekly&libraries=marker";

    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (
        typeof window.google !== "undefined" &&
        typeof window.google.maps !== "undefined"
      ) {
        resolve();
      } else {
        googleMapsPromise = null;
        reject(new Error("Google Maps loaded incorrectly."));
      }
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Google Maps failed to load."));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function GoogleLocationPicker({
  value,
  onChange,
  onLocationChange,
  disabled = false,
}: Props) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const markerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const disabledRef = useRef(disabled);

  const callbacksRef = useRef({ onChange, onLocationChange });

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [pinConfirmed, setPinConfirmed] = useState(false);

  const [searchText, setSearchText] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingPlace, setSelectingPlace] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    callbacksRef.current = { onChange, onLocationChange };
  }, [onChange, onLocationChange]);

  // Keep the search field synchronized with the booking address.
  useEffect(() => {
    setSearchText(value);
  }, [value]);

  // Load map and marker once.
  useEffect(() => {
    let cancelled = false;
    let mapClickListener: google.maps.MapsEventListener | null = null;

    async function initializeMap() {
      try {
        await loadGoogleMaps();

        if (cancelled || !mapElementRef.current) return;

        const [mapsLibrary, markerLibrary] = await Promise.all([
          window.google.maps.importLibrary(
            "maps"
          ) as Promise<google.maps.MapsLibrary>,

          window.google.maps.importLibrary(
            "marker"
          ) as Promise<google.maps.MarkerLibrary>,
        ]);

        if (cancelled || !mapElementRef.current) return;

        const map = new mapsLibrary.Map(mapElementRef.current, {
          center: { lat: 30.0444, lng: 31.2357 },
          zoom: 11,
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        mapRef.current = map;
        geocoderRef.current = new window.google.maps.Geocoder();

        const pin = document.createElement("div");
        pin.style.width = "25px";
        pin.style.height = "25px";
        pin.style.borderRadius = "50% 50% 50% 0";
        pin.style.background = "#79538d";
        pin.style.border = "3px solid white";
        pin.style.boxShadow = "0 3px 12px rgba(35,15,45,0.3)";
        pin.style.transform = "rotate(-45deg)";

        const marker = new markerLibrary.AdvancedMarkerElement({
          map,
          position: undefined,
          title: "Appointment location",
          gmpDraggable: true,
          content: pin,
        });

        markerRef.current = marker;

        async function confirmPin(
          latitude: number,
          longitude: number,
          placeId: string | null = null,
          knownAddress?: string
        ) {
          if (disabledRef.current) return;

          marker.position = { lat: latitude, lng: longitude };
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(Math.max(map.getZoom() || 15, 15));

          setPinConfirmed(true);
          setSearchError("");
          setSuggestions([]);
          setShowSuggestions(false);

          callbacksRef.current.onLocationChange({
            latitude,
            longitude,
            placeId,
          });

          if (knownAddress) {
            callbacksRef.current.onChange(knownAddress);
            setSearchText(knownAddress);
            return;
          }

          try {
            const result = await geocoderRef.current?.geocode({
              location: { lat: latitude, lng: longitude },
            });

            const address = result?.results?.[0]?.formatted_address;

            if (address) {
              callbacksRef.current.onChange(address);
              setSearchText(address);
            } else {
              setSearchError(
                "We couldn't find an address for this pin. Try moving it slightly."
              );
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            setSearchError(
              "Could not retrieve the address. Please try again."
            );
          }
        }

      mapClickListener = map.addListener(
  "click",
  (event: google.maps.MapMouseEvent) => {
    if (disabledRef.current || !event.latLng) return;

    void confirmPin(event.latLng.lat(), event.latLng.lng());
  }
);

        marker.addEventListener("gmp-dragend", () => {
          if (disabledRef.current) return;

          const position = marker.position;
          if (!position) return;

          const latitude =
            typeof (position as google.maps.LatLng).lat === "function"
              ? (position as google.maps.LatLng).lat()
              : (position as google.maps.LatLngLiteral).lat;

          const longitude =
            typeof (position as google.maps.LatLng).lng === "function"
              ? (position as google.maps.LatLng).lng()
              : (position as google.maps.LatLngLiteral).lng;

          void confirmPin(latitude, longitude);
        });

        setMapReady(true);
      } catch (error) {
        console.error("GOOGLE MAP ERROR:", error);

        if (!cancelled) {
          setMapError(
            error instanceof Error
              ? error.message
              : "Unable to load Google Maps."
          );
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      if (mapClickListener && window.google?.maps?.event) {
        window.google.maps.event.removeListener(mapClickListener);
      }

      mapRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
    };
  }, []);

  // Search Google Places as the bride types.
  useEffect(() => {
    if (!mapReady || disabled || searchText.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);
        setSearchError("");

        const placesLibrary = (await window.google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const response =
          await placesLibrary.AutocompleteSuggestion
            .fetchAutocompleteSuggestions({
              input: searchText,
              includedRegionCodes: ["eg"],
            });

        if (cancelled) return;

        setSuggestions(
          response.suggestions.filter(
            (item) => !!item.placePrediction
          ) as PlaceSuggestion[]
        );

        setShowSuggestions(true);
      } catch (error) {
        console.error("Places search error:", error);

        if (!cancelled) {
          setSuggestions([]);
          setSearchError(
            "Address search is unavailable. You can still select a location on the map."
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchText, mapReady, disabled]);

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    if (disabled || !suggestion.placePrediction) return;

    try {
      setSelectingPlace(true);
      setShowSuggestions(false);
      setSearchError("");

      const place = suggestion.placePrediction.toPlace();

      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "id"],
      });

      if (!place.location) {
        throw new Error("Location details were not available.");
      }

      const address =
        place.formattedAddress ||
        place.displayName?.toString() ||
        searchText;

      const latitude = place.location.lat();
      const longitude = place.location.lng();

      const map = mapRef.current;
      const marker = markerRef.current;

      if (map && marker) {
        marker.position = { lat: latitude, lng: longitude };
        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(16);
      }

      setPinConfirmed(true);
      setSuggestions([]);
      setSearchText(address);

      onChange(address);

      onLocationChange({
        latitude,
        longitude,
        placeId: place.id || null,
      });
    } catch (error) {
      console.error("Place selection error:", error);
      setSearchError(
        "We couldn't select that address. Please try another result."
      );
    } finally {
      setSelectingPlace(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative z-20">
        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.13em] text-[#806f85]">
          Search your address
        </label>

        <div className="flex items-center gap-3 rounded-2xl border border-[#eadff5] bg-white px-4 py-3 shadow-sm focus-within:border-purple-400">
          {searching || selectingPlace ? (
            <Loader2
              size={19}
              className="shrink-0 animate-spin text-purple-700"
            />
          ) : (
            <Search size={19} className="shrink-0 text-purple-700" />
          )}

          <input
            type="text"
            value={searchText}
            disabled={disabled}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => {
              setSearchText(event.target.value);
              setShowSuggestions(true);
              setPinConfirmed(false);
              onLocationChange(null);
            }}
            placeholder="Search street, area, building..."
            className="w-full bg-transparent text-sm text-[#403445] outline-none placeholder:text-[#a99bad] disabled:opacity-60"
          />

          {searchText && !disabled && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSuggestions([]);
                setPinConfirmed(false);
                onChange("");
                onLocationChange(null);
              }}
              className="shrink-0 text-[#806f85] hover:text-purple-700"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#eadff5] bg-white py-2 shadow-xl">
            {suggestions.map((suggestion, index) => {
              const prediction = suggestion.placePrediction;

              if (!prediction) return null;

              return (
                <button
                  key={`${prediction.text}-${index}`}
                  type="button"
                  disabled={disabled || selectingPlace}
                  onClick={() => void selectSuggestion(suggestion)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#faf5ff]"
                >
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-purple-700"
                  />

                  <span className="text-sm leading-5 text-[#403445]">
                    {prediction.text.toString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {searchError && (
          <p className="mt-2 text-xs leading-5 text-red-600">
            {searchError}
          </p>
        )}

        {searchText.trim().length > 0 &&
          searchText.trim().length < 3 && (
            <p className="mt-2 text-xs text-[#806f85]">
              Type at least 3 characters to search.
            </p>
          )}
      </div>

      {/* Selected address */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.13em] text-[#806f85]">
          Appointment address
        </p>

        <div className="flex items-start gap-3 rounded-2xl border border-[#eadff5] bg-[#fffafc] p-4">
          <MapPin size={19} className="mt-0.5 shrink-0 text-purple-700" />

          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-[#403445]">
              {value || "No address selected yet"}
            </p>

            <p className="mt-1 text-xs leading-5 text-[#806f85]">
              Select a search result or move the pin on the map to confirm
              your exact appointment location.
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-[1.5rem] border border-[#eadff5] bg-[#f7efff]">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-[#493553]">
              Pin your exact location
            </p>

            <p className="mt-1 text-xs text-[#806f85]">
              Search for your address, tap the map, or drag the pin to your
              entrance.
            </p>
          </div>

          <MapPin size={20} className="shrink-0 text-purple-700" />
        </div>

        <div className="relative">
          <div
            ref={mapElementRef}
            className="h-[350px] w-full bg-[#f4edf6]"
          />

          {!mapReady && !mapError && (
            <div className="absolute inset-0 grid place-items-center bg-[#fffafc]/90">
              <div className="text-center">
                <Loader2
                  size={25}
                  className="mx-auto animate-spin text-purple-700"
                />

                <p className="mt-3 text-xs text-[#806f85]">
                  Loading map...
                </p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 grid place-items-center bg-[#fffafc] px-6 text-center">
              <div>
                <MapPin size={25} className="mx-auto text-purple-700" />

                <p className="mt-3 text-sm font-medium text-[#403445]">
                  Map unavailable
                </p>

                <p className="mt-2 text-xs leading-5 text-[#806f85]">
                  {mapError}
                </p>
              </div>
            </div>
          )}

          {disabled && (
            <div className="absolute inset-0 cursor-not-allowed bg-white/30" />
          )}
        </div>

        <div className="px-4 py-4">
          {pinConfirmed ? (
            <p className="flex items-center gap-2 text-xs font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Exact location selected
            </p>
          ) : (
            <p className="text-xs leading-5 text-[#806f85]">
              {mapReady
                ? "Search for your address or tap anywhere on the map to place your pin."
                : "Your map will appear here."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
