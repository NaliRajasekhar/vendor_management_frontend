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

- `GET /login` – Authenticates against the backend and stores the issued JWT.
- `GET /logout` – Clears the auth session and redirects to login.
- `GET /` – Add Vendor form (requires `admin` or `employee` role).
- `GET /vendors`, `/vendors/:id`, `/vendor/:vendorId` – Vendor views fetched from the API; the `user` role receives read-only access.
- `GET /vendors/:id/edit` – Edit vendor (requires `admin` or `employee` role).

All views talk to the backend through the helpers in `src/api/*`, which automatically attach the stored JWT so the API can enforce authorization.

## API wiring

- The form submits to `POST /api/contacts` via `src/api/index.js`.
- Configure the base URL in `.env` with `VITE_API_BASE_URL=http://localhost:4000` (or your server). The Vite dev proxy in `vite.config.js` can still forward `/api/*` if you prefer that setup.

## Authentication & Roles

- Sessions persist in `localStorage` under the `auth:session` key and are hydrated by `src/context/AuthContext.jsx`.
- `src/lib/session.js` exposes helpers to decode JWTs and inject `Authorization` headers for fetch/axios requests.
- Use the backend's seeded accounts (see backend README) to experiment with the `admin`, `employee`, and `user` roles.

## Validation

- Client-side validation lives in `src/lib/validation.js`.
- Errors render under fields and block submit until fixed.

