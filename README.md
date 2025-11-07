# React Contact Setup UI

This is a minimal React + Vite project containing a responsive 3-column contact setup form. It collapses to 2 columns on tablets and a single column on mobile for consistent alignment across the app.

## Run locally

1. Install dependencies
   - `npm install`
2. Start the dev server
   - `npm run dev`
3. Build for production
   - `npm run build`
4. Preview the production build
   - `npm run preview`

No external UI library is required; styles live in `src/styles.css`.

## New Pages & Routing

- `GET /login` → Login page (mock auth stored in localStorage)
- `GET /logout` → Logs out and redirects to login
- `GET /` → New Vendor (uses the same ContactForm; saves locally to the vendor store)
- `GET /vendors` → List of active vendors (from localStorage)
- `GET /vendors/:id/edit` → Edit page, prefilled using the vendor store

Auth and vendors are mocked client-side so you can test without an API. You can later swap `src/store/vendors.js` with real endpoints and keep the UI.

## API wiring

- The form submits to `POST /api/contacts` via `src/api/index.js`.
- Configure base URL with an env var: create a `.env` file and set `VITE_API_BASE_URL="http://localhost:3000"` or your server URL. When empty, requests go relative to the app origin (works with the proxy below).

### Dev proxy (optional)

`vite.config.js` includes a dev proxy that forwards `/api/*` to `http://localhost:3000`. Change the `target` to match your API. This avoids CORS during development.

## Validation

- Client-side validation lives in `src/lib/validation.js`.
- Errors render under fields and block submit until fixed.
