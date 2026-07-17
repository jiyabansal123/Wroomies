# 🏠 Wroomies

Wroomies is an AI-powered roommate and accommodation matching platform built for university students.

The platform helps students find compatible roommates based on academic information and lifestyle preferences, while also allowing students to post and discover available rooms, beds, PGs, and flats around campus.

---

## ✨ Features

### 🤝 Smart Roommate Matching

Find potential roommates based on:

- Gender compatibility
- Academic year
- Course/branch

Wroomies first performs objective matching and then provides deeper compatibility analysis.

---

### 🧠 AI Lifestyle Compatibility Analysis

Powered by Groq LLMs.

The AI analyzes questionnaire responses and non-negotiables to generate:

- Compatibility Score
- Lifestyle Strengths
- Potential Conflicts
- Roommate Summary

Example insights:

- Sleep schedule compatibility
- Study habits
- Cleanliness standards
- Social preferences
- Guest preferences
- Shared living expectations

---

### 🏡 Room & Bed Listings

Students can post:

- PG vacancies
- Flat vacancies
- Vacant beds
- Independent rooms

Listing details include:

- Address
- Rent per person
- Security deposit
- BHK configuration
- Vacant beds
- Gender preference
- Move-in availability
- Amenities

---

### 📸 Image Uploads

Listings support multiple photos using Supabase Storage.

Users can upload room images and showcase their accommodation before receiving inquiries.

---

### 💬 Messaging System

Built-in messaging allows students to communicate directly within the platform.

No need to share personal contact information immediately.

---

### 🎓 University Verification

Students authenticate using university email accounts, ensuring a trusted and student-focused community.

---

## 🛠 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Supabase
- PostgreSQL

### AI

- Groq API
- LLM-based compatibility analysis

### Storage

- Supabase Storage

---

## 🗄 Database Design

### Users

Stores:

- Profile information
- Academic details
- Lifestyle preferences
- Room switching preferences

### Match Requests

Handles roommate requests and acceptance flow.

### Messages

Stores conversations between users.

### Room Listings

Stores:

- Property information
- Pricing
- Amenities
- Availability details

### Listing Images

Stores image URLs linked to listings.

---

## 🚀 How Matching Works

### Phase 1: Academic Matching

Candidates are shortlisted using:

1. Same Gender
2. Same Academic Year
3. Same Course

---

### Phase 2: AI Compatibility Analysis

The AI compares:

- Lifestyle preferences
- Daily routines
- Non-negotiables

and generates:

```json
{
  "compatibilityScore": 84,
  "strengths": [],
  "potentialConflicts": [],
  "summary": ""
}
