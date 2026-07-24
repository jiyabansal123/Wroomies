import { useState } from "react";

import { ListingFormData, PropertyType, GenderPreference } from "./listing-types";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "./listing-ui";

interface ListingFormProps {
  onSubmit: (data: ListingFormData & { images: File[] }) => Promise<void>;
  isLoading?: boolean;
}

export function ListingForm({ onSubmit, isLoading = false }: ListingFormProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    property_type: "PG",
    address: "",
    rent_per_person: 0,
    security_deposit: 0,
    bhk: "",
    vacant_beds: 1,
    gender_preference: "Any",
    distance_from_university: "",
    electricity_included: false,
    food_included: false,
    wifi_available: false,
    ac_available: false,
    attached_bathroom: false,
    in_time_restriction: false,
    immediate_move_in: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleInputChange = (field: keyof ListingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert("You can upload up to 5 images");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData, images });
  };

  const propertyTypes: PropertyType[] = ["PG", "Flat", "Hostel", "Independent Room"];
  const genderPreferences: GenderPreference[] = ["Female", "Male", "Any"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Basic Information</h3>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Title *
          </label>
          <input
            type="text"
            required
            className={fieldClass}
            placeholder="e.g., Spacious PG near campus"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Description *
          </label>
          <textarea
            required
            rows={4}
            className={fieldClass}
            placeholder="Describe your property..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Property Type *
          </label>
          <select
            required
            className={fieldClass}
            value={formData.property_type}
            onChange={(e) => handleInputChange("property_type", e.target.value as PropertyType)}
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Address *
          </label>
          <input
            type="text"
            required
            className={fieldClass}
            placeholder="Full address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Distance from University *
          </label>
          <input
            type="text"
            required
            className={fieldClass}
            placeholder="e.g., 2 km, 5 mins walk"
            value={formData.distance_from_university}
            onChange={(e) => handleInputChange("distance_from_university", e.target.value)}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Pricing</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Rent Per Person (₹) *
            </label>
            <input
              type="number"
              required
              min={0}
              className={fieldClass}
              placeholder="5000"
              value={formData.rent_per_person || ""}
              onChange={(e) => handleInputChange("rent_per_person", parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Security Deposit (₹) *
            </label>
            <input
              type="number"
              required
              min={0}
              className={fieldClass}
              placeholder="10000"
              value={formData.security_deposit || ""}
              onChange={(e) => handleInputChange("security_deposit", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Property Details</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              BHK *
            </label>
            <input
              type="text"
              required
              className={fieldClass}
              placeholder="e.g., 1BHK, 2BHK"
              value={formData.bhk}
              onChange={(e) => handleInputChange("bhk", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Vacant Beds *
            </label>
            <input
              type="number"
              required
              min={1}
              className={fieldClass}
              placeholder="1"
              value={formData.vacant_beds || ""}
              onChange={(e) => handleInputChange("vacant_beds", parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Gender Preference *
          </label>
          <select
            required
            className={fieldClass}
            value={formData.gender_preference}
            onChange={(e) => handleInputChange("gender_preference", e.target.value as GenderPreference)}
          >
            {genderPreferences.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Amenities</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleSwitch
            label="Electricity Included"
            checked={formData.electricity_included}
            onChange={(checked) => handleInputChange("electricity_included", checked)}
          />
          <ToggleSwitch
            label="Food Included"
            checked={formData.food_included}
            onChange={(checked) => handleInputChange("food_included", checked)}
          />
          <ToggleSwitch
            label="WiFi Available"
            checked={formData.wifi_available}
            onChange={(checked) => handleInputChange("wifi_available", checked)}
          />
          <ToggleSwitch
            label="AC Available"
            checked={formData.ac_available}
            onChange={(checked) => handleInputChange("ac_available", checked)}
          />
          <ToggleSwitch
            label="Attached Bathroom"
            checked={formData.attached_bathroom}
            onChange={(checked) => handleInputChange("attached_bathroom", checked)}
          />
          <ToggleSwitch
            label="In Time Restriction"
            checked={formData.in_time_restriction}
            onChange={(checked) => handleInputChange("in_time_restriction", checked)}
          />
          <ToggleSwitch
            label="Immediate Move In"
            checked={formData.immediate_move_in}
            onChange={(checked) => handleInputChange("immediate_move_in", checked)}
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Images (up to 5)
        </h3>
        
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            disabled={images.length >= 5}
          />
          <label
            htmlFor="image-upload"
            className={`${secondaryButtonClass} inline-flex items-center gap-2 cursor-pointer ${images.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Images
          </label>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {images.length}/5 images uploaded
          </p>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover border border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className={`${primaryButtonClass} flex-1`}
        >
          {isLoading ? "Creating Listing..." : "Create Listing"}
        </button>
      </div>
    </form>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            checked ? "bg-[var(--brand)]" : "bg-[var(--border)]"
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </div>
      </div>
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  );
}
