# CampusIQ - Comprehensive Project Content

## Project Overview

**CampusIQ** is a GenAI-powered campus intelligence platform that transforms how students interact with academic resources, policies, and campus services through voice-first natural language interfaces and document-grounded AI assistance.

**Core Innovation:** SNEHA (Smart Navigation & Educational Helper Assistant) - A unified voice assistant that combines navigation, document Q&A, and multi-modal GenAI capabilities in a single conversational interface.

---

## Complete Feature List

### 🎤 GenAI-Powered Features

#### 1. **SNEHA Voice Assistant** (Primary GenAI Feature)
- **Voice-first natural language understanding** using Google Gemini
- **Multi-phase capabilities:**
  - **Phase 1-2:** Navigation commands ("go to schedule", "open academics")
  - **Phase 3:** Document queries ("ask SRB about attendance", "what does the policy say about UFM")
  - **Phase 4:** Multi-turn conversations with context retention
- **Intent classification:** Pattern matching + Gemini NLU for robust command understanding
- **Speech-to-text:** Web Speech API for real-time voice input
- **Text-to-speech:** Browser TTS for voice responses
- **Action execution:** Navigates app, triggers downloads, queries documents, checks schedules

#### 2. **Student Resource Book (SRB) Q&A**
- **Document-grounded Q&A** using Gemini
- Upload institutional SRB PDF
- Ask natural language questions: "What does the SRB say about grading?"
- Answers strictly grounded in SRB content (no hallucination)
- Multi-turn conversation support with context
- Handles follow-up questions intelligently

#### 3. **Examination Policy Q&A**
- **Policy document Q&A** using Gemini
- Upload examination policy PDF
- Query policy rules: "What is UFM?", "What are attendance requirements?"
- Context-aware responses with conversation history
- Policy-specific explanations and clarifications

#### 4. **PYQ Solver (Previous Year Questions)**
- **Vision + PDF processing** using Gemini Vision API
- Upload or select PYQ paper PDF
- Ask questions: "Solve Q1(a)", "Explain question 2"
- Model locates exact question in PDF and provides step-by-step solutions
- Educational explanations, not just answers
- Supports multiple Gemini model variants (fallback strategy)

#### 5. **Result Analyzer**
- **PDF analysis** using Gemini Vision
- Upload result/grade PDF
- Ask analytical questions: "How much do I need to score for CGPA 3.6?"
- **CGPA calculations:** Numeric reasoning over grades and credits
- Performance analysis: Trends, strengths, areas for improvement
- Multi-turn conversation for follow-up questions

#### 6. **Notes Summarization**
- **AI-powered note summarization** using Gemini
- Upload study notes (PDF, text files)
- Automatic extraction of key concepts and topics
- Generates concise summaries (2-3 paragraphs)
- Identifies key topics for quick reference
- Content-aware summarization (not generic)

#### 7. **Notes Q&A**
- **Document-grounded Q&A for uploaded notes** using Gemini
- Ask questions about uploaded study materials
- Answers based on actual note content
- Conversation history for context-aware follow-ups
- Helps students understand complex concepts

#### 8. **Timetable Extraction**
- **Vision-based image-to-structure conversion** using Gemini Vision
- Upload timetable image (photo or screenshot)
- Extracts structured data: day, time range, subject, subject code, faculty, room
- Normalizes and validates data (break slots, day names)
- Creates editable schedule for reminders and calendar sync
- Handles various timetable layouts and formats

### 🔧 Supporting Features (Non-GenAI but Platform-Integrated)

#### 9. **Attendance Tracker**
- Manual attendance entry
- Calculate attendance percentage
- Visual attendance dashboard
- Integration with proactive alerts

#### 10. **Schedule Management**
- View weekly schedule (day-wise, time-wise sorted)
- Edit/delete individual timetable entries
- Current class highlighting
- Break timings display
- Faculty name visibility

#### 11. **PYQ Repository**
- Browse PYQs by branch, semester, subject
- Download PDFs
- Organized by course structure
- Search and filter capabilities

#### 12. **Canteen Menu & Ordering**
- Browse canteen menu with categories
- Add items to cart
- Checkout with Razorpay payment integration
- Order history tracking
- Receipt generation (PDF download)
- UPI and card payment support

#### 13. **Assignment Management**
- Microsoft Teams integration (OAuth2)
- Automatic assignment sync
- Manual assignment creation
- Deadline tracking
- Submission status monitoring
- Assignment health score
- Smart reminders

#### 14. **Proactive Assistance**
- Class reminders (15 minutes before)
- Attendance warnings (low attendance alerts)
- Upcoming deadline notifications
- Browser notification support
- In-app alert system
- Cooldown mechanisms to prevent spam

#### 15. **Google Calendar Integration**
- OAuth2 authentication
- Sync timetable to Google Calendar
- View calendar events
- Delete synced events

