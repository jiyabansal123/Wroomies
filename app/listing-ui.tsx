import Link from "next/link";
import Image from "next/image";

import { ListingWithImages } from "./listing-types";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--text-on-brand)] shadow-[0_12px_30px_rgba(240,96,79,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--panel-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]/40 hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const fieldClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

export function ListingCard({ listing }: { listing: ListingWithImages }) {
  const firstImage = listing.listing_images[0]?.image_url;
  const formattedRent = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(listing.rent_per_person);

  const genderBadgeColors: Record<string, string> = {
    Female: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    Male: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    Any: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div className="group block cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] shadow-[var(--card-shadow)] transition hover:-translate-y-1 hover:border-[var(--border-strong)]">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--panel)]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-full border border-[var(--border)] bg-[var(--panel)]/90 px-2.5 py-0.5 text-[10px] font-bold text-[var(--foreground)] backdrop-blur">
          {listing.property_type}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)] line-clamp-1">
            {listing.title}
          </h3>
          <div className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${genderBadgeColors[listing.gender_preference]}`}>
            {listing.gender_preference}
          </div>
        </div>

        <p className="mb-3 text-sm text-[var(--text-secondary)] line-clamp-2">
          {listing.address}
        </p>

        <div className="mb-4 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-[var(--foreground)]">
            <svg className="h-4 w-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{listing.vacant_beds} bed{listing.vacant_beds !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--foreground)]">
            <svg className="h-4 w-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{listing.bhk}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Rent per person
            </p>
            <p className="text-lg font-bold text-[var(--brand)]">
              {formattedRent}
            </p>
          </div>
          <Link
            href={`/listing/${listing.id}`}
            className={secondaryButtonClass}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
