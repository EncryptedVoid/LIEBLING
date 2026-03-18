"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Place {
  placeId: string;
  name: string;
  address: string;
  mapsUrl: string;
}

interface LocationPickerProps {
  value?: Place | null;
  onChange: (place: Place | null) => void;
  apiKey: string;
}

// ── Global script loader (singleton) ─────────────────
let googleMapsPromise: Promise<void> | null = null;
let googleMapsLoaded = false;

function loadGoogleMaps(apiKey: string): Promise<void> {
  // Already loaded
  if (googleMapsLoaded || window.google?.maps?.places) {
    googleMapsLoaded = true;
    return Promise.resolve();
  }

  // Already loading
  if (googleMapsPromise) return googleMapsPromise;

  // Check if script tag already exists (e.g. from another component)
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );
  if (existingScript) {
    googleMapsPromise = new Promise<void>((resolve) => {
      existingScript.addEventListener("load", () => {
        googleMapsLoaded = true;
        resolve();
      });
      // If it's already loaded but we missed the event
      if (window.google?.maps?.places) {
        googleMapsLoaded = true;
        resolve();
      }
    });
    return googleMapsPromise;
  }

  if (!apiKey) {
    console.error("[LocationPicker] No Google Maps API key provided.");
    return Promise.reject(new Error("No API key"));
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.error("[LocationPicker] Failed to load Google Maps script.");
      googleMapsPromise = null;
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(script);
    // NOTE: We intentionally do NOT remove this script on cleanup.
    // Google Maps SDK should only load once and persist.
  });

  return googleMapsPromise;
}

export function LocationPicker({ value, onChange, apiKey }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService =
    useRef<google.maps.places.PlacesService | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Google Maps on mount
  useEffect(() => {
    if (!apiKey) {
      setLoadError("Google Maps API key is not configured.");
      console.error(
        "[LocationPicker] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or empty."
      );
      return;
    }

    loadGoogleMaps(apiKey)
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError("Could not load Google Maps. Check your API key.");
        console.error("[LocationPicker] Load error:", err);
      });
  }, [apiKey]);

  // Initialize services when loaded
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      try {
        autocompleteService.current =
          new google.maps.places.AutocompleteService();
        if (!dummyDiv.current) {
          dummyDiv.current = document.createElement("div");
        }
        placesService.current = new google.maps.places.PlacesService(
          dummyDiv.current
        );
      } catch (err) {
        console.error("[LocationPicker] Failed to init services:", err);
        setLoadError("Google Maps services failed to initialize.");
      }
    }
  }, [isLoaded]);

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchValue.trim() || !autocompleteService.current) {
      setPredictions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      autocompleteService.current!.getPlacePredictions(
        { input: searchValue },
        (results, status) => {
          setSearching(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(results);
          } else {
            setPredictions([]);
            if (
              status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              console.warn(
                "[LocationPicker] Autocomplete status:",
                status
              );
            }
          }
        }
      );
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  const handleSelectPrediction = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesService.current) {
        console.error("[LocationPicker] PlacesService not initialized.");
        return;
      }

      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["name", "formatted_address", "place_id"],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            const newPlace: Place = {
              placeId: place.place_id!,
              name: place.name!,
              address: place.formatted_address!,
              mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            };
            setSelectedPlace(newPlace);
            setPredictions([]);
            setSearchValue("");
          } else {
            console.warn("[LocationPicker] getDetails status:", status);
          }
        }
      );
    },
    []
  );

  const handleConfirm = () => {
    onChange(selectedPlace);
    setIsOpen(false);
    setSelectedPlace(null);
    setSearchValue("");
    setPredictions([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPlace(null);
    setSearchValue("");
    setPredictions([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Focus search input after dialog opens
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <div className="w-full">
      {/* Field Display */}
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 border rounded-lg bg-muted/20 min-h-[36px] flex items-center text-sm">
          {value ? (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs truncate">{value.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {value.address}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">
              No location selected
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          disabled={!!loadError}
        >
          <MapPin className="h-3 w-3 mr-1.5" />
          {value ? "Change" : "Select"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Error display */}
      {loadError && (
        <p className="text-[10px] text-destructive mt-1.5 flex items-center gap-1">
          {loadError}
        </p>
      )}

      {/* Embedded preview map */}
      {value && apiKey && (
        <div className="mt-3 rounded-lg overflow-hidden border h-[200px]">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${value.placeId}`}
          />
        </div>
      )}

      {/* Location search dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Select Location
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Search input */}
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search for a place, business, or address..."
                className="pr-8"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Not loaded warning */}
            {!isLoaded && !loadError && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading Google Maps...
              </div>
            )}

            {/* Predictions */}
            {predictions.length > 0 && (
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto scrollbar-thin">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    className="w-full px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="font-medium text-xs">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected place preview */}
            {selectedPlace && (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="font-medium text-xs text-primary">
                    {selectedPlace.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {selectedPlace.address}
                  </div>
                </div>
                {apiKey && (
                  <div className="rounded-lg overflow-hidden border h-[200px]">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${selectedPlace.placeId}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlace}
              className="btn-gradient"
            >
              Confirm Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}