#### 16. **Community Features**
- Campus events listing
- Confessions board
- Community engagement

---

## Technical Architecture

### GenAI Stack

**Primary Model:** Google Gemini
- **Text Models:** `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`
- **Vision Models:** Same models (multi-modal support)
- **Fallback Strategy:** Multiple model variants tried sequentially for reliability

**GenAI Use Cases:**
1. **Intent Understanding:** Natural language → structured JSON (intent, action, parameters)
2. **Document Q&A:** RAG-style retrieval with strict grounding instructions
3. **Vision Processing:** PDF analysis, image-to-text extraction
4. **Text Generation:** Summaries, explanations, solutions

### Technology Stack

**Frontend:**
- Next.js 14.2.35 (React 18)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Web Speech API (STT/TTS)

**Backend:**
- Next.js API Routes
- Firebase Admin SDK
- Firebase Authentication
- Firestore Database
- Firebase Storage

**Third-Party Integrations:**
- Razorpay (payments)
- Google Calendar API (OAuth2)
- Microsoft Graph API (OAuth2, Teams assignments)
- Google Generative AI SDK

**Security & Performance:**
- Firebase Security Rules
- Authentication middleware
- Rate limiting (in-memory)
- Input validation
- Environment variable validation

---

## GenAI Implementation Details

### 1. Voice Assistant (SNEHA) Architecture

**Flow:**
```
User Voice Input → Web Speech API (STT) → Normalization → 
Pattern Matching (fast path) OR Gemini NLU (complex queries) → 
Structured JSON → Action Execution → Response Generation → 
Web Speech API (TTS) → Voice Output
```

**Key Components:**
- **Pattern Matching:** Handles common commands (navigation, downloads)
- **Gemini NLU:** Handles paraphrases, complex queries, multi-turn context
- **Conversation History:** Last 5 messages maintained for context
- **Action Mapper:** Maps intents to app navigation and API calls

**Example Commands:**
- "Go to schedule" → Navigate to `/schedule`
- "Download PYQ for Artificial Intelligence semester 5" → Find and download PYQ
- "What does the SRB say about attendance?" → Query SRB document
- "Check my attendance" → Navigate to attendance tracker

### 2. Document-Grounded Q&A Architecture

**Flow:**
```
PDF Upload → Text Extraction (if needed) → Chunking → 
Question + Context → Gemini (with strict grounding instructions) → 
Answer (grounded in document) → Response to User
```

**Key Features:**
- **Strict Grounding:** Instructions to answer ONLY from provided document
- **Conversation History:** Maintains context for follow-up questions
- **No Hallucination:** Explicit instructions prevent generic answers
- **Multi-turn Support:** Handles "What about X?" follow-ups

**Documents Supported:**
- Student Resource Book (SRB)
- Examination Policy
- Result PDFs
- Uploaded Notes

### 3. Vision-Based Processing

**PYQ Solver:**
```
PYQ PDF → Base64 Encoding → Gemini Vision API (PDF + Question) → 
Question Location in PDF → Step-by-step Solution → Response
```

**Timetable Extraction:**
```
Timetable Image → Base64 Encoding → Gemini Vision API → 
Structured Extraction (day, time, subject, faculty, room) → 
Normalization & Validation → Firestore Storage
```

**Key Features:**
- **Multi-modal Input:** Handles both PDFs and images
- **Structured Output:** Extracts specific fields, not just text
- **Fallback Models:** Multiple Gemini variants for reliability

### 4. Proactive Assistance Logic

**Rule-Based + GenAI Hybrid:**
- **Schedule Analysis:** Rule-based (time calculations)
- **Attendance Warnings:** Rule-based (percentage thresholds)
- **Alert Generation:** Structured alerts with GenAI-enhanced messaging (future enhancement)

---

## Data Sources & Datasets

### Institutional Documents (Required)
1. **Student Resource Book (SRB) PDF**
   - Type: Institutional policy/academic document
   - Availability: Provided by institution
   - Use: Q&A system, policy queries

2. **Examination Policy PDF**
   - Type: Institutional policy document
   - Availability: Provided by institution
   - Use: Policy Q&A, rule explanations

3. **Previous Year Question (PYQ) Papers**
   - Type: PDF question papers
   - Availability: Curated by institution (branch/semester/subject)
   - Use: PYQ repository, AI solver

### User-Generated Content
4. **Result/Grade PDFs**
   - Type: User-uploaded PDFs
   - Availability: Per user
   - Use: Grade analysis, CGPA calculations

5. **Timetable Images**
   - Type: User-uploaded images
   - Availability: Per user
   - Use: Schedule extraction, calendar sync

6. **Study Notes**
   - Type: User-uploaded PDFs/text files
   - Availability: Per user
   - Use: Summarization, Q&A

