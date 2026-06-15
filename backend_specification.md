# JanmaSethu Clinical OS - Backend Specification

This document provides a complete end-to-end functional and technical specification for building the backend of the JanmaSethu Clinical OS. It is designed to support the dynamic requirements of the frontend application.

## 1. System Overview

The system is a multi-role Clinical Operating System (OS) designed for fertility clinics. It handles the entire patient journey from **Lead** (marketing/inquiry) to **Patient** (clinical treatment) to **Financials**.

### User Roles & Permissions
### User Roles & Permissions
*   **CRO (Customer Relations Officer)**: Focus on *Leads Pipeline* and *Intervention Queue*.
*   **Doctor**: Focus on *Appointments*, *Patient Clinical Profiles* (SOAP Notes, Labs), and *My Schedule*.
*   **Front Desk**: Focus on *Appointment Scheduling*, *Check-ins*, *Lead Entry*, and *Billing (Basic)*.

---

## 2. Database Schema Design

The backend should use a relational database (PostgreSQL recommended) to maintain data integrity.

### 2.1. Core Entities (ER Diagram Logic)

#### **Users Table**
*   `id` (PK): UUID
*   `email`: String (Unique)
*   `password_hash`: String
*   `full_name`: String
*   `role`: Enum ('Doctor', 'Front_Desk', 'CRO')
*   `specialty`: String (Nullable, for Doctors)
*   `color_code`: String (For UI calendar display, e.g., 'bg-blue-500')
*   `is_active`: Boolean
*   `created_at`: Timestamp
*   `updated_at`: Timestamp

#### **Leads Table**
*   `id` (PK): UUID
*   `name`: String
*   `phone`: String
*   `email`: String (Nullable)
*   `age`: String (Nullable)
*   `gender`: Enum ('Male', 'Female', 'Other')
*   `source`: String (e.g., 'Walk-In', 'Google Ads', 'Referral', 'Sakhi App')
*   `inquiry`: String (e.g., 'IVF', 'IUI', 'General')
*   `problem`: Text (Nullable)
*   `treatment_doctor`: String (Nullable, for Camp leads)
*   `treatment_suggested`: String (Nullable)
*   `status`: Enum ('New Inquiry', 'Contacted', 'Stalling - Sent to CRO', 'Converted - Active Patient', 'Lost')
*   `assigned_to_user_id`: UUID (FK -> Users, Nullable)
*   `date_added`: Timestamp
*   `updated_at`: Timestamp

#### **Patients Table**
*   `id` (PK): UUID
*   `uhid`: String (Unique Hospital ID, e.g., 'JAN-2025-001')
*   `lead_id`: UUID (FK -> Leads, Nullable)
*   `name`: String
*   `relation`: String (Nullable, e.g., 'W/o')
*   `marital_status`: Enum ('Single', 'Married')
*   `gender`: Enum ('Male', 'Female', 'Other')
*   `dob`: Date
*   `age`: String (Derived or stored)
*   `blood_group`: String
*   `aadhar`: String (Nullable)
*   `mobile`: String
*   `email`: String
*   `house`: String
*   `street`: String
*   `area`: String
*   `city`: String
*   `district`: String
*   `state`: String
*   `postal_code`: String
*   `emergency_contact_name`: String
*   `emergency_contact_phone`: String
*   `emergency_contact_relation`: String
*   `assigned_doctor_id`: UUID (FK -> Users)
*   `referral_doctor`: String (Nullable)
*   `hospital_address`: String (Nullable)
*   `registration_date`: Date
*   `status`: Enum ('Active', 'Archived')
*   `created_at`: Timestamp
*   `updated_at`: Timestamp

#### **Appointments Table**
*   `id` (PK): UUID
*   `patient_id`: UUID (FK -> Patients, Nullable)
*   `lead_id`: UUID (FK -> Leads, Nullable)
*   `doctor_id`: UUID (FK -> Users)
*   `appointment_date`: Date
*   `start_time`: Time
*   `end_time`: Time (Derived from duration)
*   `type`: Enum ('Consultation', 'Scan', 'Procedure', 'Follow-up', 'IVF Consult', 'IUI Procedure')
*   `status`: Enum ('Scheduled', 'Arrived', 'Checked-In', 'Completed', 'Canceled', 'Expected')
*   `visit_reason`: String
*   `resource_id`: String (Optional, for Room/Machine booking)
*   # Snapshot fields for non-registered patients (Leads/Walk-ins)
*   `patient_name_snapshot`: String
*   `phone_snapshot`: String
*   `dob_snapshot`: Date
*   `sex_snapshot`: Enum
*   `created_at`: Timestamp
*   `updated_at`: Timestamp

#### **Clinical_Notes Table (SOAP)**
*   `id` (PK): UUID
*   `patient_id`: UUID (FK -> Patients)
*   `doctor_id`: UUID (FK -> Users)
*   `appointment_id`: UUID (FK -> Appointments)
*   `subjective`: Text
*   `objective`: Text
*   `assessment`: Text
*   `plan`: Text
*   `created_at`: Timestamp

