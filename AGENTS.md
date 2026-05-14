<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AeroTrack Agent Instructions

## Project Overview

AeroTrack is a full-stack Next.js application for near-real-time aircraft tracking, aircraft search, and flight/aircraft details.

The first MVP uses:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- MongoDB/Mongoose
- OpenSky Network API
- Leaflet / React Leaflet

## Architecture Rules

- Use TypeScript everywhere.
- Use the Next.js App Router.
- Keep pages and API route handlers inside `src/app`.
- Keep reusable UI components inside `src/components`.
- Keep external API integrations inside `src/services`.
- Keep shared types inside `src/types`.
- Keep database utilities inside `src/lib`.
- Keep MongoDB models inside `src/models`.
- Do not call third-party APIs directly from client components.
- Client components should call our internal API routes only.
- Avoid large files; split complex UI into focused components.
- Keep code readable and production-minded.

## Data Fetching Rules

- OpenSky API calls must go through `src/services/opensky.ts`.
- UI components should not know the raw OpenSky response format.
- Normalise external API responses before returning them to the frontend.
- Use clear loading, error, empty, and success states.

## UI Rules

- Use shadcn/ui components when appropriate.
- Use Tailwind CSS for styling.
- Keep the UI clean, modern, and dashboard-like.
- Prioritise usability over visual complexity.
- Make pages responsive.

## Safety Rules

- Never expose API keys or secrets to the client.
- Never commit `.env.local`.
- Do not add unnecessary dependencies without explaining why.
- Do not make destructive database changes without asking first.

## Workflow Rules

Before making code changes:
1. Explain the plan briefly.
2. List the files that will be changed.
3. Keep the change focused on the requested milestone.

After making code changes:
1. Explain what changed.
2. Mention how to test it.
3. Run or suggest:
   - `npm run lint`
   - `npm run build`

## Current MVP Milestones

1. Project setup and live aircraft API route.
2. Live map with aircraft markers.
3. Aircraft details page.
4. Search page.
5. Dashboard.
6. Watchlist with database persistence.
7. Authentication.

<!-- END:nextjs-agent-rules -->
