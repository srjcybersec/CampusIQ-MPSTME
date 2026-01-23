# CampusIQ - MPSTME: Process Flow Diagram

## Mermaid Diagram

```mermaid
flowchart TD
    Start([User Accesses CampusIQ]) --> Login{Authenticated?}
    Login -->|No| LoginPage[Login Page<br/>Firebase Auth]
    Login -->|Yes| Dashboard[Student/Faculty Dashboard]
    
    LoginPage --> AuthCheck{Firebase<br/>Authentication}
    AuthCheck -->|Success| Dashboard
    AuthCheck -->|Failed| LoginPage
    
    Dashboard --> NavMenu[Navigation Menu]
    
    NavMenu --> Academics[Academics Tab]
    NavMenu --> Schedule[Schedule Tab]
    NavMenu --> Campus[Campus Tab]
    NavMenu --> Resources[Resources Tab]
    NavMenu --> Community[Community Tab]
    NavMenu --> Services[Services Tab]
    NavMenu --> Extras[Extras Tab]
    
    %% Academics Flow
    Academics --> AcadSection{Select Section}
    AcadSection --> ExamPolicy[Examination Policy Chat]
    AcadSection --> Attendance[Attendance Tracker]
    AcadSection --> Passing[Passing Criteria]
    
    ExamPolicy --> ExamChat[User asks question<br/>about exam policy]
    ExamChat --> GeminiExam[Google Gemini AI<br/>Context: College Policy]
    GeminiExam --> ExamResponse[AI Response<br/>Plain Text Format]
    ExamResponse --> ExamChat
    
    Attendance --> AttInput[User inputs<br/>missed hours per subject]
    AttInput --> AttCalc[Calculate Attendance %<br/>Eligibility Status]
    AttCalc --> AttDisplay[Display Results<br/>Color-coded Cards]
    AttDisplay --> AttChat[AI Chat about<br/>Attendance Results]
    AttChat --> GeminiAtt[Google Gemini AI<br/>Context: Attendance Data]
    GeminiAtt --> AttResponse[AI Summary &<br/>Recommendations]
    AttResponse --> AttChat
    
    %% Schedule Flow
    Schedule --> ScheduleView[View Timetable<br/>Today & Week View]
    ScheduleView --> DaySelect[Select Day]
    DaySelect --> ClassView[Display Classes<br/>with Batch K1/K2]
    ClassView --> Comments[Add/Edit Comments<br/>per Class Hour]
    Comments --> FirestoreComments[(Save to Firestore)]
    
    ScheduleView --> ScheduleChat[Schedule AI Chat]
    ScheduleChat --> ScheduleQ[User asks about<br/>timetable]
    ScheduleQ --> GeminiSchedule[Google Gemini AI<br/>Context: Timetable Data]
    GeminiSchedule --> ScheduleResponse[AI Response<br/>about Schedule]
    ScheduleResponse --> ScheduleChat
    
    ScheduleView --> CalendarSync[Google Calendar Sync]
    CalendarSync --> CalCheck{Connected?}
    CalCheck -->|No| CalConnect[Connect Google Calendar<br/>OAuth2 Flow]
    CalCheck -->|Yes| CalSyncBtn[Sync Timetable]
    
    CalConnect --> OAuth[Google OAuth<br/>Authorization]
    OAuth --> OAuthCallback[OAuth Callback<br/>Exchange Code for Tokens]
    OAuthCallback --> FirestoreTokens[(Store Tokens<br/>in Firestore)]
    FirestoreTokens --> CalSyncBtn
    
    CalSyncBtn --> CalAPI[Google Calendar API<br/>Create Recurring Events]
    CalAPI --> FirestoreEvents[(Store Event IDs<br/>in Firestore)]
    FirestoreEvents --> CalSuccess[Sync Success<br/>Events Created]
    
    CalCheck -->|Yes| CalDisconnect[Disconnect Calendar]
    CalDisconnect --> DeleteEvents[Delete Events<br/>from Google Calendar]
    DeleteEvents --> DeleteTokens[Remove Tokens<br/>from Firestore]
    DeleteTokens --> CalDisconnected[Disconnected]
    
    %% Other Tabs (Future)
    Campus --> CampusFeatures[Empty Space Finder<br/>Infrastructure Intelligence]
    Resources --> ResourcesFeatures[Notes, Assignments<br/>PYQ Repository]
    Community --> CommunityFeatures[Events<br/>Campus Engagement]
    Services --> ServicesFeatures[FAQs<br/>Railway Concession]
    Extras --> ExtrasFeatures[Experimental Features]
    
    %% Logout
    NavMenu --> Logout[Sign Out]
    Logout --> LogoutAuth[Firebase Sign Out]
    LogoutAuth --> LoginPage
    
    %% Styling
    classDef authClass fill:#4F46E5,stroke:#312E81,stroke-width:2px,color:#fff
    classDef aiClass fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
    classDef googleClass fill:#EA4335,stroke:#B91C1C,stroke-width:2px,color:#fff
    classDef firebaseClass fill:#FFA000,stroke:#E65100,stroke-width:2px,color:#fff
    classDef featureClass fill:#8B5CF6,stroke:#6D28D9,stroke-width:2px,color:#fff
    classDef userClass fill:#3B82F6,stroke:#1E40AF,stroke-width:2px,color:#fff
    
    class LoginPage,AuthCheck,LogoutAuth authClass
    class GeminiExam,GeminiAtt,GeminiSchedule,ExamResponse,AttResponse,ScheduleResponse aiClass
    class OAuth,OAuthCallback,CalAPI,CalConnect,CalSyncBtn,DeleteEvents googleClass
    class FirestoreTokens,FirestoreEvents,FirestoreComments,DeleteTokens firebaseClass
    class Academics,Schedule,Campus,Resources,Community,Services,Extras featureClass
    class Start,Login,Dashboard,NavMenu,DaySelect,ClassView,Comments userClass
```

