# Architecture & Implementation Handoff: Single-Owner Admin Access for Online Art Gallery

## 1. Context & Objectives
This project is an online art gallery built within a single unified web application. It accommodates two classes of users:
1. **Public Viewers:** Read-only access to view art pieces and galleries.
2. **Owner / Admin (Single User):** Full management controls (CRUD for artwork, metadata editing, layout customization, uploads).

### Hard Constraints
* **Unified Application:** No separate admin panel app, external dashboard website, or isolated repository. Everything must live in the same project.
* **Invisible Authentication UI:** Public visitors must **never** see login prompts, "Sign In" buttons, username/password fields, or visible UI links indicating an admin surface exists.
* **Zero Public Attack Surface:** Prevent casual scanning or credential stuffing against public forms.
* **Strict Backend Authorization:** Security through obscurity (hiding UI) is not security. All state-mutating API routes and sensitive data queries must enforce strict server-side authorization (`401 Unauthorized` on failure).

---

## 2. Authentication Strategies (Handoff Options)

Here are the four implementation approaches evaluated for this architecture. The recommended setup is a combination of **Strategy 2 or 3** paired with **Section 3 (Bundle Splitting & Authorization Enforcement)**.

---

### Strategy 1: Obscure, Unlinked Route (Simplest)
Do not mount any visible login entry points anywhere across public-facing layouts, navbars, or footers.

* **Mechanism:**
  * Define an unlinked route known strictly to the owner (e.g., `/manage-access`, `/studio/gate`, or an obscure path like `/_x9`).
  * Direct browser navigation to this path renders a lightweight authentication form (or automatically starts an OAuth / passkey dance).
  * On successful authentication, an `HttpOnly`, `Secure`, `SameSite=Strict` session cookie or JWT is set.
* **Hardening Requirements:**
  * Implement strict IP-based rate limiting on this route and its companion API endpoints (e.g., 3 failed requests per 15 minutes).
  * Configure `robots.txt` and meta headers to prevent search engines from indexing the route:
    ```html
    <meta name="robots" content="noindex, nofollow" />
    ```
* **Pros:** Fast to implement, works natively with standard router navigation.
* **Cons:** Path discovery is possible if client-side router source bundles expose static route tables without code splitting.

---

### Strategy 2: Secret Keystroke / Gesture Trigger (Zero Exposed URLs)
Eliminate distinct login URLs from the frontend router entirely. The entire application operates under public routes, but contains a hidden client-side listener that unlocks the login interface.

