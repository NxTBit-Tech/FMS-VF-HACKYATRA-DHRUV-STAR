# GVMC Departmental File Management System - Frontend Client

This folder contains the React + Vite + Tailwind CSS + GSAP dashboard client built to connect to the express-supabase backend.

## Library & Architecture Choices

### 1. Camera Scanning Library
- **Library:** `@yudiel/react-qr-scanner`
- **Rationale:** Highly lightweight, optimized for React 18+, and uses browser HTML5 media streams directly. It integrates seamlessly into mobile viewport overlays.
- **Fallback:** Includes a manual reference text search input in case camera access permissions are denied.

### 2. Authentication & Session Storage
- **Approach:** We store the JWT Bearer token and user details inside `sessionStorage` rather than `localStorage`.
- **Security Rationale:** `sessionStorage` prevents XSS token persistence across browser restarts or tab duplicates. It ensures the token is discarded automatically when the user closes their tab.

## Backend Gaps & Unwired Features

During our end-to-end backend audit, the following missing requirements were handled via frontend overrides:

1. **Recipients list for Dispatches (`GET /users` missing):**
   - The backend validates the destination user's role on dispatch but has no public endpoint to list officers.
   - **Workaround:** We provide a hardcoded dropdown roster of typical pilot officers mapped to their roles, plus a numeric manual override input so you can target custom database IDs.
2. **Workflow Builder template persistence (`workflow_templates` table inactive):**
   - The database contains a `workflow_templates` table but no endpoint or SQL materializer is wired to compile JSON config objects into live stages.
   - **Workaround:** The Workflow Setup page is presented as a sandbox UI shell with the "Save" control marked "Not connected to the backend" to avoid faking persistence.
