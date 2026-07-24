"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { ListingFormData } from "../listing-types";
import { ListingForm } from "../listing-form";
import { SectionShell, secondaryButtonClass } from "../home-ui";

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <SectionShell title="Sign In Required" description="You need to sign in to create a listing.">
          <div className="text-center">
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Please sign in to post your room listing.
            </p>
            <Link href="/" className={secondaryButtonClass}>
              Go to Home
            </Link>
          </div>
        </SectionShell>
      </div>
    );
  }

  const handleSubmit = async (data: ListingFormData & { images: File[] }) => {
    setIsLoading(true);
    setError("");

    try {
      const userEmail = session.user?.email;
      if (!userEmail) {
        throw new Error("User email not found");
      }

      // Get user ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (userError || !userData?.id) {
        throw new Error("Could not fetch user profile");
      }

      const ownerId = userData.id;

      // Step 1: Insert listing
      console.log("[Step 1] Attempting to insert into room_listings table with owner_id:", ownerId);
      const { data: listingData, error: listingError } = await supabase
        .from("room_listings")
        .insert({
          owner_id: ownerId,
          title: data.title,
          description: data.description,
          property_type: data.property_type,
          address: data.address,
          distance_from_university: data.distance_from_university,
          rent_per_person: data.rent_per_person,
          security_deposit: data.security_deposit,
          bhk: data.bhk,
          vacant_beds: data.vacant_beds,
          gender_preference: data.gender_preference,
          electricity_included: data.electricity_included,
          food_included: data.food_included,
          wifi_available: data.wifi_available,
          ac_available: data.ac_available,
          attached_bathroom: data.attached_bathroom,
          in_time_restriction: data.in_time_restriction,
          immediate_move_in: data.immediate_move_in,
          is_active: true,
        })
        .select()
        .single();

      if (listingError || !listingData) {
        console.error("[Step 1 FAILED] room_listings insert error:", listingError);
        throw new Error(`Failed to create listing: ${listingError?.message}`);
      }
      console.log("[Step 1 SUCCESS] room_listings inserted with ID:", listingData.id);

      const listingId = listingData.id;

      // Step 2: Upload images via API route
      console.log("[Step 2] Starting image upload via API route");
      const imageUrls: string[] = [];
      
      if (data.images.length > 0) {
        const formData = new FormData();
        formData.append("listingId", listingId);
        
        for (const image of data.images) {
          formData.append("images", image);
        }
        
        try {
          const response = await fetch("/api/upload-listing-images", {
            method: "POST",
            body: formData,
          });
          
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("[Step 2 FAILED] API returned non-JSON response:", text);
            throw new Error("Server returned an invalid response. Please try again.");
          }
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error("[Step 2 FAILED] API upload error:", result);
            throw new Error(result.error || "Failed to upload images");
          }
          
          if (result.urls && Array.isArray(result.urls)) {
            imageUrls.push(...result.urls);
            console.log("[Step 2 SUCCESS] Images uploaded via API. URLs:", imageUrls);
          }
        } catch (uploadError) {
          console.error("[Step 2 FAILED] Upload API call failed:", uploadError);
          throw new Error("Failed to upload images. Please try again.");
        }
      } else {
        console.log("[Step 2] No images to upload");
      }

      // Step 3: Redirect to listings page
      router.push("/listings");
    } catch (err: any) {
      console.error("Create listing error:", err);
      setError(err?.message || "Failed to create listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
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
              Create Listing
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Post your room, PG, or flat for students
            </p>
          </div>
        </div>

        <SectionShell title="Property Details">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
          
          <ListingForm onSubmit={handleSubmit} isLoading={isLoading} />
        </SectionShell>
      </div>
    </div>
  );
}
