# SmartHealthAI — Demo Script

A 5-step walkthrough for peer demos. Total time: ~5 minutes.

---

## Setup (Before the Demo)

1. Make sure the app is running: `npm run dev`
2. Have your `.env.local` configured with `VITE_AI_API_KEY` for full AI features
3. Open http://localhost:3000 in Chrome or Edge

---

## Step 1: Launch & OAuth

**Action:** Click **Connect to Epic** on the launch page.

**Talking points:**
- "This is a SMART on FHIR app — it uses the same OAuth2 standard that Apple Health and other apps use to connect to Epic."
- "No passwords are stored. The patient authorizes access through Epic's own login."

**What happens:** You'll be redirected to Epic's sandbox login. Select a test patient (e.g., **Camila Lopez**).

---

## Step 2: Dashboard — AI-Powered Health Overview

**Action:** After OAuth, you land on the Dashboard.

**Talking points:**
- "Notice the alert banner at the top — the AI flagged a drug interaction that exists across two different healthcare systems. Neither system knows about the other's prescriptions."
- "These aren't just data displays. The rule-based engine runs instantly on every page load, checking for drug interactions, care gaps, lab abnormalities, and source conflicts."
- "The stat cards show data aggregated from multiple providers — one unified view."

**What to highlight:**
- Alert banner with severity badges (critical/high/medium)
- Click an alert to expand — shows clinical details, affected records, and source badges
- Connected providers at the bottom with source-colored badges

---

## Step 3: Medications — Cross-System Drug Safety

**Action:** Navigate to **Medications** in the sidebar.

**Talking points:**
- "See the source badges on each medication — violet (E) for Epic, blue (C) for Community Medical Center. This patient gets prescriptions from two different systems."
- "The interaction strip at the top shows which specific drug pairs interact and what the effect is."
- "Click any medication to see details. If AI is enabled, click 'Ask AI' for a plain-language explanation."
- "The 'Visit Topics' tab generates questions to discuss with your doctor — personalized to your actual medication list."

**What to highlight:**
- Source badges (E/C) on each med row
- Interaction warnings with drug pair names
- AI Summary panel (if API key configured)

---

## Step 4: Labs & Trends — AI Explains Your Numbers

**Action:** Navigate to **Labs & Vitals** in the sidebar.

**Talking points:**
- "Labs from both systems are merged and grouped by test type. Source badges show which system each result came from."
- "Select a test to see the trend chart — the AI narrates what the trend means in plain language."
- "Click 'How Meds Affect You' to see correlations — like how a medication might be affecting your lab values."

**What to highlight:**
- Grouped test list with abnormal badges
- Trend sparkline chart for selected test
- AI trend narrative (Tier 2)
- Medication-lab correlations

---

## Step 5: Pre-Visit Report — Bring This to Your Doctor

**Action:** Navigate to **Visit Prep** in the sidebar.

**Talking points:**
- "This is the killer feature. Click 'Generate AI Narrative' to create a comprehensive pre-visit report."
- "The report summarizes medications, lab trends, safety alerts, and questions — all in one page."
- "Click 'Download PDF' to save it. The patient can print this and bring it to their appointment."
- "This is what patient portals should be — not just data access, but data intelligence."

**What to highlight:**
- 3-column newspaper layout showing all health domains
- AI-generated narrative (requires API key)
- PDF download button
- Disclaimer at the bottom (AI guardrails)

---

## Closing Points

- **"Think, don't list"** — Every view tells an AI story, not just a data dump
- **Cost-optimized** — First demo costs ~$0.05 in API calls; repeats are free (cached)
- **Works without AI** — Remove the API key and the app still functions with rule-based analysis
- **Real standards** — SMART on FHIR OAuth2, FHIR R4 resources, proper source tagging
