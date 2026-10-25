'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, CheckCircle2, Loader2, Search, ExternalLink } from 'lucide-react';

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}

interface VenueLocationPickerProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  required?: boolean;
}

const POPULAR_VENUES = [
  { name: 'Lodhi Gardens, New Delhi', lat: 28.5931, lng: 77.2197 },
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Sunder Nursery, Delhi', lat: 28.5952, lng: 77.2458 },
  { name: 'DLF CyberHub, Gurugram', lat: 28.4952, lng: 77.0894 },
  { name: 'Hauz Khas Fort, New Delhi', lat: 28.5534, lng: 77.1945 },
];

export const VenueLocationPicker: React.FC<VenueLocationPickerProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch geocoding search suggestions with debounce
  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSuggestions(data.results);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Geocoding search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPlace = (item: any) => {
    const selectedAddress = item.address || item.text;
    setQuery(selectedAddress);
    setShowDropdown(false);
    const newCoords = { lat: item.latitude, lng: item.longitude };
    setCoords(newCoords);
    onChange(selectedAddress, newCoords);
  };

  const handleSelectPreset = (venue: typeof POPULAR_VENUES[0]) => {
    setQuery(venue.name);
    setShowDropdown(false);
    const newCoords = { lat: venue.lat, lng: venue.lng };
    setCoords(newCoords);
    onChange(venue.name, newCoords);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geocoding?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          const address = data.address || `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setQuery(address);
          const newCoords = { lat: latitude, lng: longitude };
          setCoords(newCoords);
          onChange(address, newCoords);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not detect location. Please check browser location permissions or type address manually.');
      },
      { timeout: 8000 }
    );
  };

  const mapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    '';

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary">
          Shoot Venue / Location Address
        </label>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14B8A6] hover:text-[#E05D00] transition-colors"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3" />
              <span>Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Address Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
          <MapPin className="w-4 h-4 text-[#14B8A6]" />
        </div>
        <input
          type="text"
          value={query}
          required={required}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value, coords || undefined);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="e.g. Lodhi Gardens, New Delhi or Client Studio..."
          className="w-full pl-9 pr-10 py-2.5 bg-white text-ink-primary text-xs sm:text-sm font-medium rounded-xl border border-contour-subtle focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-contour-subtle rounded-xl shadow-xl overflow-hidden divide-y divide-contour-subtle/50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-[#F5F7F9] text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3" />
            <span>Matching Verified Locations</span>
          </div>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPlace(item)}
              className="w-full text-left px-3 py-2.5 hover:bg-[#F5F7F9] text-xs transition-colors flex items-start gap-2.5 group"
            >
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-primary truncate">{item.text || item.address}</p>
                <p className="text-[11px] text-ink-muted truncate">{item.address}</p>
              </div>
              {item.city && (
                <span className="shrink-0 text-[10px] font-medium bg-[#191C22]/5 text-ink-secondary px-2 py-0.5 rounded-full">
                  {item.city}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Popular Shoot Hotspots Presets */}
      <div className="pt-1">
        <p className="text-[10px] text-ink-muted mb-1 font-medium">Quick Shoot Hotspots:</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_VENUES.map((venue) => (
            <button
              key={venue.name}
              type="button"
              onClick={() => handleSelectPreset(venue)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                coords && Math.abs(coords.lat - venue.lat) < 0.001
                  ? 'bg-[#14B8A6] text-white border-[#14B8A6] font-semibold'
                  : 'bg-[#F5F7F9] hover:bg-white text-ink-secondary border-contour-subtle hover:border-[#14B8A6]'
              }`}
            >
              {venue.name.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Venue Map Card Preview */}
      {coords && (
        <div className="mt-3 rounded-xl overflow-hidden border border-contour-subtle bg-white shadow-sm">
          <div className="p-2.5 bg-[#F5F7F9] border-b border-contour-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Geocoded GPS Venue Coordinates</span>
            </div>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-contour-subtle text-ink-muted">
              {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </span>
          </div>

          {/* Interactive Map Tile or Static Vector Map */}
          <div className="relative w-full h-36 bg-[#E8E2D9] overflow-hidden">
            {mapboxToken ? (
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s-camera+ff6e00(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},14,0/600x240?access_token=${mapboxToken}`}
                alt="Venue Location Map"
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe
                title="Venue Map Preview"
                width="100%"
                height="100%"
                src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                className="border-0 w-full h-full"
                loading="lazy"
              />
            )}

            {/* Overlay badge with pin label */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-md border border-contour-subtle flex items-center gap-1.5 text-[11px] font-semibold text-ink-primary max-w-[85%]">
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span className="truncate">{query || 'Confirmed Shoot Venue'}</span>
            </div>

            {/* Open in Google Maps External Link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white text-ink-muted hover:text-[#14B8A6] shadow-sm border border-contour-subtle transition-all"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