* **Mechanism:**
  * **Option A (Keyboard Sequence):** Listen for a specific global hotkey combination (e.g., `Ctrl + Shift + Alt + A`) or a typed sequence (e.g., typing `manage` in sequence on the window).
  * **Option B (Gesture / Click Counter):** Listen for multiple fast clicks on an inconspicuous static element (e.g., clicking the footer's `©` copyright symbol 5 times within a 3-second window).
  * **Behavior:** When triggered, the listener dynamically mounts a hidden authentication modal or kicks off an OAuth / WebAuthn prompt.
* **Example Implementation (React):**
  ```tsx
  import { useEffect, useState, lazy, Suspense } from "react";

  const AdminAuthModal = lazy(() => import("./AdminAuthModal"));

  export function useSecretTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Example: Ctrl + Shift + Alt + A
        if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === "A" || e.key === "a")) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return { isOpen, close: () => setIsOpen(false) };
  }
  ```
* **Pros:** Leaves zero trace of login forms or routes in browser history or search engine indexers.
* **Cons:** Requires the client bundle to handle listener logic (must use lazy loading so admin modal code is not loaded prematurely).

---

### Strategy 3: Magic Link / CLI Dispatch (No Frontend Login Form)
Completely eliminate username and password input elements from the frontend client codebase.

* **Mechanism:**
  1. **Out-of-band Initiation:** The owner requests access without using browser UI:
     * **CLI / Terminal:** Execute a local script calling a protected backend endpoint:
       ```bash
       curl -X POST https://gallery.example.com/api/auth/request-link \
         -H "Authorization: Bearer <LOCAL_DEVELOPMENT_SECRET>"
       ```
     * **Or Pre-shared Secret Request:** A single backend endpoint that triggers an email if requested with a specific hash.
  2. **Magic Link Delivery:** The server generates a cryptographically signed, short-lived (e.g., 5-minute), single-use token and sends a magic link to the owner's verified email.
  3. **Verification & Session Creation:**
     * The owner clicks the link: `https://gallery.example.com/api/auth/verify?token=<TOKEN>`.
     * The backend validates the cryptographic signature, marks the token used, issues a secure `HttpOnly` session cookie, and redirects the browser back to `/` with admin permissions active.
* **Pros:** Frontend contains zero login forms, zero credential-handling code, and zero UI surfaces. Eliminates credential stuffing risks entirely.
* **Cons:** Requires an email service (Resend, SendGrid, Amazon SES) and terminal/email access to initiate sessions.

---

### Strategy 4: Network & Reverse Proxy Layer Protection (Most Robust)
Enforce access control at the network or TLS level before traffic ever reaches the application layer.

* **Mechanism:**
  * **Mutual TLS (mTLS):** Require a client certificate installed directly in the owner's browser or device. The reverse proxy (Nginx, Caddy, or Cloudflare) terminates connections without a valid certificate at the TLS handshake level. Public users cannot even initiate an HTTP request to administrative endpoints.
  * **Zero Trust Tunnel / Cloudflare Access:** Protect `/admin/*` or management endpoints via Cloudflare Access, Tailscale, or a private VPN, requiring multi-factor authentication at the edge before proxying to the application.
* **Pros:** Hardware/certificate-backed protection. Impossible for unauthenticated public traffic to hit backend application logic.
* **Cons:** Adds infrastructure configuration overhead.

---

## 3. Frontend Architecture: Code Splitting & Leak Prevention

To ensure the public cannot inspect source code to reveal admin controls, component structures, or sensitive endpoints:

1. **Lazy Loading (Dynamic Imports):**
   * Do **not** statically import admin components (e.g., `<ArtworkUploader />`, `<EditControls />`, `<DeleteDialog />`) into the main bundle.
   * Dynamically import them only after a verified admin session is confirmed:
     ```tsx
     import React, { lazy, Suspense } from "react";
     import { useAdminSession } from "./hooks/useAdminSession";

     const AdminToolbar = lazy(() => import("./components/admin/AdminToolbar"));
     const ArtworkEditor = lazy(() => import("./components/admin/ArtworkEditor"));

     export function GalleryItem({ item }) {
       const { isAdmin } = useAdminSession();

       return (
         <div className="gallery-card">
           <img src={item.imageUrl} alt={item.title} />
           <h3>{item.title}</h3>
           
           {isAdmin && (
             <Suspense fallback={null}>
               <ArtworkEditor itemId={item.id} />
             </Suspense>
           )}
         </div>
       );
     }
     ```
2. **Clean Source Maps:**
   * Disable client-side production source maps (`productionBrowserSourceMaps: false` in Next.js or `sourcemap: false` in Vite) so internal code structure is not exposed in browser DevTools.

---

## 4. Backend Authorization Requirements

Regardless of which frontend strategy is adopted, the server must enforce strict authorization checks:

1. **Session Storage:**
   * Store tokens in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to protect against cross-site scripting (XSS) extraction.
2. **Strict Route Guards:**
   * Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) must reject unauthenticated requests immediately:
     ```ts
     // Pseudo-middleware check
     if (!session || session.role !== "owner") {
       return res.status(401).json({ error: "Unauthorized" });
     }
     ```
3. **Payload Sanitization:**
   * Do not send private metadata (draft art pieces, sales prices, staging links) in public `GET /api/art` responses.

---

## 5. Recommended Execution Plan for the Incoming Agent
1. **Milestone 1:** Implement secure backend session management (signed cookies, verification endpoint, role validation middleware).
2. **Milestone 2:** Implement **Strategy 2 (Keystroke Trigger)** for development speed and zero UI footprint, OR **Strategy 3 (Magic Link)** for maximum formless simplicity.
3. **Milestone 3:** Isolate all admin editing and management components behind React dynamic imports (`React.lazy`).
4. **Milestone 4:** Add rate-limiting middleware to authentication and mutation endpoints.
