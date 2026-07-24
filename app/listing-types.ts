export interface RoomListing {
  id: string;
  created_at: string;
  owner_id: string;
  title: string;
  description: string;
  property_type: "PG" | "Flat" | "Hostel" | "Independent Room";
  address: string;
  rent_per_person: number;
  security_deposit: number;
  bhk: string;
  vacant_beds: number;
  gender_preference: "Female" | "Male" | "Any";
  distance_from_university: string;
  electricity_included: boolean;
  food_included: boolean;
  wifi_available: boolean;
  ac_available: boolean;
  attached_bathroom: boolean;
  in_time_restriction: boolean;
  immediate_move_in: boolean;
  is_active: boolean;
}

export interface ListingImage {
  id: number;
  created_at: string;
  listing_id: string;
  image_url: string;
}

export interface ListingWithImages extends RoomListing {
  listing_images: ListingImage[];
}

export interface ListingOwner {
  id: string;
  name: string | null;
  email: string;
  course: string | null;
  year: number | null;
}

export interface ListingFormData {
  title: string;
  description: string;
  property_type: "PG" | "Flat" | "Hostel" | "Independent Room";
  address: string;
  rent_per_person: number;
  security_deposit: number;
  bhk: string;
  vacant_beds: number;
  gender_preference: "Female" | "Male" | "Any";
  distance_from_university: string;
  electricity_included: boolean;
  food_included: boolean;
  wifi_available: boolean;
  ac_available: boolean;
  attached_bathroom: boolean;
  in_time_restriction: boolean;
  immediate_move_in: boolean;
}

export type PropertyType = "PG" | "Flat" | "Hostel" | "Independent Room";
export type GenderPreference = "Female" | "Male" | "Any";
