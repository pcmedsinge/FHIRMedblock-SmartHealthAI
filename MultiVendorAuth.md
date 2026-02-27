# Multi-Vendor Authentication & Architecture

## SmartHealthAI — Cross-System Data Strategy

> **Problem:** Our app launches inside Epic via SMART on FHIR, but our patient (Camila) also has records at Community Medical Center (CMC) and potentially other affiliated hospitals. Each vendor has its own FHIR server, its own authentication, and its own patient identity. How do we securely access and merge data from all of them?

---

## Table of Contents

1. [Current State (Demo/Sandbox)](#current-state)
2. [Three Production Architecture Patterns](#three-production-patterns)
   - [Pattern 1: Patient-Initiated Multi-Login](#pattern-1-patient-initiated-multi-login)
   - [Pattern 2: TEFCA / Carequality / CommonWell](#pattern-2-tefca--carequality--commonwell)
   - [Pattern 3: SMART Backend Services](#pattern-3-smart-backend-services-recommended)
3. [OAuth2 vs JWT — Clearing the Confusion](#oauth2-vs-jwt)
4. [App Registration Per Vendor](#app-registration-per-vendor)
5. [Recommended Production Architecture for SmartHealthAI](#recommended-production-architecture)
6. [Patient Identity Matching Across Vendors](#patient-identity-matching)
7. [How Our Current Codebase Maps to Production](#codebase-mapping)
8. [Adding a New Vendor Checklist](#adding-a-new-vendor)

---

## Current State

| Source | Auth Method | Data |
|---|---|---|
| **Epic** | Real SMART on FHIR OAuth2 PKCE (`authorization_code` grant) | Live from Epic sandbox |
| **Community MC** | None — hardcoded synthetic data bundled in TypeScript files | Static bundles in `src/data/synthetic/communityMC/` |

Key files:
- `src/config/smart.ts` — Epic OAuth configuration
- `src/hooks/useEpicData.ts` — Fetches from Epic using OAuth access token
- `src/sources/syntheticSource.ts` — Loads CMC data from static files (no auth)
- `src/hooks/useUnifiedData.ts` — Orchestrates both sources, merge engine, conflict detection

The CMC data is **synthetic** — loaded directly from TypeScript files with zero authentication. This was intentional to prove the merge engine works without needing a second real FHIR server.

---

## Three Production Patterns

### Pattern 1: Patient-Initiated Multi-Login

**How it works:** The patient explicitly logs into each health system separately.

```
Patient launches app from Epic  → Epic OAuth  → get Epic data
Patient clicks "Connect CMC"    → CMC OAuth   → get CMC data
Patient clicks "Connect Hosp B" → Hosp B OAuth → get Hosp B data
App merges all data in the browser
```

**Auth flow for each vendor:**
```
Browser → Vendor's OAuth2 authorize endpoint → Patient enters credentials
       → Vendor returns authorization_code
       → Browser exchanges code for access_token (PKCE)
       → Browser stores token and calls FHIR API
```

**Token management in browser:**
```
sessionStorage / memory:
  epicToken    → talks to Epic FHIR server
  cmcToken     → talks to CMC FHIR server
  hospBToken   → talks to Hospital B FHIR server
```

**Pros:**
- Simplest to implement — each connection is an independent SMART on FHIR launch
- Patient has full visibility and control over which systems are connected
- No backend server required — purely browser-based
- Each token has the patient's explicit consent (patient-level scopes)

**Cons:**
- High friction — patient must know their login at every hospital
- Many patients don't have or remember credentials for every hospital they've visited
- Tokens expire independently, requiring periodic re-authentication
- Does not scale well beyond 2-3 vendors

**Real-world examples:** Apple Health, CommonHealth, most consumer health apps

---

### Pattern 2: TEFCA / Carequality / CommonWell

**How it works:** A trusted health information network handles cross-system queries automatically. The patient only logs into one system.

```
Patient launches app from Epic → Epic OAuth → get Epic data
Epic's network membership automatically queries affiliated networks:
  → Carequality/TEFCA finds CMC has records for this patient
  → CMC returns data through the trusted network
  → No separate CMC login needed
```

**What are these networks?**

| Network | Description |
|---|---|
| **TEFCA** | Trusted Exchange Framework and Common Agreement — US federal framework for nationwide health data exchange |
| **Carequality** | Industry-led network connecting EHR vendors (Epic, Cerner, Meditech, etc.) for document/FHIR exchange |
| **CommonWell** | Health alliance (led by Cerner) for cross-vendor patient identity and data exchange |
| **Epic Care Everywhere** | Epic's proprietary network — when a doctor pulls "outside records" in Epic, this is the mechanism |

**How it works technically:**
```
1. Your SMART app authenticates with Epic (normal OAuth2 PKCE)
2. Your app requests data via Epic's FHIR API
3. Epic (as a network participant) queries Carequality/TEFCA
4. The network locates matching patient records at CMC
5. CMC returns FHIR resources through the network
6. Epic's FHIR API may include these external records in its response
   OR expose them through a special "external records" endpoint
```

**Pros:**
- Zero additional logins for the patient
- Network handles patient matching and trust
- Scales to hundreds of vendors automatically (anyone in the network)
- Regulatory push (21st Century Cures Act) is making this mandatory

**Cons:**
- Your SMART app doesn't directly control what external data is returned
- The EHR (Epic) decides what to expose through its FHIR API
- Not all vendors are on the same network yet
- Data may come as C-CDA documents (XML) rather than discrete FHIR resources, requiring parsing
- Latency — network queries can take 5-15 seconds

**Real-world examples:** Epic Care Everywhere, Carequality connections, eHealth Exchange

---

### Pattern 3: SMART Backend Services (Recommended)

**How it works:** Your backend server is pre-authorized with each vendor. The patient logs in once (Epic), and your server fetches data from other vendors on their behalf.

```
Patient launches app from Epic → Epic OAuth → get Epic data
Your backend server has pre-registered credentials with CMC:
  → Server authenticates with CMC using signed JWT
  → Server searches for patient by demographics (name + DOB)
  → Server fetches clinical data
  → Returns merged result to browser
```

**Detailed auth flow for backend-to-vendor:**
```
1. ONE-TIME SETUP (during app registration):
   - Generate RSA key pair (public + private key)
   - Register app with CMC's developer portal
   - Upload public key to CMC
   - Receive client_id from CMC

2. RUNTIME (every time you need CMC data):
   a. Your server creates a JWT assertion:
      {
        "iss": "your-client-id-at-cmc",        // who you are
        "sub": "your-client-id-at-cmc",        // same
        "aud": "https://cmc.org/oauth2/token", // CMC's token endpoint
        "exp": 1735689600,                      // 5 min from now
        "jti": "unique-random-id"               // prevents replay
      }
   
   b. Server SIGNS the JWT with its private key (RS384)
   
   c. Server sends to CMC's token endpoint:
      POST https://cmc.org/oauth2/token
      Content-Type: application/x-www-form-urlencoded
      
      grant_type=client_credentials
      &scope=system/Patient.read system/MedicationRequest.read ...
      &client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
      &client_assertion=<signed-jwt>
   
   d. CMC verifies JWT signature using your registered public key
   
   e. CMC returns an access_token:
      { "access_token": "abc123...", "expires_in": 300, "token_type": "bearer" }
   
   f. Server uses token to call CMC's FHIR API:
      GET https://cmc.org/fhir/r4/Patient?family=Lopez&birthdate=1987-09-12
      Authorization: Bearer abc123...
   
   g. Server fetches all clinical data for matched patient
```

**Pros:**
- Patient only logs in once (Epic)
- Your server has full control over which vendors to query
- Server-side patient matching is more reliable (access to full demographics)
- Tokens and keys are managed securely on the server (never exposed to browser)
- Works with any vendor that supports SMART Backend Services (HL7 standard)
- Can add vendors without changing the frontend at all

**Cons:**
- Requires a backend server (our app is currently a pure SPA)
- Each vendor must approve your app registration (can take weeks/months)
- You're responsible for patient identity matching (demographics-based)
- Server must securely store private keys
- System-level scopes (`system/*.read`) give access to ALL patients — security responsibility is high

**Real-world examples:** Health Gorilla, Particle Health, most clinical data aggregators

---

## OAuth2 vs JWT

**Common misconception:** "JWT replaces OAuth for backend services."

**Reality:** JWT is a *credential format within OAuth2*, not a replacement for it.

| Aspect | Patient-Facing (Epic) | Backend Service (CMC) |
|---|---|---|
| **OAuth2 grant type** | `authorization_code` with PKCE | `client_credentials` |
| **Who authenticates?** | The **patient** (Camila) in the browser | Your **server** (no human involved) |
| **Credential used** | Patient's Epic username/password | Server's **signed JWT** (proves server identity) |
| **Result** | OAuth2 `access_token` | OAuth2 `access_token` |
| **FHIR API calls** | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` — **identical** |
| **Token lifetime** | Typically 1 hour | Typically 5 minutes |
| **Refresh** | `refresh_token` grant | Generate new JWT, request new token |

**Both flows are OAuth2.** The signed JWT is simply how your server proves its identity to the vendor's token endpoint, instead of a patient typing in a username/password. The end result in both cases is an OAuth2 access_token that you use to call the FHIR API.

```
Patient login:
  "I'm Camila, here's my password" → vendor gives access_token

Backend service:
  "I'm SmartHealthAI server, here's my signed JWT to prove it" → vendor gives access_token
```

---

## App Registration Per Vendor

Just like we registered our app on Epic's developer portal, we must register with every vendor we want to connect to.

```
┌─────────────────────────────────────────────────────────────┐
│              APP REGISTRATION (one-time per vendor)          │
├────────────────┬────────────────────────────────────────────┤
│ Epic           │ ✅ Already done                            │
│                │ • Portal: fhir.epic.com/Developer          │
│                │ • client_id: 0e79595c-d549-...             │
│                │ • Grant: authorization_code (PKCE)         │
│                │ • Scopes: patient/*.read                   │
│                │ • Type: Public client (browser SPA)        │
├────────────────┼────────────────────────────────────────────┤
│ CMC (Cerner)   │ Register on Cerner's developer portal      │
│                │ • Portal: code.cerner.com                  │
│                │ • Get: client_id                           │
│                │ • Upload: your server's public key (JWKS)  │
│                │ • Grant: client_credentials                │
│                │ • Scopes: system/*.read                    │
│                │ • Type: Confidential client (backend)      │
├────────────────┼────────────────────────────────────────────┤
│ Hospital C     │ Register on their dev portal               │
│ (Meditech)     │ • Same process as CMC                      │
│                │ • Different client_id, different key pair   │
│                │ • Each vendor has its own portal/process    │
├────────────────┼────────────────────────────────────────────┤
│ Hospital D     │ Register on their dev portal               │
│ (Allscripts)   │ • Same SMART Backend Services standard     │
│                │ • Same pattern, different credentials       │
└────────────────┴────────────────────────────────────────────┘
```

**What you provide during registration:**
1. App name and description
2. FHIR scopes requested (`system/Patient.read`, `system/MedicationRequest.read`, etc.)
3. Your server's **public key** (JWKS format) — so the vendor can verify your signed JWTs
4. Redirect URI (for patient-facing flows only)
5. Organization details, privacy policy, terms of use

**What you receive:**
1. `client_id` — unique identifier for your app at that vendor
2. FHIR base URL — e.g., `https://cmc.org/fhir/r4`
3. Token endpoint — e.g., `https://cmc.org/oauth2/token`
4. Any vendor-specific documentation or limitations

---

## Recommended Production Architecture

For SmartHealthAI, **Pattern 3 (SMART Backend Services)** is the recommended approach, with the architecture below:

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                       │
│                                                               │
│  1. SMART on FHIR launch from Epic EHR                       │
│  2. OAuth2 authorization_code + PKCE → Epic access_token     │
│  3. Fetch Epic data directly (patient/* scopes)              │
│  4. Call backend API: POST /api/external-sources              │
│     Body: { patientDemographics, epicPatientId }             │
│  5. Receive merged external data                              │
│  6. Run merge engine + conflict detection in browser          │
│  7. Render unified UI (no code changes needed)                │
│                                                               │
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                    │
│                                                               │
│  Vendor Registry (config/database):                          │
│  ┌──────────┬──────────────────┬─────────────┬─────────┐    │
│  │ Vendor   │ FHIR Base URL    │ client_id   │ Key     │    │
│  ├──────────┼──────────────────┼─────────────┼─────────┤    │
│  │ CMC      │ cmc.org/fhir/r4  │ abc-123     │ key_cmc │    │
│  │ Hosp B   │ hospb.org/fhir   │ def-456     │ key_hb  │    │
│  │ Hosp C   │ hospc.org/fhir   │ ghi-789     │ key_hc  │    │
│  └──────────┴──────────────────┴─────────────┴─────────┘    │
│                                                               │
│  For each registered vendor:                                  │
│   1. Create signed JWT with vendor's client_id               │
│   2. POST to vendor's token endpoint → get access_token      │
│   3. Search Patient by demographics (name + DOB + gender)    │
│   4. If match found, fetch all clinical resources             │
│   5. Return all vendor data to browser                        │
│                                                               │
│  Security:                                                    │
│   • Private keys stored in vault (AWS KMS / Azure Key Vault) │
│   • Vendor tokens cached with short TTL (5 min)              │
│   • All requests logged for audit trail                      │
│   • HIPAA-compliant infrastructure                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Patient Identity Matching

When your backend fetches data from CMC, it needs to find *the same patient* (Camila Lopez). There is no universal patient ID across vendors.

**Matching strategies (in order of reliability):**

| Method | Confidence | How |
|---|---|---|
| **MPI (Master Patient Index)** | Highest | Centralized service maintains cross-system patient links. Enterprise-level solution. |
| **Demographics match** | High | Match on `family name + given name + birthDate + gender`. Our `patientMatcher.ts` already does this. |
| **MRN cross-reference** | Medium | If hospitals share an MRN namespace (affiliated systems). Not universal. |
| **SSN / Insurance ID** | Medium | Works but carries privacy/regulatory risk. Avoid if possible. |

**Our current implementation** (`src/sources/patientMatcher.ts`) uses demographics matching — this is the same approach that would be used in production.

---

## Codebase Mapping

How our current code maps to the production architecture:

| Current Code | Current Behavior | Production Change |
|---|---|---|
| `src/config/smart.ts` | Epic OAuth config | No change — still used for patient-facing Epic auth |
| `src/hooks/useEpicData.ts` | Fetches from Epic via OAuth token | No change — still fetches Epic data in browser |
| `src/sources/syntheticSource.ts` | Loads static CMC bundles from TS files | **Replace with** `fetch("/api/external-sources", ...)` — call backend API |
| `src/sources/patientMatcher.ts` | Demographics matching in browser | **Move to** backend server (match before fetching vendor data) |
| `src/sources/mergeEngine.ts` | Merges data from all sources | No change — still runs in browser with data from all sources |
| `src/sources/conflictDetector.ts` | Detects cross-system conflicts | No change — still runs in browser |
| `src/hooks/useUnifiedData.ts` | Orchestrates Epic + synthetic + merge | **Minor update** — replace synthetic fetch with backend API call |

**Key insight:** The merge engine, conflict detector, parsers, and entire UI remain **completely unchanged**. Only the data-fetching layer for non-Epic sources changes from "load static files" to "call backend API."

---

## Adding a New Vendor

### Checklist for connecting a new hospital/vendor:

- [ ] **Register your app** on the vendor's developer portal
- [ ] **Generate** a new RSA key pair for this vendor (or reuse if vendor allows)
- [ ] **Upload** your public key (JWKS) to the vendor
- [ ] **Receive** `client_id`, FHIR base URL, token endpoint
- [ ] **Add vendor config** to your backend's vendor registry
- [ ] **Test** token acquisition: signed JWT → access_token
- [ ] **Test** patient search: `GET /Patient?family=Lopez&birthdate=1987-09-12`
- [ ] **Test** clinical data fetch: medications, labs, conditions, etc.
- [ ] **Verify** data flows through existing merge engine correctly
- [ ] **No frontend changes needed** — new vendor data appears automatically

### Vendor configuration structure:

```typescript
interface VendorConfig {
  vendorId: string;           // "community-mc"
  vendorName: string;         // "Community Medical Center"
  fhirBaseUrl: string;        // "https://cmc.org/fhir/r4"
  tokenEndpoint: string;      // "https://cmc.org/oauth2/token"
  clientId: string;           // "abc-123-def"
  privateKeyId: string;       // Reference to key in vault
  scopes: string[];           // ["system/Patient.read", ...]
  enabled: boolean;           // Toggle without code changes
  patientSearchStrategy: "demographics" | "mpi" | "mrn-crossref";
}
```

---

## What If a Vendor Doesn't Support SMART Backend Services?

| Scenario | Fallback |
|---|---|
| Vendor supports SMART on FHIR but only patient-facing | Use **Pattern 1** — patient logs in separately for that vendor |
| Vendor is on Carequality/TEFCA | Use **Pattern 2** — data comes through the network via Epic |
| Vendor only supports C-CDA (XML documents) | Parse C-CDA into FHIR resources on your backend, then feed into merge engine |
| Vendor has a proprietary API (non-FHIR) | Build a vendor-specific adapter on your backend that normalizes to FHIR format |
| Vendor has no API at all | Patient uploads records manually (PDF/CCR) — requires document parsing |

---

## Summary

| Question | Answer |
|---|---|
| Does CMC need OAuth too? | **Yes** — every FHIR vendor requires OAuth2. Your backend authenticates using SMART Backend Services (`client_credentials` + signed JWT). |
| Does the patient log into CMC? | **No** (Pattern 3). Your backend is pre-authorized. Patient identity is matched by demographics. Patient only logs into Epic. |
| Is JWT a replacement for OAuth? | **No.** JWT is a credential format *within* OAuth2. The signed JWT proves your server's identity to the vendor's token endpoint. The result is still an OAuth2 access_token. |
| Do we register with every vendor? | **Yes.** Each vendor has its own developer portal, its own client_id, and its own key registration — just like we did with Epic. |
| How much frontend code changes? | **Almost none.** Only `syntheticSource.ts` changes from loading static files to calling a backend API. Everything else (merge, conflicts, UI) stays the same. |
