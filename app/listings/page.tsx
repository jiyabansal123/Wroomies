"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { ListingWithImages } from "../listing-types";
import { ListingCard } from "../listing-ui";
import { SectionShell, secondaryButtonClass } from "../home-ui";

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [rentMin, setRentMin] = useState<number | "">("");
  const [rentMax, setRentMax] = useState<number | "">("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [genderPreference, setGenderPreference] = useState<string>("");
  const [immediateMoveIn, setImmediateMoveIn] = useState(false);
  const [bhkTypes, setBhkTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<string>("");
  const [occupancyType, setOccupancyType] = useState<string>("");

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, rentMin, rentMax, propertyTypes, genderPreference, immediateMoveIn, bhkTypes, amenities, distanceFilter, occupancyType]);

  const applyFilters = () => {
    let filtered = [...listings];

    // Rent range filter
    if (rentMin !== "") {
      filtered = filtered.filter((listing) => listing.rent_per_person >= (rentMin as number));
    }
    if (rentMax !== "") {
      filtered = filtered.filter((listing) => listing.rent_per_person <= (rentMax as number));
    }

    // Property type filter
    if (propertyTypes.length > 0) {
      filtered = filtered.filter((listing) => propertyTypes.includes(listing.property_type));
    }

    // Gender preference filter
    if (genderPreference) {
      filtered = filtered.filter((listing) => listing.gender_preference === genderPreference);
    }

    // Immediate move-in filter
    if (immediateMoveIn) {
      filtered = filtered.filter((listing) => listing.immediate_move_in === true);
    }

    // BHK type filter
    if (bhkTypes.length > 0) {
      filtered = filtered.filter((listing) => bhkTypes.includes(listing.bhk));
    }

    // Amenities filter
    if (amenities.length > 0) {
      filtered = filtered.filter((listing) => {
        if (amenities.includes("wifi") && !listing.wifi_available) return false;
        if (amenities.includes("ac") && !listing.ac_available) return false;
        if (amenities.includes("food") && !listing.food_included) return false;
        if (amenities.includes("electricity") && !listing.electricity_included) return false;
        if (amenities.includes("bathroom") && !listing.attached_bathroom) return false;
        return true;
      });
    }

    // Distance filter
    if (distanceFilter) {
      filtered = filtered.filter((listing) => {
        const distanceText = listing.distance_from_university.toLowerCase();
        if (distanceFilter === "1km" && !distanceText.includes("1")) return false;
        if (distanceFilter === "2km" && !distanceText.includes("2")) return false;
        if (distanceFilter === "5km" && !distanceText.includes("5")) return false;
        return true;
      });
    }

    // Occupancy type filter
    if (occupancyType) {
      filtered = filtered.filter((listing) => {
        const occupancyText = (listing as any).occupancy_type?.toLowerCase() || "";
        return occupancyText === occupancyType.toLowerCase();
      });
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setRentMin("");
    setRentMax("");
    setPropertyTypes([]);
    setGenderPreference("");
    setImmediateMoveIn(false);
    setBhkTypes([]);
    setAmenities([]);
    setDistanceFilter("");
    setOccupancyType("");
  };

  const fetchListings = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("room_listings")
        .select(`
          *,
          listing_images (
            id,
            image_url
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (listingsError) {
        throw new Error(listingsError.message);
      }

      const listingsWithImages: ListingWithImages[] = (listingsData || []).map((listing: any) => ({
        ...listing,
        listing_images: listing.listing_images || [],
      }));

      setListings(listingsWithImages);
    } catch (err: any) {
      console.error("Fetch listings error:", err);
      setError(err?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBhkType = (type: string) => {
    setBhkTypes((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) => 
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[var(--border)] bg-[var(--panel-muted)] p-2 hover:border-[var(--border-strong)]"
          >
            <svg className="h-5 w-5 text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Room Listings
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Browse available rooms, PGs, and flats from students
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-8 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[var(--brand)] hover:underline"
                >
                  Clear all
                </button>
              </div>

              {/* Rent Range */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Rent Range (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={rentMin}
                    onChange={(e) => setRentMin(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={rentMax}
                    onChange={(e) => setRentMax(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Property Type
                </label>
                <div className="space-y-2">
                  {["PG", "Flat", "Hostel", "Independent Room"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propertyTypes.includes(type)}
                        onChange={() => togglePropertyType(type)}
                        className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender Preference */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Gender Preference
                </label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              {/* Immediate Move-in */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={immediateMoveIn}
                    onChange={(e) => setImmediateMoveIn(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel)] text-[var(--brand)] focus:ring-[var(--brand)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">Immediate Move-in</span>
                </label>
              </div>

              {/* BHK Type */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  BHK Type
                </label>
                <div className="space-y-2">
                  {["1BHK", "2BHK", "3BHK", "4BHK", "Studio"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bhkTypes.includes(type)}
                        onChange={() => toggleBhkType(type)}
                        className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Amenities
                </label>
                <div className="space-y-2">
                  {[
                    { id: "wifi", label: "WiFi Available" },
                    { id: "ac", label: "AC Available" },
                    { id: "food", label: "Food Included" },
                    { id: "electricity", label: "Electricity Included" },
                    { id: "bathroom", label: "Attached Bathroom" },
                  ].map((amenity) => (
                    <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={amenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance from University */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Distance from University
                </label>
                <select
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                >
                  <option value="">Any</option>
                  <option value="1km">Upto 1km</option>
                  <option value="2km">Upto 2km</option>
                  <option value="5km">Upto 5km</option>
                </select>
              </div>

              {/* Occupancy Type */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Occupancy Type
                </label>
                <select
                  value={occupancyType}
                  onChange={(e) => setOccupancyType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                >
                  <option value="">Any</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Shared">Shared</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            <SectionShell title={`Available Accommodations (${filteredListings.length})`}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
                    <p className="text-sm text-[var(--text-muted)]">Loading listings...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={fetchListings}
                    className={`mt-4 ${secondaryButtonClass}`}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--panel-muted)] p-12 text-center">
                  <svg className="mb-4 h-12 w-12 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-lg font-medium text-[var(--foreground)]">No listings found</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Try adjusting your filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className={`mt-4 ${secondaryButtonClass}`}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </SectionShell>
          </div>
        </div>
      </div>
    </div>
  );
}
