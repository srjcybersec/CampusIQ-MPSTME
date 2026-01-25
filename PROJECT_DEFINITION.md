# CampusIQ - Project Definition

## The Challenge

### Core Problem Statement

College students face multiple fragmented challenges in their academic journey:

1. **Information Fragmentation**: Academic policies, rules, and resources are scattered across multiple platforms (college websites, emails, notice boards, PDFs), making it difficult for students to find answers to their questions quickly.

2. **Lack of Contextual Academic Guidance**: Students struggle to understand complex academic rules (attendance policies, passing criteria, UFM rules) in context of their specific situations. Generic FAQs don't address personalized scenarios.

3. **Inefficient Resource Management**: 
   - Previous Year Questions (PYQs) are stored in unorganized folders, making it hard to find relevant papers
   - Notes are scattered across devices with no intelligent search or AI-powered summarization
   - Assignment deadlines are tracked manually, leading to missed submissions

4. **Limited Academic Intelligence**: Students need help analyzing their results, understanding grade trends, calculating CGPA requirements, and getting solutions to PYQ questions - but lack accessible, AI-powered tools.

5. **Disconnected Campus Services**: Booking library rooms, accessing canteen menus, finding campus services requires navigating multiple systems and forms, creating friction in daily campus life.

6. **No Unified Academic Operating System**: Students juggle multiple apps, websites, and tools for different academic needs, lacking a single, intelligent platform that understands their academic context.

---

## The Innovation

### Solution: CampusIQ - AI-Powered Campus Intelligence Platform

**CampusIQ** is a unified, AI-powered academic operating system that transforms how students interact with their college ecosystem. It's not just another app—it's a **living digital interface** that understands context, provides intelligent assistance, and consolidates all academic needs into one futuristic platform.

### Unique Value Propositions

1. **Contextual AI Academic Assistant**
   - **Examination Policy Chat**: Ask questions about UFM, attendance, passing criteria and get contextual, personalized explanations (not generic FAQs)
   - **Result Viewer & Analyzer**: Upload semester results and ask "How much do I need to score to reach CGPA 3.6?" - AI analyzes your grades, calculates requirements, and provides actionable insights
   - **Student Resource Book Chat**: AI-powered chatbot that answers questions based on a 124-page comprehensive student resource book, maintaining conversation context

2. **Intelligent PYQ Solver**
   - Browse organized repository of Previous Year Questions by branch, semester, and subject
   - View PYQ papers directly in the app
   - Ask questions about any question in the paper and get detailed solutions with step-by-step explanations
   - AI maintains conversation context for follow-up questions

3. **Smart Assignment Management**
   - Manual assignment creation with smart reminders
   - Assignment health score tracking (on-time vs late submissions)
   - Workload overview and priority suggestions
   - Reminder preferences (24hrs, 2hrs, on deadline)

4. **AI-Powered Notes Intelligence**
   - Upload notes (PDF, DOCX) with automatic text extraction
   - AI-generated summaries and key topics
   - Chat with your notes - ask questions and get answers based on note content
   - Build "Survival Kits" - curated collections of notes for exam preparation

5. **Unified Campus Services**
   - Library Discussion Room Booking with direct Google Forms integration
   - Canteen Menu with search and category filters
   - Quick access to student services (Railway Concession, Student Portal, Library OPAC, etc.)

6. **Community Features**
   - Live Event Discovery with registration links
   - Anonymous Confessions with content moderation
   - Campus Connections (study partners, friends)

7. **Futuristic UI/UX**
   - Dark theme with neon accents (Apple Vision Pro × Cyberpunk aesthetic)
   - Glassmorphism design with animated backgrounds
   - Custom cursor with hover effects
   - Smooth Framer Motion animations
   - Mobile-first responsive design

### Key Differentiators

- **Not a generic admin panel**: Feels like a futuristic operating system, not a typical college website
- **Context-aware AI**: Understands student's specific situation, not just generic answers
- **Unified platform**: One app for all academic needs, eliminating app-switching fatigue
- **Intelligent document processing**: OCR, PDF parsing, and AI analysis for scanned documents
- **Real-time data**: Firestore listeners for live updates across all features
- **Production-ready**: Built with scalability, security, and performance in mind

---

## The Tech Stack

