"use client";

import { useEffect, useRef } from "react";

const SCRIPT_ID = "google-maps-places-locals";

let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      const done = () => {
        if (window.google?.maps?.places) resolve();
        else reject(new Error("Google Maps load failed"));
      };
      if (window.google?.maps?.places) {
        done();
        return;
      }
      existing.addEventListener("load", done);
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps load failed"))
      );
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error("Google Maps load failed"));
    };
    document.head.appendChild(s);
  });
  return mapsLoadPromise;
}

export type AddressPlaceResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  /** Suggested for `location_name` when that field is empty */
  nameOrShort: string | null;
};

type Props = {
  apiKey: string | undefined;
  value: string;
  onChange: (v: string) => void;
  onPlaceResolved: (p: AddressPlaceResult) => void;
  disabled?: boolean;
};

export function AddressAutocompleteField({
  apiKey,
  value,
  onChange,
  onPlaceResolved,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placeCallbackRef = useRef(onPlaceResolved);
  placeCallbackRef.current = onPlaceResolved;
  const changeCallbackRef = useRef(onChange);
  changeCallbackRef.current = onChange;

  useEffect(() => {
    if (!apiKey || !inputRef.current || disabled) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !inputRef.current) return;
        if (acRef.current) {
          google.maps.event.clearInstanceListeners(acRef.current);
        }
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name", "place_id"],
        });
        acRef.current = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (lat == null || lng == null) return;
          const formatted =
            place.formatted_address?.trim() ||
            (inputRef.current?.value ?? "").trim();
          changeCallbackRef.current(formatted);
          const name = place.name?.trim();
          const nameOrShort =
            name && name.length > 0
              ? name
              : (formatted.split(",")[0] ?? "").trim() || null;
          placeCallbackRef.current({
            lat,
            lng,
            formattedAddress: formatted,
            nameOrShort,
          });
        });
      } catch {
        /* script failed — fall back to plain text */
      }
    })();
    return () => {
      cancelled = true;
      if (acRef.current) {
        google.maps.event.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, [apiKey, disabled]);

  if (!apiKey) {
    return (
      <div className="flex flex-col gap-1.5 text-sm text-foreground/90">
        <span className="text-muted">Address</span>
        <input
          className="rounded-button border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          name="address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing an address…"
          disabled={disabled}
          autoComplete="street-address"
        />
        <p className="text-[11px] text-[#888880]">
          Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local to enable address
          autocomplete
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm text-foreground/90">
      <span className="text-muted">Address</span>
      <input
        ref={inputRef}
        className="rounded-button border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        name="address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing an address…"
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}
