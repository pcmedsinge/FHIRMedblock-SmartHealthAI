# Phase 0 — Foundation
**Status: DONE**

## Goal
Establish the base infrastructure: build tooling, SMART on FHIR OAuth2 PKCE flow, patient demographics, token management, error handling, and UI primitives.

## What Was Built
Ported from EpicSmartPatientApp-2 (selective port — only auth/FHIR essentials):

- **Vite + React 19 + TypeScript 5.9 + Tailwind CSS v4** — Build toolchain
- **SMART on FHIR OAuth2 PKCE flow** — Launch → Epic OAuth → Callback → Authenticated client
- **Patient demographics hook** — `usePatient()` with module-level cache
- **Token monitor** — Session expiry warnings via `useTokenMonitor()`
- **Toast notification system** — Global toast context for user feedback
- **Error handling** — `fhirErrorHandler` classifies FHIR errors into user-friendly messages
- **UI primitives** — LoadingSpinner, ErrorDisplay, ToastContainer

## Files

| File | Purpose |
|------|---------|
| `src/config/smart.ts` | SMART on FHIR configuration (client ID, scopes, redirect URIs) |
| `src/context/FhirContext.tsx` | Authenticated FHIR client context provider |
| `src/context/ToastContext.tsx` | Toast notification system |
| `src/hooks/useFhirClient.ts` | Hook to access authenticated FHIR client |
| `src/hooks/usePatient.ts` | Patient demographics with module-level cache |
| `src/hooks/useTokenMonitor.ts` | Token expiry monitor with session warnings |
| `src/utils/tokenManager.ts` | Token lifecycle management |
| `src/utils/fhirErrorHandler.ts` | Error classification & friendly messages |
| `src/utils/patientParser.ts` | FHIR Patient resource → PatientDemographics type |
| `src/types/patient.ts` | Patient type definitions |
| `src/components/ui/LoadingSpinner.tsx` | Loading indicator |
| `src/components/ui/ErrorDisplay.tsx` | Error display component |
| `src/components/ui/Toast.tsx` | Toast notification component |
| `src/pages/LaunchPage.tsx` | Epic OAuth login screen |
| `src/pages/CallbackPage.tsx` | OAuth callback handler |

## Verification
- App launches at `/launch` and redirects to Epic OAuth
- Callback at `/callback` receives token and initializes FHIR client
- Patient demographics load and display correctly
- Token expiry warnings appear before session timeout
- Errors show user-friendly messages