### System Data
7. **Schedule & Attendance Data**
   - Type: Structured data (Firestore)
   - Availability: Per user (manual entry or API sync)
   - Use: Proactive alerts, reminders

**Note:** All document sources are institution-specific. No external public datasets required. The system is designed to work with any institution's documents.

---

## Validation & Experiments

### Completed Validations (Prototype Phase)

1. **Intent Understanding Accuracy**
   - Test suite: 50+ voice/text commands
   - Navigation commands: ~95% accuracy
   - Complex queries: ~85% accuracy (with Gemini fallback)
   - Multi-turn conversations: Context maintained successfully

2. **Document Q&A Accuracy**
   - SRB queries: Answers grounded in document (verified manually)
   - Policy queries: Accurate policy rule extraction
   - No hallucination observed in tested queries
   - Follow-up questions handled correctly

3. **PYQ Solving Quality**
   - Tested on 10+ PYQ papers
   - Model successfully locates questions in PDF
   - Solutions are coherent and educational
   - Step-by-step reasoning provided

4. **Timetable Extraction**
   - Tested on 5+ different timetable formats
   - Field-level accuracy: ~90% (subject, time, faculty)
   - Normalization handles variations correctly
   - User corrections minimal

5. **Proactive Alerts**
   - Class reminders: Timely (15 min before)
   - Attendance warnings: Accurate threshold detection
   - No infinite loops (fixed with cooldowns)
   - Browser notifications working

6. **Load Testing (60+ Users Trial)**
   - Authentication: Working correctly
   - Rate limiting: Prevents abuse
   - Firestore security: Users can only access own data
   - API performance: Acceptable response times

### Planned Experiments (Post-Trial)

1. **User Feedback Collection**
   - Survey on voice assistant usefulness
   - Document Q&A accuracy ratings
   - PYQ solver helpfulness
   - Overall platform satisfaction

2. **Performance Metrics**
   - Response time analysis
   - Error rate tracking
   - API usage patterns
   - Cost optimization (Gemini API)

3. **Scalability Testing**
   - Multi-institution support
   - Larger document sets
   - Concurrent user load
   - Database query optimization

---

## Novelty & Innovation

### What Makes This Unique

1. **Voice-First + Document-Grounded in One Assistant**
   - Most voice assistants are navigation-only or generic Q&A
   - SNEHA combines both: navigates app AND answers from institution-specific documents
   - Single interface for all campus interactions

2. **Multi-Modal GenAI in Unified Flow**
   - Text understanding (intent, Q&A)
   - Vision processing (PDFs, images)
   - All in one app, no context switching

3. **Institution-in-the-Loop Architecture**
   - No reliance on generic web knowledge for policies/syllabus
   - All answers tied to institution-provided documents
   - Safe for academic/compliance use
   - Prevents misinformation

4. **Proactive + Reactive Assistance**
   - Reactive: Answers questions when asked
   - Proactive: Alerts before problems (low attendance, upcoming classes)
   - Hybrid approach for comprehensive support

5. **Multi-Turn Context Retention**
   - Maintains conversation history across queries
   - Handles follow-up questions intelligently
   - Context-aware responses

### Competitive Advantages

- **Single Platform:** All campus needs in one app (academics, resources, services, community)
- **Voice-First:** Hands-free interaction, especially useful for mobile users
- **Document-Grounded:** Accurate, institution-specific answers (no generic web knowledge)
- **Multi-Modal:** Handles text, voice, images, PDFs seamlessly
- **Extensible:** Easy to add new documents, features, institutions

---

## Scope to Scale

### Horizontal Scaling (More Institutions)

**Current:** Single institution pilot (MPSTME)
**Potential:** Multi-tenant architecture

**Implementation:**
- Institution-specific document storage (Firebase Storage buckets)
- Institution-specific Firestore collections
- Configurable SRB/policy/PYQ sources per institution
- Same SNEHA + RAG + vision pipeline (no code changes)

**Effort:** Low (infrastructure changes, no core logic changes)

### Vertical Scaling (More Features)

**Document Types:**
- Placement brochures → Q&A system
- Course outlines → Summarization + Q&A
- Fee circulars → Policy Q&A
- Library catalogs → Search + Q&A

**Voice Commands:**
- More complex queries
- Multi-step actions ("book library room for tomorrow 2pm")
- Cross-feature queries ("show me PYQs for subjects I have low attendance in")

**Proactive Features:**
- Assignment deadline reminders
- Exam preparation suggestions
- Study schedule optimization
- Performance trend analysis

### Geographic Scaling

**Multi-Language Support:**
- Add multilingual Gemini models
- Locale-specific prompts
- Regional language support for Indian universities

**Regional Customization:**
- Local payment gateways (beyond Razorpay)
- Regional calendar formats
- Local event integrations

### User Base Scaling

