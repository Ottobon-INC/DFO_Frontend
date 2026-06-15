# JanmaSethu Clinical OS - Frontend Codebase Walkthrough

A comprehensive guide to the **Janmasethu Clinic CRM Frontend** - a React/TypeScript clinical management system for fertility clinics and hospitals.

---

## 🏗️ Project Architecture Overview

```mermaid
graph TB
    subgraph "Entry Point"
        A[index.html] --> B[index.tsx]
        B --> C[App.tsx]
    end
    
    subgraph "Routing Layer"
        C --> D["/Landing Page"]
        C --> E["/login - LoginCard"]
        C --> F["/dashboard/* - Dashboard"]
    end
    
    subgraph "Dashboard Views"
        F --> G[DashboardHome]
        F --> H[AppointmentsView]
        F --> I[LeadsView]
        F --> J[PatientsView]
        F --> K[AnalyticsView]
        F --> L[SettingsView]
    end
    
    subgraph "Shared Resources"
        M[types.ts]
        N[constants.ts]
        O[services/api.ts]
        P[index.css]
    end
    
    G & H & I & J --> O
    O --> Q[(Backend API)]
```

---

## 📁 File Structure Overview

| Category | Path | Purpose |
|----------|------|---------|
| **Entry** | `index.html`, `index.tsx` | App bootstrap & mounting |
| **Routing** | `App.tsx` | Route definitions & auth state |
| **Core Types** | `types.ts` | TypeScript interfaces for all entities |
| **Constants** | `constants.ts` | Doctor list, colors, static data |
| **API Layer** | `services/api.ts` | Backend communication wrapper |
| **Styling** | `index.css` | TailwindCSS + custom animations |
| **Components** | `components/` | 42 UI components |

---

## 🔑 Core Files Explained

### 1. [App.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/App.tsx) - Application Router

The root component that handles:
- **Routing** via React Router (`/`, `/login`, `/dashboard/*`)
- **Authentication state** using localStorage
- **User role management** (Admin, Doctor, Nurse, Front Desk, CRO)

```mermaid
stateDiagram-v2
    [*] --> LandingPage: / route
    LandingPage --> LoginCard: Click Login
    LoginCard --> Dashboard: Login Success
    Dashboard --> LandingPage: Logout
```

---

### 2. [types.ts](file:///c:/Users/GANESH/Downloads/clinics%20frontend/types.ts) - Data Models

Defines all TypeScript interfaces used across the application:

```mermaid
erDiagram
    UserRole ||--o{ Dashboard : "controls access"
    Patient ||--o{ Appointment : "has many"
    Patient ||--o{ PatientDocument : "has many"
    Patient ||--o{ FinancialRecord : "has many"
    Doctor ||--o{ Appointment : "treats"
    Lead ||--o| Patient : "converts to"
    
    UserRole {
        enum ADMIN
        enum DOCTOR
        enum NURSE
        enum FRONT_DESK
        enum CRO
    }
    
    Patient {
        string id
        string uhid
        string name
        string gender
        string mobile
        string status
    }
    
    Appointment {
        string id
        string patientName
        string date
        string time
        string status
        string doctorId
    }
    
    Lead {
        string id
        string name
        string phone
        string source
        string status
    }
    
    Doctor {
        string id
        string name
        string speciality
        string location
    }
```

---

### 3. [services/api.ts](file:///c:/Users/GANESH/Downloads/clinics%20frontend/services/api.ts) - API Service Layer

Centralized API wrapper with endpoints for all CRUD operations:

```mermaid
graph LR
    subgraph "API Service"
        A[api.ts]
    end
    
    subgraph "Endpoints"
        B["/api/appointments"]
        C["/api/patients"]
        D["/api/leads"]
        E["/api/dashboard"]
        F["/api/auth"]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    
    B --> |GET/POST/PATCH| G[Appointments CRUD]
    C --> |GET/POST/PATCH| H[Patients CRUD]
    D --> |GET/POST/PATCH| I[Leads CRUD]
    E --> |GET| J[Dashboard Summary]
    F --> |POST| K[Login]
```

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `getAppointments()` | Fetch appointments with filters |
| `createAppointment()` | Book new appointment |
| `updateAppointmentStatus()` | Check-in, cancel, complete |
| `getPatients()` / `searchPatients()` | Patient lookup |
| `createPatient()` | Register new patient |
| `getLeads()` / `updateLead()` | Lead management |
| `getCRODashboard()` | CRO-specific metrics |

---

## 🎨 Component Architecture

### Main Dashboard Structure

```mermaid
graph TB
    subgraph "Dashboard.tsx - Main Container"
        A[Sidebar Navigation]
        B[Header with Search]
        C[Main Content Area]
    end
    
    C --> D[DashboardHome]
    C --> E[AppointmentsView]
    C --> F[PatientsView]
    C --> G[LeadsView]
    C --> H[AnalyticsView]
    C --> I[SettingsView]
    
    F -->|Click Patient| J[PatientProfile]
    G -->|Add Lead| K[AddLeadModal]
    E -->|Book| L[BookAppointmentModal]
    E -->|Reschedule| M[RescheduleModal]
```

