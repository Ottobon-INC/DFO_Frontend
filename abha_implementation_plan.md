# ABDM/ABHA Frontend Implementation Plan

Based on an inspection of the existing frontend repository, here is the implementation plan for integrating the ABDM/ABHA functionality into the DFO Digital OP Desk.

## 1. Where the ABHA section should appear in Patient Profile
The ABHA section should be added to the **Overview** tab (`activeTab === 'overview'`) in `PatientProfile.tsx`. The best placement is in **Column 1**, directly below the existing "Demographics" widget. This keeps identity-related information grouped together and highly visible to the clinical staff.

## 2. Whether ABHA should also be offered immediately after patient registration
**Yes.** In `ClinicRegistrationForm.tsx`, when a patient is successfully registered, a `successModalData` modal is displayed with a "Continue" button. We should add a secondary action here: **"Link/Create ABHA"** alongside the "Continue" (or "Skip for now") button. This encourages immediate ABHA capture during the initial intake flow.

## 3. Which existing UI components can be reused
- **Modal Patterns:** The `createPortal` pattern with a backdrop (`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`) used in `ClinicRegistrationForm` and `PatientProfile`.
- **Inputs:** The standard styled inputs (`w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary`).
- **Notifications:** `toast` from `react-hot-toast` for all success and error alerts.
- **Buttons:** Existing primary (`bg-brand-primary text-white`) and secondary (`bg-brand-surface border border-brand-border`) button styles, including the `animate-spin` loading state.

## 4. Which new components are required
- **`AbhaIntegrationWidget.tsx`**: A widget for the Patient Profile to display the current ABHA status (Linked/Not Linked) and provide buttons to initiate the creation or verification flows.
- **`AbhaFlowModal.tsx`**: A multi-step modal component to handle both Creation and Verification flows. It will manage the internal step state (Input ID -> OTP -> Address Selection).

## 5. Which API methods must be added to `services/api.ts`
The following methods need to be added to interface with the existing backend capabilities:
```typescript
requestAbhaCreationOtp(aadhaar: string)
verifyAbhaCreationOtp(txnId: string, otp: string)
suggestAbhaAddress(txnId: string)
createAbhaAddress(txnId: string, abhaAddress: string)
requestAbhaVerificationOtp(abhaNumber: string)
verifyAbhaVerificationOtp(txnId: string, otp: string)
linkAbhaToPatient(patientId: string, abhaData: any)
```

## 6. Required frontend state for each ABHA workflow
The `AbhaFlowModal` will require the following state variables:
- `flowType`: `'CREATION' | 'VERIFICATION'`
- `step`: `'INPUT_ID' | 'VERIFY_OTP' | 'SELECT_ADDRESS' | 'SUCCESS'`
- `txnId`: `string | null`
- `aadhaarNumber`: `string`
- `abhaNumber`: `string`
- `otp`: `string`
- `suggestedAddresses`: `string[]`
- `selectedAddress`: `string`
- `isLoading`: `boolean`

## 7. How patientId should be obtained and passed
- **In `PatientProfile.tsx`:** The `patient.id` is already available in the component's props. It should be passed down to the `AbhaIntegrationWidget` and subsequently to the `AbhaFlowModal`.
- **In `ClinicRegistrationForm.tsx`:** The `finalPatientId` is returned upon successful patient creation. This ID should be passed to the `AbhaFlowModal` when the user clicks "Link/Create ABHA" on the success screen.

## 8. How txnId should be maintained between OTP steps
The `txnId` should be stored in the React state (`const [txnId, setTxnId] = useState<string | null>(null)`) of the parent `AbhaFlowModal` component. It is received from the initial OTP request API response and must be passed in the payload for the subsequent OTP verification API calls.

## 9. Which sensitive values must be cleared after each flow
`aadhaarNumber`, `otp`, and `txnId` must be explicitly cleared from state (set to empty strings or null) immediately upon successful linking, upon a terminal failure, or when the modal is closed/unmounted to prevent sensitive data leakage.

## 10. How ABHA Number and ABHA Address should be displayed/masked
- **ABHA Number:** Must be masked in the UI, showing only the last 4 digits (e.g., `XX-XXXX-XXXX-1234`).
- **ABHA Address:** Displayed in plaintext (e.g., `john.doe@abdm`), as it functions as a public username/VPA and is not considered highly sensitive.

## 11. How the UI should handle backend 409 Conflict responses
If the backend returns a 409 Conflict (indicating the ABHA is already linked to another patient record), the API wrapper will throw an error. The UI should catch this, display a clear `toast.error("This ABHA number is already linked to another patient.")`, and reset the modal state to the initial step, allowing the user to cancel or try a different number.

## 12. How the UI should refresh patient ABHA information after successful linking
- **In `PatientProfile.tsx`:** Trigger the existing `fetchPatientDetails()` function. This will pull the updated patient record containing the newly linked ABHA details and automatically update the UI.
- **In `ClinicRegistrationForm.tsx`:** The ABHA data is linked to the newly created patient in the backend. Closing the modal and proceeding with the standard check-in flow is sufficient.

## Files that need to change:
1. `components/PatientProfile.tsx` (Add widget to Overview tab)
2. `components/ClinicRegistrationForm.tsx` (Add ABHA option to success modal)
3. `services/api.ts` (Add ABHA endpoints)
4. `types.ts` (Add `abhaNumber` and `abhaAddress` to the `Patient` interface)
5. `components/AbhaIntegrationWidget.tsx` (New File)
6. `components/AbhaFlowModal.tsx` (New File)
