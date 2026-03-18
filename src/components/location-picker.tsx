"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

export function LocationPicker({ value, onChange, apiKey }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [apiKey]);

  // Initialize services when loaded
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      dummyDiv.current = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv.current);
    }
  }, [isLoaded]);

  // Debounced search
  useEffect(() => {
    if (!searchValue.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.current!.getPlacePredictions(
        { input: searchValue },
        (results) => setPredictions(results || [])
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSelectPrediction = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["name", "formatted_address", "place_id"] },
      (place) => {
        if (place) {
          setSelectedPlace({
            placeId: place.place_id!,
            name: place.name!,
            address: place.formatted_address!,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          });
          setPredictions([]);
          setSearchValue("");
        }
      }
    );
  }, []);

  const handleConfirm = () => {
    onChange(selectedPlace);
    setIsOpen(false);
    setSelectedPlace(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPlace(null);
    setSearchValue("");
    setPredictions([]);
  };

  return (
    <div className="w-full">
      {/* Field Display */}
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 min-h-[42px] flex items-center">
          {value ? (
            <div className="flex-1">
              <div className="font-medium text-sm">{value.name}</div>
              <div className="text-xs text-gray-500 truncate">{value.address}</div>
            </div>
          ) : (
            <span className="text-gray-400">No location selected</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {value ? "Change" : "Select"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Preview */}
      {value && (
        <div className="mt-3 rounded-lg overflow-hidden border">
          <iframe
            width="100%"
            height="200"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${value.placeId}`}
          />
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Location</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl">
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search for a place, business, or address..."
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />

              {/* Predictions */}
              {predictions.length > 0 && (
                <ul className="mt-2 border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                  {predictions.map((prediction) => (
                    <li
                      key={prediction.place_id}
                      onClick={() => handleSelectPrediction(prediction)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium text-sm">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected Place Preview */}
            {selectedPlace && (
              <div className="px-4 pb-4 flex-1 overflow-hidden flex flex-col">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                  <div className="font-medium text-green-800">{selectedPlace.name}</div>
                  <div className="text-sm text-green-600">{selectedPlace.address}</div>
                </div>
                <div className="flex-1 rounded-lg overflow-hidden border min-h-[200px]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 200 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${selectedPlace.placeId}`}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedPlace}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}