## Alternative: Use Case Diagram

```mermaid
graph TB
    subgraph "CampusIQ - MPSTME System"
        subgraph "Authentication"
            A1[Student Login]
            A2[Faculty Login]
            A3[Firebase Authentication]
        end
        
        subgraph "Academics Module"
            B1[Examination Policy Chat]
            B2[Attendance Tracker]
            B3[Passing Criteria]
            B4[Google Gemini AI]
        end
        
        subgraph "Schedule Module"
            C1[Timetable View]
            C2[Class Comments]
            C3[Schedule AI Chat]
            C4[Google Calendar Sync]
            C5[Google Calendar API]
        end
        
        subgraph "Other Modules"
            D1[Campus Services]
            D2[Resources]
            D3[Community]
            D4[Services]
            D5[Extras]
        end
        
        subgraph "Data Storage"
            E1[Firestore Database]
            E2[Google Calendar]
        end
    end
    
    User([Student/Faculty]) --> A1
    User --> A2
    A1 --> A3
    A2 --> A3
    
    A3 --> B1
    A3 --> B2
    A3 --> C1
    A3 --> D1
    
    B1 --> B4
    B2 --> B4
    B3 --> B4
    C3 --> B4
    
    B2 --> E1
    C2 --> E1
    C4 --> C5
    C5 --> E2
    C4 --> E1
    
    C1 --> C2
    C1 --> C3
    C1 --> C4
    
    A3 --> D2
    A3 --> D3
    A3 --> D4
    A3 --> D5
    
    classDef userClass fill:#3B82F6,stroke:#1E40AF,stroke-width:3px,color:#fff
    classDef authClass fill:#4F46E5,stroke:#312E81,stroke-width:2px,color:#fff
    classDef aiClass fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
    classDef googleClass fill:#EA4335,stroke:#B91C1C,stroke-width:2px,color:#fff
    classDef featureClass fill:#8B5CF6,stroke:#6D28D9,stroke-width:2px,color:#fff
    classDef storageClass fill:#FFA000,stroke:#E65100,stroke-width:2px,color:#fff
    
    class User userClass
    class A1,A2,A3 authClass
    class B4 aiClass
    class C4,C5,E2 googleClass
    class B1,B2,B3,C1,C2,C3,D1,D2,D3,D4,D5 featureClass
    class E1 storageClass
```

## Key Components

1. **Authentication Flow**: Firebase Auth handles user login/logout
2. **Academics Module**: 
   - Examination Policy Chat with Gemini AI
   - Attendance Tracker with calculations and AI chat
   - Passing Criteria explanation
3. **Schedule Module**:
   - Timetable display (Today & Week view)
   - Class comments (stored in Firestore)
   - Schedule AI Chat with Gemini AI
   - Google Calendar integration (OAuth, Sync, Unsync)
4. **Data Storage**: Firestore for user data, tokens, comments; Google Calendar for synced events
5. **AI Integration**: Google Gemini AI powers all chat interfaces with contextual knowledge
