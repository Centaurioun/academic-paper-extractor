# Repository Audit: Academic Paper Extractor

## Overview
This document captures a high-level audit of the Academic Paper Extractor repository, focusing on correctness, security, code quality, and performance. Findings are organized by severity and include actionable recommendations.

## 1. Pressing Issues
### 1.1 Blocking Bugs & Security Vulnerabilities
- **Runtime crash from undefined `process` in the browser** – `services/geminiService.ts` reads `process.env.API_KEY` at module top-level. In a Vite + browser environment, `process` is undefined, so importing this module will throw before the app renders.【F:services/geminiService.ts†L5-L11】
  - *Fix:* Use `import.meta.env` with a `VITE_`-prefixed variable, or better, move the Gemini call to a serverless/edge function so the client never imports Node-specific globals.
- **API key exposure risk** – Even if the above bug were resolved, shipping the Gemini API key with client code exposes the credential to every user and allows unrestricted model access from untrusted browsers.【F:services/geminiService.ts†L5-L128】
  - *Fix:* Proxy Gemini requests through a backend that performs authentication, rate limiting, and key rotation.
- **Unreliable third-party globals** – `index.html` loads pdf.js, jspdf, and jspdf-autotable from CDNs and assumes the globals exist when React code runs, but there is no load-order guarantee. Components call into these globals without null checks, which can throw if the CDN script fails or loads slowly.【F:index.html†L9-L27】【F:services/pdfService.ts†L2-L57】【F:components/ExportButtons.tsx†L5-L130】
  - *Fix:* Replace CDN globals with package-managed dependencies or add async loaders with error handling before invoking library APIs.
- **Lack of AI response validation** – The Gemini response is parsed directly with `JSON.parse` without schema validation beyond a catch block; malformed JSON will throw and surface as a generic error, making debugging difficult.【F:services/geminiService.ts†L85-L129】
  - *Fix:* Use `zod`/`io-ts` or TypeScript narrowing against the expected schema and provide user-friendly fallback messaging.

### 1.2 Functional Bugs & UX Gaps
- **PDF worker race condition** – `App.tsx` configures `pdfjsLib.GlobalWorkerOptions.workerSrc` immediately on module load. When pdf.js is fetched as an ES module (`type="module"`), it may not have populated `window.pdfjsLib` yet, so the worker never initializes, causing extraction failures on first load.【F:index.html†L9-L12】【F:App.tsx†L10-L15】
  - *Fix:* Lazily configure the worker inside `extractTextFromPdf` after confirming `pdfjsLib` is defined, or migrate to the official pdf.js worker bundle.
- **Queue state updates miss new files** – `handleFilesAdded` captures `fileStatuses` from the closure. Rapid consecutive uploads can run with stale state and drop files.【F:App.tsx†L79-L92】
  - *Fix:* Use the functional form of `setFileStatuses`/`setProcessingQueue` to guarantee you operate on the latest state.
- **Blocking UI alert for invalid uploads** – `FileUpload` uses `alert`, which blocks the UI thread and is inaccessible to screen readers.【F:components/FileUpload.tsx†L12-L19】
  - *Fix:* Surface validation feedback within the component using ARIA live regions or toast notifications.
- **Missing error fallback in export menu** – `ExportButtons` calls into `jspdf` without verifying the global exists. If the script fails, clicking “PDF Report” crashes the app.【F:components/ExportButtons.tsx†L5-L412】
  - *Fix:* Guard the export handlers with availability checks and present a user-facing error state.

## 2. Code Quality & Maintainability
- **Service layer lacks separation of concerns** – The Gemini service constructs prompts, handles transport, and post-processes results in one function, making it hard to test. Extract prompt generation and response normalization into dedicated helpers to enable unit tests.【F:services/geminiService.ts†L53-L128】
- **State management can be simplified** – `App.tsx` stores data in Maps but converts to arrays on every render, creating extra allocations and complicating updates.【F:App.tsx†L18-L146】 Consider storing files as arrays keyed by `id`, or use a reducer to centralize queue transitions.
- **Magic strings & duplicated literals** – Status strings (`'queued'`, `'parsing'`, etc.) and section identifiers repeat across components. Collocate them in enums/constants to prevent drift.【F:App.tsx†L45-L146】【F:components/FileList.tsx†L14-L79】
- **Tight coupling to CDN-specific globals** – Multiple modules rely on `declare const` statements, which obscures dependency edges and breaks type safety.【F:services/pdfService.ts†L2-L57】【F:components/ExportButtons.tsx†L5-L412】 Prefer explicit imports to keep TypeScript aware of library contracts.
- **UI composition** – `ResultsDisplay` mixes layout, content fallbacks, and formatting logic in a single component. Splitting out subcomponents (e.g., `MetadataGrid`, `SummarySection`) will improve readability and reusability.【F:components/ResultsDisplay.tsx†L33-L118】

## 3. Performance & Scalability Opportunities
- **Client-side PDF parsing on main thread** – Parsing every page sequentially with pdf.js runs on the main thread and blocks rendering for large documents.【F:services/pdfService.ts†L23-L39】 Move parsing into a Web Worker or leverage pdf.js’s worker API to keep the UI responsive.
- **Large prompt payloads** – The app sends up to 30,000 characters of raw PDF text to Gemini for every file, which is expensive and slow, especially for multi-megabyte papers.【F:services/geminiService.ts†L79-L83】 Introduce chunking, summarization, or server-side preprocessing (e.g., section detection) to reduce tokens.
- **Redundant renders while processing queue** – `processFile` toggles `isProcessing` and slices arrays each iteration, causing full component re-renders. A dedicated queue reducer with a `useEffect` worker loop or using `useTransition` could keep state updates minimal.【F:App.tsx†L45-L99】
- **Export rendering overhead** – PDF export performs numerous synchronous layout calculations. For large result sets this can freeze the browser.【F:components/ExportButtons.tsx†L129-L412】 Move export generation to a background worker or lazy-load the export module when the menu opens.

## 4. Suggested Next Steps
1. **Stabilize integrations**: Move Gemini and pdf.js interactions to controlled modules with explicit loading flows. Deploy a backend proxy for AI calls.
2. **Refactor state**: Introduce a reducer or state machine for file processing to avoid Map mutations and stale closures.
3. **Improve UX**: Replace blocking alerts with inline validation, add skeleton/loading states for exports, and surface clear error messages.
4. **Performance hardening**: Offload heavy PDF parsing and PDF export to Web Workers, and evaluate token budgeting strategies before invoking Gemini.

Addressing the high-severity items (API key handling, environment compatibility, and CDN reliance) should be prioritized before expanding features.
