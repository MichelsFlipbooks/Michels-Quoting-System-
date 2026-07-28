"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript, type GoogleAutocomplete } from "@/lib/loadGoogleMaps";

export interface ParsedVenueAddress {
  formattedAddress: string;
  placeId: string;
  lat: number;
  lng: number;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
}

function getComponent(
  components: { long_name: string; short_name: string; types: string[] }[],
  type: string,
  useShortName = false,
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return useShortName ? match.short_name : match.long_name;
}

export function VenueAddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: ParsedVenueAddress) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("error");
      return;
    }

    let autocomplete: GoogleAutocomplete | undefined;
    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;

        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "address_components", "geometry", "place_id"],
          componentRestrictions: { country: "au" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          if (!place.geometry) return;

          const components = place.address_components ?? [];
          const streetNumber = getComponent(components, "street_number");
          const route = getComponent(components, "route");

          onSelect({
            formattedAddress: place.formatted_address ?? "",
            placeId: place.place_id ?? "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            streetAddress: [streetNumber, route].filter(Boolean).join(" "),
            suburb:
              getComponent(components, "locality") ||
              getComponent(components, "sublocality") ||
              getComponent(components, "administrative_area_level_2"),
            state: getComponent(components, "administrative_area_level_1", true),
            postcode: getComponent(components, "postal_code"),
          });
        });

        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      if (autocomplete && window.google) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={status === "loading" ? "Loading address search…" : "Start typing an address…"}
      />
      {status === "error" && (
        <p className="mt-1 text-xs text-red-700">
          Address autocomplete unavailable — you can still type the address manually.
        </p>
      )}
    </div>
  );
}
