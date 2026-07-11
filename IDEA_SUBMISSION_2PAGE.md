# GenAI Hackathon – Idea Submission (2-Page PDF Content)

**Working title:** CampusIQ – GenAI-Powered Campus Intelligence with Voice-First SNEHA

**Note:** This idea is supported by an existing working prototype. Content below is written to fit the ideation format while reflecting what has already been built and validated.

---

## 1. Problem Statement

Students and faculty in higher education face fragmented digital experiences: academic resources (PYQs, results, policies), schedules, and campus services live in separate systems. Finding answers—e.g., “What does the Student Resource Book say about attendance?” or “Solve Q1(a) from the AI semester 5 PYQ”—requires opening multiple apps, downloading PDFs, and reading long documents. This slows learning, increases cognitive load, and makes policy/syllabus compliance harder. **Who it impacts:** Undergraduate and postgraduate students, faculty, and academic administrators in universities and colleges.

---

## 2. Motivation

Existing campus portals are form-heavy and search-poor. Critical information is locked inside PDFs (SRB, examination policy, PYQs, result sheets). There is a clear gap: **conversational, context-aware access** to these documents and actions (navigation, downloads, schedule checks) without switching apps or reading entire documents. GenAI can bridge this gap by understanding natural language, grounding answers in institution-specific documents, and driving a voice-first assistant that works across the full student journey.

---

## 3. Application

**Real-world use case:** A unified campus app where users can:
- **Ask in natural language** (voice or text): e.g., “What’s my schedule today?”, “Check my attendance”, “What does the SRB say about grading?”, “Download PYQ for Artificial Intelligence semester 5”.
- **Get document-grounded answers** from the Student Resource Book, examination policy, result PDFs, PYQ papers, and uploaded study notes—with citations to the actual content.
- **Solve PYQ questions** by uploading or selecting a paper and asking “Solve Q1 a”—the system uses the PDF as context and returns step-by-step solutions.
- **Upload a timetable image** and get a structured, editable schedule (subject, time, faculty, room) without manual data entry.
- **Receive proactive nudges** (e.g., “Class in 15 minutes”, “Low attendance warning”) based on schedule and attendance context.

**Target users:** College and university students (primary), faculty and academic staff (secondary).  
**Where it is applied:** Campus portals, student apps, and learning-management workflows; currently piloted for a single institution with scope to onboard more.

---

## 4. Proposed Method

Our GenAI approach is multi-component and already implemented in the prototype:

1. **Voice-first intent understanding (SNEHA)**  
   Speech-to-text on device; then a **Gemini**-based NLU layer that maps free-form commands to structured actions (navigate, check attendance, download PYQ, query SRB/policy, etc.). Pattern matching handles high-frequency phrases; Gemini handles paraphrases and multi-turn context (last 5 turns). Output is structured JSON (intent, action, parameters) to drive navigation and API calls.

2. **Document-grounded Q&A**  
   For Student Resource Book, examination policy, result PDFs, and uploaded study notes: we extract or use existing text, chunk and pass relevant context to **Gemini** with strict instructions to answer only from the provided text. Conversation history is included for follow-up questions. Same pattern for **result PDF analysis** (e.g., “How much do I need to score for CGPA 3.6?”) with numeric reasoning over grades and credits.

3. **Notes summarization and Q&A**  
   Uploaded study notes are automatically summarized by **Gemini** to extract key concepts and topics. Students can then ask questions about their notes, with answers grounded in the actual note content.

4. **Vision + PDF for PYQ solving**  
   **Gemini** (vision-capable) receives the PYQ PDF (as base64) plus the student’s question. The prompt instructs the model to locate the exact question in the PDF and produce a step-by-step solution grounded in that content, with fallback across multiple Gemini model variants for availability.

5. **Timetable extraction from images**  
   User uploads a timetable image; **Gemini Vision** is prompted to extract structured fields (day, time range, subject, subject code, faculty, room). We normalize and validate (e.g., break slots, day names) and store a structured schedule for reminders and calendar use.

6. **Proactive assistance**  
   Rule-based logic over the user’s schedule and (where available) attendance data triggers alerts (class reminders, attendance warnings, deadlines). These are delivered in-app and optionally via browser notifications.