---

### Component Breakdown

#### 📊 Views (Main Content Panels)

| Component | Lines | Purpose |
|-----------|-------|---------|
| [Dashboard.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/Dashboard.tsx) | 553 | Main container, navigation, global handlers |
| [DashboardHome.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/DashboardHome.tsx) | ~200 | Overview widgets, stats, quick actions |
| [AppointmentsView.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/AppointmentsView.tsx) | 914 | Calendar/list views, booking, check-in flow |
| [PatientsView.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/PatientsView.tsx) | 274 | Patient list with search & filtering |
| [PatientProfile.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/PatientProfile.tsx) | 825 | Full patient details, appointments, documents |
| [LeadsView.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/LeadsView.tsx) | 399 | Lead tracking pipeline |
| [AnalyticsView.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/AnalyticsView.tsx) | 154 | Charts, conversion funnels |
| [SettingsView.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/SettingsView.tsx) | 305 | App configuration panels |

#### 🪟 Modals & Forms

| Component | Purpose |
|-----------|---------|
| [Modals.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/Modals.tsx) | RescheduleModal, Toast, CheckInModal, AddLeadModal |
| [AppointmentModals.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/AppointmentModals.tsx) | BookAppointmentModal, AppointmentDetailPopover |
| [LeadDetailsModal.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/LeadDetailsModal.tsx) | Lead detail view with actions |
| [PatientRegistration.tsx](file:///c:/Users/GANESH/Downloads/clinics%20frontend/components/PatientRegistration.tsx) | New patient registration form |

#### 🌐 Landing Page Sections

```mermaid
graph TB
    subgraph "LandingPage.tsx"
        A[HeroSection] --> B[OSLayers]
        B --> C[TeamExperiencePanels]
        C --> D[ClinicalIntelligence]
        D --> E[AutomationFlow]
        E --> F[FertilitySpecific]
        F --> G[WhyClinicsTrust]
        G --> H[FinalCTA]
    end
```

Located in `components/landing/`:
- `HeroSection.tsx` - Hero banner with CTA
- `OSLayers.tsx` - Feature layer visualization
- `TeamExperiencePanels.tsx` - Role-based benefit panels
- `FertilitySpecific.tsx` - IVF/Fertility features
- `WhyClinicsTrust.tsx` - Trust indicators
- `FinalCTA.tsx` - Call-to-action footer

---

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant A as api.ts
    participant B as Backend
    
    U->>C: Interaction (click, form submit)
    C->>A: Call API function
    A->>B: HTTP Request (fetch)
    B-->>A: JSON Response
    A-->>C: Parsed data
    C->>C: Update React state
    C-->>U: Re-render UI
```

---

## 🎯 User Roles & Access

```mermaid
graph LR
    subgraph "User Roles"
        A[Admin] -->|Full Access| Z[All Features]
        B[Doctor] -->|Clinical| Y[Patients + Appointments]
        C[Nurse] -->|Clinical| X[Check-in + Patient Data]
        D[Front Desk] -->|Operations| W[Appointments + Leads]
        E[CRO] -->|Sales| V[Leads + Conversion]
    end
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI Framework |
| **TypeScript** | 5.8.2 | Type Safety |
| **Vite** | 6.2.0 | Build Tool & Dev Server |
| **React Router** | 7.10.1 | Client-side Routing |
| **Framer Motion** | 12.23.25 | Animations |
| **Lucide React** | 0.554.0 | Icon Library |
| **TailwindCSS** | (via CDN) | Utility-first Styling |

---

## 📦 Key Configuration Files

| File | Purpose |
|------|---------|
| [package.json](file:///c:/Users/GANESH/Downloads/clinics%20frontend/package.json) | Dependencies & scripts |
| [vite.config.ts](file:///c:/Users/GANESH/Downloads/clinics%20frontend/vite.config.ts) | Vite build configuration |
| [tsconfig.json](file:///c:/Users/GANESH/Downloads/clinics%20frontend/tsconfig.json) | TypeScript compiler options |
| [index.css](file:///c:/Users/GANESH/Downloads/clinics%20frontend/index.css) | Global styles & animations |

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📈 Feature Summary

| Module | Features |
|--------|----------|
| **Appointments** | Calendar view, list view, book/reschedule/cancel, check-in flow |
| **Patients** | Registration, UHID generation, full profile, documents, clinical notes |
| **Leads** | Pipeline management, conversion tracking, CRO dashboard |
| **Analytics** | Conversion funnels, staff performance, lead sources |
| **Settings** | User management, integrations, templates |
