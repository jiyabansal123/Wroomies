import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 * 1024 * 1024 bytes

/**
 * Validates an image file
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
function validateImageFile(file: File): string | null {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 5MB`;
  }

  return null;
}

/**
 * Generates a unique filename for an image
 * @param originalName - Original filename
 * @param listingId - ID of the listing
 * @returns Unique filename
 */
function generateUniqueFilename(originalName: string, listingId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split(".").pop();
  return `${listingId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * POST handler for image uploads
 * Accepts multipart/form-data with multiple image files
 * Returns array of public URLs
 */
export async function POST(request: NextRequest) {
  console.log("ALL ENV:", {
    SUPABASE_URL: process.env.SUPABASE_URL,
    HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_KEY_START: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10),
  })
  
  console.log("Upload route hit!");
  
  // Initialize client INSIDE the handler so env vars are guaranteed to load
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars:", { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey 
    });
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse form data
    const formData = await request.formData();
    const listingId = formData.get("listingId") as string;

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
        { status: 400 }
      );
    }

    // Get all files from form data
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key === "images" && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Validate all files
    const validationErrors: string[] = [];
    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Upload each image to Supabase Storage
    const uploadedUrls: string[] = [];
    const uploadErrors: string[] = [];

    for (const file of files) {
      try {
        const filename = generateUniqueFilename(file.name, listingId);
        const fileBuffer = await file.arrayBuffer();

        // Upload to storage using Service Role Key (bypasses RLS)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("listing_images")
          .upload(filename, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          uploadErrors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // Generate public URL
        const { data: publicUrlData } = supabase.storage
          .from("listing_images")
          .getPublicUrl(filename);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        uploadErrors.push(`${file.name}: ${errorMessage}`);
      }
    }

    // Insert image URLs into listing_images table
    if (uploadedUrls.length > 0) {
      const { error: insertError } = await supabase
        .from("listing_images")
        .insert(
          uploadedUrls.map((url) => ({
            listing_id: listingId,
            image_url: url,
          }))
        );

      if (insertError) {
        console.error("Failed to insert image URLs into database:", insertError);
        return NextResponse.json(
          {
            error: "Images uploaded but failed to save to database",
            details: insertError.message,
            urls: uploadedUrls,
          },
          { status: 500 }
        );
      }
    }

    // Return results
    if (uploadErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Some uploads failed",
          details: uploadErrors,
          urls: uploadedUrls,
        },
        { status: 207 } // Multi-status: partial success
      );
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage },
      { status: 500 }
    );
  }
}
