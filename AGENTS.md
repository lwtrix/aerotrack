<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## AeroTrack project rules

- Use TypeScript everywhere.
- Use the Next.js App Router.
- Keep external API integrations inside `src/services`.
- Keep reusable UI inside `src/components`.
- Keep MongoDB models inside `src/models`.
- Keep shared TypeScript types inside `src/types`.
- Do not call third-party flight APIs directly from client components.
- Client components should only call our own API routes.
- Use clear loading, empty, and error states for all data-driven UI.
- Prefer small, focused components over large files.
- Avoid adding unnecessary dependencies.

<!-- END:nextjs-agent-rules -->