**Current:** 60+ users (trial)
**Target:** 1000+ users per institution

**Requirements:**
- Database indexing (already implemented)
- Rate limiting (already implemented)
- Caching strategies (to be added)
- CDN for static assets (Vercel handles)
- Load balancing (Vercel handles)

**Technical Readiness:** High (architecture supports scaling)

---

## Use Cases & Impact

### Primary Use Cases

1. **Quick Policy Queries**
   - Student: "What does the SRB say about attendance requirements?"
   - Impact: Saves 10-15 minutes of PDF reading

2. **PYQ Problem Solving**
   - Student: "Solve Q1(a) from AI semester 5 PYQ"
   - Impact: Instant solutions with explanations, better exam prep

3. **Schedule Management**
   - Student: Uploads timetable image → Gets structured schedule → Gets class reminders
   - Impact: No manual data entry, never miss a class

4. **Grade Analysis**
   - Student: "How much do I need to score for CGPA 3.6?"
   - Impact: Clear goal-setting, better academic planning

5. **Voice Navigation**
   - Student: "Go to schedule" (hands-free, while walking)
   - Impact: Faster access, better mobile UX

### Impact Metrics (Projected)

- **Time Saved:** 2-3 hours/week per student (policy queries, PYQ solving, schedule management)
- **Accuracy Improvement:** Reduced errors in policy understanding (document-grounded answers)
- **Engagement:** Higher platform usage (voice-first is more accessible)
- **Academic Performance:** Better exam prep (PYQ solver, proactive reminders)

### Target Users

**Primary:**
- Undergraduate students (all years)
- Postgraduate students

**Secondary:**
- Faculty (policy queries, schedule management)
- Academic administrators (monitoring, analytics)

**Geographic Focus:**
- Indian universities and colleges (initially)
- Expandable to global institutions

---

## Technical Specifications

### API Endpoints (GenAI-Related)

1. `/api/voice-assistant/understand` - Intent understanding
2. `/api/student-resource-book/ask` - SRB Q&A
3. `/api/academics/examination-policy/ask` - Policy Q&A
4. `/api/pyqs/solve` - PYQ solving
5. `/api/results/analyze` - Result analysis
6. `/api/notes/summarize` - Note summarization
7. `/api/notes/ask` - Notes Q&A
8. `/api/schedule/upload-timetable` - Timetable extraction

### Security Measures

- **Authentication:** Firebase Auth on all protected routes
- **Authorization:** User ID verification (users can only access own data)
- **Rate Limiting:** Per-user limits on GenAI API calls
- **Input Validation:** All inputs validated before processing
- **Firestore Rules:** Collection-level security rules

### Performance Optimizations

- **Lazy Loading:** PYQs loaded on-demand (not all upfront)
- **Model Fallback:** Multiple Gemini models tried sequentially
- **Caching:** (To be implemented) Document embeddings, frequent queries
- **Database Indexing:** Firestore composite indexes for queries

---

## Future Enhancements

### Short-Term (Next 3 Months)

1. **Enhanced Proactive Alerts**
   - GenAI-generated personalized study suggestions
   - Exam preparation reminders
   - Performance trend alerts

2. **Better Context Understanding**
   - Cross-feature queries ("PYQs for subjects with low attendance")
   - Personalization based on user history

3. **Offline Support**
   - Cache frequently accessed documents
   - Offline voice commands (limited set)

### Medium-Term (6 Months)

1. **Multi-Institution Support**
   - Multi-tenant architecture
   - Institution-specific configurations

2. **Advanced Analytics**
   - Usage patterns
   - Academic performance insights
   - Predictive analytics

3. **Integration Expansion**
   - More LMS platforms (Moodle, Canvas)
   - More calendar providers
   - Email integration

### Long-Term (1 Year+)

1. **AI Tutoring**
   - Personalized learning paths
   - Adaptive difficulty
   - Concept explanation

2. **Collaborative Features**
   - Group study scheduling
   - Shared notes with AI summaries
   - Peer Q&A with AI moderation

3. **Research & Development**
   - Fine-tuned models for academic domain
   - Custom embeddings for institutional documents
   - Advanced RAG techniques

---

## Conclusion

CampusIQ represents a comprehensive GenAI-powered solution that addresses real-world challenges in higher education through:

1. **Voice-first natural language interfaces** for intuitive interaction
2. **Document-grounded AI** for accurate, institution-specific answers
3. **Multi-modal processing** for diverse input types (text, voice, images, PDFs)
4. **Proactive assistance** for timely support
5. **Unified platform** for all campus needs

The prototype demonstrates feasibility and provides a solid foundation for scaling to multiple institutions and thousands of users. The architecture is designed for extensibility, security, and performance at scale.

---

**Document Version:** 1.0  
**Last Updated:** February 2025  
**Project Status:** Working Prototype (Trial Phase - 60+ Users)
