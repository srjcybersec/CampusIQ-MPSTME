# Academic OS - AI-Powered Campus Intelligence System

A production-grade Education Technology web platform designed as an AI-powered academic operating system for college students. This is a student-first, daily-use, minimalist, and intelligence-driven platform.

## 🎯 Core Features

### 1. Academics
- **Explain the Rule**: AI-powered contextual explanations of academic rules (UFM, Attendance, Passing Criteria)
- **PYQ Analyzer**: Analyze previous year questions for patterns and trends
- **Academic Decision Explainer**: Understand academic decisions with contextual reasoning

### 2. Schedule
- Unified academic timeline view
- Lecture timings with room numbers
- Assignment reminders
- Exam schedules integration

### 3. Campus
- Empty Space Intelligence (find available classrooms)
- Library conference room booking
- Daily canteen menu updates

### 4. Resources
- Notes uploader and organizer
- Assignment management with submission tracking
- Previous Year Question repository with AI analysis

### 5. Community
- Live event discovery
- Anonymous confessions page

### 6. Services
- College FAQs
- Railway concession form booking
- ID card & lanyard request management

### 7. Extras
- Experimental features (e.g., CGPA-based matchmaking)

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **AI**: Google Gemini API
- **Scheduling**: Google Calendar API (planned)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GDG_Hackathon_MVP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Firebase and Gemini API credentials.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Firebase Setup

**📖 For detailed step-by-step instructions with exact mouse clicks, see: [`FIREBASE_SETUP_GUIDE.md`](./FIREBASE_SETUP_GUIDE.md)**

Quick steps:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your Firebase config values to `.env`

## 🤖 Gemini API Setup

**📖 For detailed step-by-step instructions with exact mouse clicks, see: [`GEMINI_API_SETUP_GUIDE.md`](./GEMINI_API_SETUP_GUIDE.md)**

Quick steps:
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to `.env` as `NEXT_PUBLIC_GEMINI_API_KEY`

## ✅ Setup Verification

**📋 Use the checklist to verify your setup: [`QUICK_START_CHECKLIST.md`](./QUICK_START_CHECKLIST.md)**

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── academics/         # Academics section
│   ├── schedule/          # Schedule section
│   ├── campus/            # Campus section
│   ├── resources/         # Resources section
│   ├── community/         # Community section
│   ├── services/          # Services section
│   ├── extras/            # Extras section
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # UI components (buttons, cards, etc.)
│   └── navigation/       # Navigation components
├── lib/                  # Utility libraries
│   ├── firebase/         # Firebase configuration
│   ├── gemini/           # Gemini API client
│   ├── auth/             # Authentication context
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## 🎨 Design Principles

- **Minimal**: Clean, uncluttered interface
- **Premium**: Soft shadows, neutral colors
- **Calm**: Fast, non-overwhelming transitions
- **Mobile-first**: Responsive design for all devices

## 🔐 Privacy & Data

- No unnecessary personal data collection
- No emotion detection
- No mental health diagnosis
- Transparent AI explanations

## 📝 Development Notes

- Write clean, modular, readable code
- Use reusable components
- Keep AI prompts centralized
- Comment WHY something exists, not WHAT

## 🚧 Roadmap

- [ ] Complete Firebase integration
- [ ] Google Calendar API integration
- [ ] Full PYQ analyzer implementation
- [ ] Assignment management system
- [ ] Room booking system
- [ ] Content moderation for confessions
- [ ] Analytics dashboard (BigQuery + Looker Studio)

## 📄 License

This project is created for GDG Hackathon MVP.

## 🤝 Contributing

This is a hackathon project. Contributions and suggestions are welcome!