#### **Lab_Results Table**
*   `id` (PK): UUID
*   `patient_id`: UUID (FK -> Patients)
*   `test_name`: String
*   `test_date`: Date
*   `result_value`: String
*   `reference_range`: String
*   `status`: Enum ('Normal', 'Abnormal', 'Critical')
*   `attachment_url`: String (Link to PDF/Image)
*   `created_at`: Timestamp

#### **Financial_Records Table**
*   `id` (PK): UUID
*   `patient_id`: UUID (FK -> Patients)
*   `type`: Enum ('Invoice', 'Payment')
*   `amount`: Decimal
*   `date`: Date
*   `description`: String
*   `status`: Enum ('Pending', 'Paid', 'Overdue', 'Cancelled')
*   `payment_method`: String (Nullable)
*   `created_at`: Timestamp

#### **Documents Table**
*   `id` (PK): UUID
*   `patient_id`: UUID (FK -> Patients)
*   `name`: String
*   `document_type`: Enum ('Insurance', 'Consent', 'Lab Report', 'Previous History')
*   `url`: String (S3/Blob Storage path)
*   `uploaded_at`: Timestamp

---

## 3. Functional Logic & Business Rules

### 3.1. Dashboard & Analytics
*   **KPI Calculation**:
    *   *Conversion Rate*: (Converted Leads / Total Leads) * 100 within a date range.
    *   *Revenue*: Sum of `Financial_Records` where type='Payment'.
    *   *CRO Queue*: Count of Leads where status = 'Stalling - Sent to CRO'.
*   **Funnel Logic**: Aggregation of Leads grouped by current status to show drop-offs.

### 3.2. Lead Management
*   **Lead Lifecycle**:
    1.  **Entry**: Created via "Add Lead" modal or API (website). Status: 'New Inquiry'.
    2.  **Triage**: Front Desk calls. If interested -> 'Contacted'.
    3.  **Stall**: If patient hesitates (price/fear) -> Status changed to 'Stalling - Sent to CRO'.
    4.  **Intervention**: CRO sees these in *Intervention Queue*.
    5.  **Conversion**: If patient agrees to treatment -> "Convert to Patient" action.
        *   *Action*: Creates a new record in `Patients` table copying data from `Leads`. Updates Lead status to 'Converted'.
    6.  **Drop**: If lead is not interested -> Status changed to 'Lost'.
*   **Auto-Assignment**: Leads can be auto-assigned to CROs based on round-robin logic (optional backend feature).

### 3.3. Appointment System
*   **Scheduling**:
    *   Must check for **Double Booking**: No two appointments for the same `doctor_id` can overlap in time.
    *   **Instant Booking**: When adding a Lead, if `doctor_schedule` has space today, auto-create an appointment.
*   **Status Flow**:
    *   *Scheduled* -> *Arrived* (Patient enters clinic) -> *Checked-In* (Vitals taken/Waiting) -> *Completed* (Doctor finishes consult).

### 3.4. Patient Clinical Profile
*   **Security**: Only Users with role 'Doctor' or 'Nurse' can view/edit `Clinical_Notes` and `Lab_Results`.
*   **Timeline**: A chronological view aggregating Appointments, Lab Results, and Notes.

---

## 4. API Endpoints (RESTful Design)

### **Auth**
*   `POST /api/auth/login`: Returns JWT token + User Role.
*   `POST /api/auth/logout`

### **Metadata (For Dynamic UI)**
*   `GET /api/metadata/doctors`: Returns list of doctors (id, name, color) for dropdowns.
*   `GET /api/metadata/enums`: Returns all enums (LeadStatus, AppointmentType, etc.) for frontend validation.

### **Dashboard**
*   `GET /api/dashboard/stats`: Returns KPIs (Revenue, Conversion %, Queue Counts).
*   `GET /api/dashboard/funnel`: Returns counts for funnel visualization.

### **Leads**
*   `GET /api/leads`: List leads with filtering (status, search).
*   `POST /api/leads`: Create new lead.
*   `PATCH /api/leads/:id`: Update status (e.g., move to CRO, Drop).
*   `POST /api/leads/:id/convert`: Convert Lead to Patient.

### **Appointments**
*   `GET /api/appointments`: Get by date range & doctor.
*   `POST /api/appointments`: Book new.
*   `PATCH /api/appointments/:id/status`: Check-in, Cancel, Reschedule.

### **Patients**
*   `GET /api/patients`: Searchable list.
*   `GET /api/patients/:id`: Full profile details.
*   `POST /api/patients/:id/notes`: Add SOAP note.
*   `POST /api/patients/:id/documents`: Upload file (Multipart).

### **Financials**
*   `GET /api/financials/snapshot`: Dashboard widget data.
*   `GET /api/patients/:id/financials`: Patient specific ledger.

---

## 5. Technical Recommendations

*   **Backend Framework**: Node.js (Express/NestJS) or Python (FastAPI/Django).
*   **Database**: PostgreSQL (Relational data is critical here).
*   **ORM**: Prisma (Node) or SQLAlchemy (Python) for type-safety.
*   **Storage**: AWS S3 or Google Cloud Storage for Patient Documents.
*   **Real-time**: Socket.io for "New Lead" alerts or "Patient Arrived" notifications on Doctor's dashboard.
