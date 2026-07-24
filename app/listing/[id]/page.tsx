"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { supabase } from "@/lib/supabase";
import { ListingWithImages, ListingOwner } from "../../listing-types";
import { SectionShell, secondaryButtonClass, primaryButtonClass } from "../../home-ui";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [owner, setOwner] = useState<ListingOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");

  const listingId = params.id as string;

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const fetchListing = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch listing with images
      const { data: listingData, error: listingError } = await supabase
        .from("room_listings")
        .select(`
          *,
          listing_images (
            id,
            image_url
          )
        `)
        .eq("id", listingId)
        .eq("is_active", true)
        .single();

      if (listingError || !listingData) {
        throw new Error(listingError?.message || "Listing not found");
      }

      const listingWithImages: ListingWithImages = {
        ...listingData,
        listing_images: listingData.listing_images || [],
      };

      console.log("Fetched listing with images:", {
        listingId,
        imageCount: listingWithImages.listing_images.length,
        images: listingWithImages.listing_images,
      });

      setListing(listingWithImages);

      // Fetch owner information
      const { data: ownerData, error: ownerError } = await supabase
        .from("users")
        .select("id, name, email, course, year")
        .eq("id", listingData.owner_id)
        .single();

      if (ownerError) {
        console.error("Owner fetch error:", ownerError);
      } else {
        setOwner(ownerData as ListingOwner);
      }
    } catch (err: any) {
      console.error("Fetch listing error:", err);
      setError(err?.message || "Failed to load listing");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageOwner = async () => {
    if (!owner || !session?.user?.email) return;

    const currentUserEmail = session.user.email;
    
    // Prevent users from messaging themselves
    if (currentUserEmail === owner.email) {
      setError("You cannot message yourself.");
      return;
    }

    setIsMessaging(true);
    setError("");
    setMessageSuccess("");

    try {
      // Check if conversation already exists
      const { data: existingMessages, error: checkError } = await supabase
        .from("messages")
        .select("id")
        .or(`and(sender_email.eq.${currentUserEmail},receiver_email.eq.${owner.email}),and(sender_email.eq.${owner.email},receiver_email.eq.${currentUserEmail})`)
        .limit(1);

      if (checkError) {
        throw new Error("Failed to check existing conversation.");
      }

      // If conversation exists, just redirect to chat
      if (existingMessages && existingMessages.length > 0) {
        router.push(`/?chat=${owner.email}`);
        return;
      }

      // Create starter message
      const starterMessage = "Hi! I saw your room listing and I'm interested. Is the room/bed still available?";
      
      const { error: insertError } = await supabase
        .from("messages")
        .insert({
          sender_email: currentUserEmail,
          receiver_email: owner.email,
          content: starterMessage,
        });

      if (insertError) {
        throw new Error("Failed to start conversation: " + insertError.message);
      }

      // Show success message
      setMessageSuccess("Conversation started.");
      setTimeout(() => setMessageSuccess(""), 3000);

      // Redirect to chat
      setTimeout(() => {
        router.push(`/?chat=${owner.email}`);
      }, 500);
    } catch (err: any) {
      console.error("Message owner error:", err);
      setError(err?.message || "Failed to start conversation");
    } finally {
      setIsMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <SectionShell title="Error" description={error || "Listing not found"}>
          <div className="text-center">
            <Link href="/listings" className={secondaryButtonClass}>
              Back to Listings
            </Link>
          </div>
        </SectionShell>
      </div>
    );
  }

  const formattedRent = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(listing.rent_per_person);

  const formattedDeposit = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(listing.security_deposit);

  const amenities = [
    { label: "Electricity Included", value: listing.electricity_included },
    { label: "Food Included", value: listing.food_included },
    { label: "WiFi Available", value: listing.wifi_available },
    { label: "AC Available", value: listing.ac_available },
    { label: "Attached Bathroom", value: listing.attached_bathroom },
    { label: "Immediate Move In", value: listing.immediate_move_in },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/listings"
            className="rounded-full border border-[var(--border)] bg-[var(--panel-muted)] p-2 hover:border-[var(--border-strong)]"
          >
            <svg className="h-5 w-5 text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              {listing.title}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {listing.property_type} • {listing.address}
            </p>
          </div>
        </div>

        {/* Toast Notifications */}
        {messageSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <p className="text-sm text-emerald-400">{messageSuccess}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Image Gallery */}
        {listing.listing_images.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
            <div className="relative aspect-[16/9]">
              <img
                src={listing.listing_images[currentImageIndex]?.image_url}
                alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                className="h-full w-full object-cover"
              />
              {listing.listing_images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? listing.listing_images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-[var(--panel)]/90 p-2 text-[var(--foreground)] backdrop-blur hover:bg-[var(--panel-muted)]"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === listing.listing_images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[var(--panel)]/90 p-2 text-[var(--foreground)] backdrop-blur hover:bg-[var(--panel-muted)]"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {listing.listing_images.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 w-2 rounded-full transition ${
                          index === currentImageIndex ? "bg-[var(--brand)]" : "bg-[var(--text-muted)]"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <SectionShell title="Property Details">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{listing.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{listing.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Property Type
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{listing.property_type}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Gender Preference
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{listing.gender_preference}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      BHK
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{listing.bhk}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Vacant Beds
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{listing.vacant_beds}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Distance from University
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{listing.distance_from_university}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-soft)]">
                      Rent Per Person
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--brand)]">{formattedRent}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Security Deposit
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{formattedDeposit}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{listing.address}</p>
                </div>
              </div>
            </SectionShell>

            {/* Amenities */}
            <SectionShell title="Amenities">
              <div className="grid gap-3 md:grid-cols-2">
                {amenities.map((amenity) => (
                  <div
                    key={amenity.label}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      amenity.value
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-[var(--border)] bg-[var(--panel-muted)] opacity-50"
                    }`}
                  >
                    {amenity.value ? (
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm text-[var(--foreground)]">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </SectionShell>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <SectionShell title="Owner Information">
              {owner ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--brand)] flex items-center justify-center text-[var(--text-on-brand)] font-bold text-lg">
                      {owner.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{owner.name || "Unknown"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {owner.course && `Year ${owner.year} • ${owner.course}`}
                      </p>
                    </div>
                  </div>
                  
                  {session && session.user?.email !== owner.email && (
                    <button
                      onClick={handleMessageOwner}
                      disabled={isMessaging}
                      className={`${secondaryButtonClass} w-full ${isMessaging ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isMessaging ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
                          Opening Chat...
                        </span>
                      ) : (
                        "Message Owner"
                      )}
                    </button>
                  )}
                  
                  {!session && (
                    <Link href="/" className={`${secondaryButtonClass} block w-full text-center`}>
                      Sign In to Contact
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Owner information not available</p>
              )}
            </SectionShell>

            {/* Additional Info */}
            {listing.in_time_restriction && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  Note
                </p>
                <p className="text-sm text-[var(--foreground)]">
                  This property has time restrictions for entry.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