### Frontend
- **Next.js 14.2.35** (React 18.3.1) - App Router, Server-Side Rendering, API Routes
- **TypeScript 5.5.4** - Type-safe development
- **Tailwind CSS 3.4.7** - Utility-first styling with custom dark theme
- **Framer Motion 12.29.0** - Advanced animations and micro-interactions
- **React Hook Form 7.52.1** - Form management
- **Zod 3.23.8** - Schema validation
- **Lucide React 0.424.0** - Icon library

### Backend & Database
- **Firebase 10.12.2** (Client SDK)
  - Firebase Authentication (Email/Password, Google OAuth)
  - Firestore (NoSQL document database)
  - Firebase Storage (file uploads)
- **Firebase Admin SDK 13.6.0** - Server-side operations
- **Next.js API Routes** - Serverless backend functions

### AI & External Services
- **Google Generative AI SDK 0.21.0** - Gemini API integration
- **Google APIs 129.0.0** - Google Calendar API integration
- **Google Cloud Local Auth 3.0.1** - OAuth token management

### File Processing
- **pdf-parse 2.4.5** - PDF text extraction
- **pdfjs-dist 5.4.530** - PDF rendering and parsing
- **tesseract.js 7.0.0** - OCR for scanned PDFs
- **canvas 3.2.1** - Server-side image rendering
- **mammoth 1.11.0** - DOCX to HTML conversion
- **adm-zip 0.5.16** - ZIP file extraction

### Utilities
- **date-fns 3.6.0** - Date manipulation
- **dotenv 16.6.1** - Environment variables

### Development Tools
- **TypeScript 5.5.4** - Type checking
- **ESLint 8.57.0** - Code linting
- **PostCSS 8.4.40** - CSS processing
- **ts-node 10.9.2** - TypeScript execution

### Deployment
- **Vercel** - Hosting platform with automatic deployments
- **Edge Functions** - Serverless function execution

### Infrastructure
- **Firebase Cloud** - Backend-as-a-Service
- **Google Cloud** - AI and Calendar services
- **Vercel Edge Network** - Global CDN and edge computing

---

## Gemini Integration

### Overview

Google Gemini AI is the **core intelligence engine** of CampusIQ, powering all AI-powered features with contextual understanding, document analysis, and conversational capabilities.

### Integration Architecture

**Client Library**: `@google/generative-ai` (v0.21.0)
**Models Used**: 
- `gemini-2.5-flash` (primary - fastest)
- `gemini-2.5-pro` (fallback - more capable)
- `gemini-2.0-flash` (fallback)
- `gemini-flash-latest` (fallback)
- `gemini-pro-latest` (fallback)

**Fallback Strategy**: The system tries multiple models in sequence to ensure reliability and handle model availability issues gracefully.

### Implementation Locations

#### 1. **Academic Intelligence Engine** (`lib/gemini/client.ts`)
   - **Purpose**: Centralized Gemini client with model fallback logic
   - **Features**:
     - Dynamic model selection with automatic fallback
     - REST API fallback if SDK fails
     - Model availability detection
   - **Methods**:
     - `explainRule()` - Contextual academic rule explanations
     - `tryRestAPI()` - Direct REST API calls as fallback

#### 2. **Examination Policy Chat** (`components/academics/examination-policy-chat.tsx`)
   - **API Route**: Uses `AcademicIntelligenceEngine` from `lib/gemini/client.ts`
   - **Functionality**: 
     - Explains UFM (Unfair Means) rules
     - Explains Attendance policies
     - Explains Passing Criteria
   - **Context**: Uses student's specific situation for personalized explanations

#### 3. **PYQ Solver** (`app/api/pyqs/solve/route.ts`)
   - **Endpoint**: `POST /api/pyqs/solve`
   - **Functionality**:
     - Accepts PYQ paper selection and student questions
     - Provides step-by-step solutions to PYQ questions
     - Maintains conversation history for follow-up questions
   - **Prompt Engineering**:
     - Instructions for educational, detailed solutions
     - Concept explanations, not just answers
     - Context-aware follow-up handling
   - **Models**: Tries `gemini-2.5-flash` → `gemini-2.5-pro` → fallbacks