**Models/techniques:** Google **Gemini** (e.g. `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) for text and vision; Web Speech API for STT/TTS; Firebase for auth and data; rate limiting and auth checks on all GenAI and data APIs.

---

## 5. Datasets / Data Source

| Data / Source | Type | Availability | Use in solution |
|---------------|------|--------------|-----------------|
| Student Resource Book (SRB) PDF | Institutional | Provided by institution | RAG-style Q&A; answers grounded only in SRB |
| Examination policy PDF | Institutional | Provided by institution | Policy Q&A |
| Previous Year Question (PYQ) papers | Institutional | Curated by institution (branch/semester/subject) | PYQ discovery, download, and solve-with-PDF |
| Result / grade PDFs | User-uploaded or institutional | Per user | Grade analysis, CGPA “what-if” questions |
| Timetable images | User-uploaded | Per user | Vision-based extraction → structured schedule |
| Schedule & attendance (if integrated) | APIs or manual entry | Per user | Proactive reminders and warnings |

All document sources are **institution-specific**; no external public datasets are required. The prototype uses Firebase Storage/Firestore for PDFs and user data; availability is controlled by the deploying institution.

---

## 6. Experiments

Because a **working prototype already exists**, validation is both design-time and runtime:

1. **Intent understanding:** Test suite of 50+ voice/text commands (navigation, PYQ download, SRB/policy queries, schedule/attendance) with expected intent and parameters; measure exact match and fallback to Gemini when patterns fail.
2. **Document Q&A accuracy:** Sample questions on SRB, policy, and uploaded notes; human check that answers are grounded in the document and no hallucination on key policy facts.
3. **Notes summarization:** Tested on various note formats; verified key concept extraction and summary quality.
4. **PYQ solving:** Sample questions from real PYQ PDFs; evaluate whether the model identifies the correct question in the PDF and produces coherent, step-by-step solutions.
5. **Timetable extraction:** Diverse timetable images (different layouts); metrics on field-level accuracy (subject, time, faculty, room) and user corrections needed.
6. **Proactive alerts:** Logs and user feedback on relevance and timeliness of class reminders and attendance warnings.
7. **Load and security:** Trial with 60+ users: auth on all APIs, rate limiting on Gemini and uploads, and Firestore rules so users only access their own data.

Success criteria: high intent accuracy, no policy/SRB hallucination, useful PYQ solutions, and reliable timetable extraction with minimal edits. Feedback from the trial cohort will drive the next iteration (e.g., more SRB/policy documents, more branches/semesters for PYQs).

---

## 7. Novelty and Scope to Scale

**Novelty**
- **Voice-first, document-grounded campus assistant:** Single assistant (SNEHA) that both navigates the app and answers from official PDFs (SRB, policy, results, PYQs), reducing context-switching and “which PDF was that?” friction.
- **Multi-modal GenAI in one flow:** Same app uses Gemini for text (intent, Q&A) and vision (timetable image, PYQ PDF); students don’t leave the app to “go look in another tool.”
- **Institution-in-the-loop:** No reliance on generic web knowledge for policy or syllabus; all answers tied to institution-provided documents, making it safe for academic and compliance use.

**Scope to scale**
- **More institutions:** Swap SRB, policy, and PYQ corpus per college; same SNEHA + RAG + vision pipeline.
- **More document types:** Placement brochures, course outlines, fee circulars—same “upload PDF, ask questions” pattern.
- **More languages:** Add multilingual Gemini and locale-specific prompts for regional institutions.
- **Larger user base:** Already designed for 60+ user trial (auth, rate limits, Firestore rules); next step is multi-tenant support and optional SSO for university IT.

---

## Suggested PDF Layout (2 pages)

**Page 1**
- **Title:** CampusIQ – GenAI-Powered Campus Intelligence with Voice-First SNEHA  
- **Sections:** Problem Statement (short para), Motivation (short para), Application (bullet list of use cases + target users + where applied), Proposed Method (numbered list with model names and techniques).  
- **Footer:** Team name / institution / hackathon name.

**Page 2**
- **Sections:** Datasets / Data Source (compact table or bullet list), Experiments (numbered list with what we did / will do and success criteria), Novelty and Scope to Scale (bullets under Novelty and Scale).  
- **Optional:** One small diagram (e.g. “User → Voice/Text → SNEHA → Gemini → Documents / Actions”) or one screenshot of the prototype.  
- **Footer:** Same as page 1.

Use this markdown as the source for the 2-page PDF; condense paragraphs and bullets as needed to fit font size and margins (e.g. 11–12 pt body, clear headings).
