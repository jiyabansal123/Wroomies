Wroomies 🏠💬

Wroomies is a college-focused roommate matching platform designed to help students find compatible roommates based on lifestyle preferences. Users sign in using their university email, complete a lifestyle questionnaire, and get matched with others who have similar habits and preferences. Once matched, users can connect and chat within the platform.

🚀 Features
🔐 Secure authentication using Azure Active Directory (university email login)
🧠 14-question lifestyle questionnaire to understand user preferences
🤝 Smart roommate matching based on compatibility scoring
💌 Match acceptance system for mutual connection
💬 Real-time chat between matched users
🎯 Clean and simple UI designed for student usability
🛠️ Tech Stack
Frontend: Next.js
Backend / Database: Supabase
Authentication: Azure Active Directory (Azure AD)
Real-time features: Supabase Realtime (for chat/matching updates)
⚙️ How It Works
Users log in using their university email via Azure AD
They complete a 14-question lifestyle questionnaire
The system calculates compatibility scores with other users
Users receive potential roommate matches
Both users can accept a match
Once matched, a chat room is unlocked for communication

🧠 Key Logic
Matching is based on a weighted score system derived from questionnaire responses
Higher similarity in lifestyle preferences increases match probability
Matches require mutual acceptance before chat is enabled
🔐 Authentication

Wroomies uses Azure Active Directory (Azure AD) to ensure only verified university students can access the platform.

📌 Future Improvements
Improve matching algorithm using ML-based recommendations
Add filters (budget, location, room type)
Mobile app version
Group roommate matching (more than 2 users)
👨‍💻 Author

Built by JB
If you like this project or want to collaborate, feel free to connect.