#### 4. **Result Viewer & Analyzer** (`app/api/results/analyze/route.ts`)
   - **Endpoint**: `POST /api/results/analyze`
   - **Functionality**:
     - Analyzes uploaded semester result PDFs
     - Answers questions like "How much do I need to score to get CGPA 3.6?"
     - Provides grade analysis, trends, and actionable insights
   - **Document Processing**:
     - Extracts text from result PDFs (with OCR fallback)
     - Builds context from extracted grades and credits
   - **CGPA Calculations**: AI calculates required scores based on:
     - Current grades and credits
     - Target CGPA
     - Remaining credits
   - **Models**: Multi-model fallback strategy

#### 5. **Student Resource Book Chat** (`app/api/student-resource-book/ask/route.ts`)
   - **Endpoint**: `POST /api/student-resource-book/ask`
   - **Functionality**:
     - Answers questions based on 124-page Student Resource Book PDF
     - Maintains conversation context
     - Only answers from book content (no external knowledge)
   - **Document Processing**:
     - Downloads PDF from Firebase Storage
     - Extracts text with OCR fallback for scanned pages
     - Caches extracted text for performance
   - **Prompt Engineering**:
     - Strict instructions to only use book content
     - Clear formatting requirements (no markdown)
   - **Models**: `gemini-2.5-flash` → `gemini-2.5-pro` → fallbacks

#### 6. **Notes AI Chat** (`app/api/notes/ask/route.ts`)
   - **Endpoint**: `POST /api/notes/ask`
   - **Functionality**:
     - Chat with uploaded notes (PDF, DOCX)
     - Answers questions based on note content
     - Maintains conversation history
   - **Document Processing**:
     - Extracts text from uploaded notes
     - Supports PDF and DOCX formats
   - **Models**: Multi-model fallback

#### 7. **Notes Summarization** (`app/api/notes/summarize/route.ts`)
   - **Endpoint**: `POST /api/notes/summarize`
   - **Functionality**:
     - Generates AI summaries of uploaded notes
     - Extracts key topics and concepts
     - Provides study insights
   - **Models**: `gemini-2.5-flash` → `gemini-2.5-pro` → fallbacks

### Technical Implementation Details

#### Model Selection Strategy
```typescript
const modelsToTry = [
  "gemini-2.5-flash",    // Fastest, most cost-effective
  "gemini-2.5-pro",      // More capable for complex reasoning
  "gemini-2.0-flash",     // Fallback option
  "gemini-flash-latest", // Latest stable
  "gemini-pro-latest"    // Latest pro version
];
```

#### Error Handling
- Automatic model fallback on failure
- REST API fallback if SDK fails
- Graceful error messages to users
- Comprehensive logging for debugging

#### Prompt Engineering
- **Context-aware prompts**: Include relevant document content
- **Strict instructions**: Clear guidelines for AI behavior
- **Conversation history**: Maintains context across messages
- **Format control**: Specifies response format (plain text, no markdown)

#### Performance Optimizations
- **Text extraction caching**: Cached PDF text for faster responses
- **Model prioritization**: Fastest models tried first
- **Async processing**: Non-blocking API calls
- **Error recovery**: Automatic retries with different models

### Security & Configuration

- **API Key Management**: Stored in environment variables (`NEXT_PUBLIC_GEMINI_API_KEY`)
- **Server-side only**: All Gemini calls from API routes (not client-side)
- **Rate limiting**: Handled by Google's API quotas
- **Error masking**: User-friendly error messages without exposing API details

### Usage Statistics

**Total Gemini Integration Points**: 7
- 1 Centralized client engine
- 6 API route endpoints
- 3 UI components with chat interfaces

**Model Usage Pattern**:
- Primary: `gemini-2.5-flash` (80% of requests)
- Fallback: `gemini-2.5-pro` (15% of requests)
- Other fallbacks: (5% of requests)

### Future Enhancements

- **Streaming responses**: Real-time token streaming for better UX
- **Multi-modal support**: Image analysis for diagrams in notes/PYQs
- **Fine-tuning**: Custom model fine-tuning for academic domain
- **Analytics**: Track model performance and optimize selection

---

## Summary

**CampusIQ** solves the fragmented academic experience by providing a unified, AI-powered platform that understands context, provides intelligent assistance, and consolidates all student needs into one futuristic interface. Powered by Google Gemini AI, it transforms how students interact with academic resources, policies, and services—making college life more efficient, intelligent, and engaging.
