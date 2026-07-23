# Requirement: JanmaSethu Clinic Onboarding & Operational Setup Flow

## 1. Feature Goal
Build a simplified and robust onboarding process that allows a fertility clinic or hospital to transition from clinic creation to full operational readiness. The feature will guide clinic administrators through setting up their profile, registering staff/doctors, defining schedules, and configuring appointment types.

---

## 2. Supported Setup Steps
| Step | Phase | Description |
|---|---|---|
| **Clinic Profile Setup** | Setup Step 1 | Enter hospital name, contact details, timezone, logo, and clinic settings. |
| **Staff & Doctor Onboarding** | Setup Step 2 | Register doctors, nurses, receptionists, and assign roles/permissions. |
| **Doctor Availability & Hours** | Setup Step 3 | Configure daily working hours, slot rules, weekly offs, and holidays. |
| **Appointment Type Config** | Setup Step 4 | Create consultation, procedure, scan, and emergency options with custom durations. |
| **Document Templates & Consents** | Setup Step 5 | Upload standard templates for patient intake, bills, and medical consent. |

---

## 3. Main User Flow
```
Clinic Created
      ↓
Onboarding Welcome Wizard
      ↓
1. Complete Clinic Profile Details
      ↓
2. Add Hospital Staff (Admins, Doctors, Nurses, Receptionists)
      ↓
3. Set Clinic Working Hours & Doctor Availability Slots
      ↓
4. Define Appointment Types (Duration, Doctor Mapping, Billing)
      ↓
5. Upload Document & Consent Templates
      ↓
Go-Live Checklist Completed
      ↓
Operational State (Ready for Booking & Patient Care)
```

---

## 4. System & Routing Logic
| Component | Logic / Rule |
|---|---|
| **Dynamic Slot Generator** | Automatically generates booking slots based on daily hours minus holidays and blocked leaves. |
| **Schedule Router** | Matches patient appointment types to correct doctor availability schedules and specialties. |
| **Template Merger** | Combines patient clinical details with uploaded consent templates to create signed PDF copies. |

---

## 5. Frontend Requirements
The frontend should include:
* **Interactive Onboarding Wizard:** A step-by-step progress indicator guiding admins through the initial setup.
* **Go-Live Checklist Widget:** A dashboard status panel showing completed vs. pending operational steps.
* **User & Team Management UI:** Interactive forms to add staff, assign system roles, and view active personnel.
* **Availability Scheduler Grid:** A calendar-based settings panel to define daily slots, holidays, and weekly doctor hours.
* **Appointment Type Form:** Fields to specify appointment title, duration (in minutes), department, assigned doctor, and payment requirement status.
* **Document Template Panel:** Drag-and-drop file uploaders for clinic logos and digital consent forms.

---

## 6. Backend Requirements
The backend should:
1. Initialize a `clinic_onboarding_checklist` record for every new clinic.
2. Provide endpoints to update clinic profile info and metadata.
3. Validate added staff profiles and generate secure user activation invites.
4. Block duplicate scheduling configurations for the same doctor.
5. Provide a dynamic API endpoint to fetch available time slots for a given doctor and date.
6. Validate that appointment bookings align with configured working hours and doctor availability.
7. Save and serve custom appointment types with their associated costs/durations.
8. Store and manage document/consent template assets securely.
9. Verify onboarding completion status before opening the clinic for patient bookings.

---

## 7. Database Requirements
Required PostgreSQL tables:
| Table Name | Purpose |
|---|---|
| **`clinics`** | Stores general hospital/clinic details, location, and metadata. |
| **`clinic_onboarding_checklists`** | Tracks onboarding completion status for each step. |
| **`clinic_working_hours`** | Defines general start/end times and weekly off-days for the hospital. |
| **`doctor_availabilities`** | Stores weekly recurring shift hours per doctor. |
| **`doctor_leaves_holidays`** | Tracks one-off leaves, public holidays, or blocked slots. |
| **`appointment_types`** | Configures different service categories, durations, and payment requirements. |
| **`consent_templates`** | Stores HTML/PDF templates for clinic consent sheets and reports. |

---

## 8. Onboarding Output Types
The system should establish:
* Active hospital scheduling portal.
* Patient-facing online booking slot options.
* Multi-role system access tokens (for Admin, Doctor, Nurse, Front Desk, and CRO).
* Configured billing catalog (based on appointment types).
* Automated patient notification triggers (SMS/Email templates).

---

## 9. Business Rules
* **No Double-Booking:** The system must prevent booking two appointments in the same slot for one doctor.
* **Minimum Setup Rule:** The hospital cannot go live or register patients until at least one admin, one doctor, and one appointment type are created.
* **Slot Alignment:** All appointments must fit exactly into the defined slot duration of their selected appointment type.
* **Schedule Integrity:** A doctor cannot have availability hours that exceed the general working hours of the clinic.

---

## 10. MVP Scope
MVP includes:
* Basic 4-step configuration wizard.
* User management form to add doctors, nurses, and front desk staff.
* Standard weekly calendar availability builder for doctors.
* Setup panel for 4 standard appointment types (Consultation, Scan, Procedure, Follow-up).
* Onboarding checklist progress tracker widget.
* Backend APIs and database schemas to support the above fields.

---

## 11. Not in MVP
Not included in the first version:
* Real-time automated scheduling optimizations using AI.
* Multi-branch hospital routing/roster management.
* Custom intake form creator (drag-and-drop form builder for patient details).
* Video call telehealth setup.
* Auto-calculation of doctor payouts/revenue split rules.

---

## 12. Summary
This feature transforms new clinic registrations into functional digital hospitals.
```
Clinic Registry
      ↓
Onboarding Checklist Setup
      ↓
Staff, Doctor Schedules, & Service Configuration
      ↓
Dynamic Booking & Operational Readiness
```
