
# Frontend

This folder contains the active React application UI.

## What Lives Here

- `App.tsx`: Main app shell and top-level routing/view switching.
- `components/`: Reusable UI, layouts, modals, and feature views.
- `hooks/`: Custom hooks for state and behavior (for example, task state management).
- `services/`: Frontend-side business logic (AI helpers, task/project/user services, settings).
- `types.ts`: Frontend type definitions.

## Key UI Areas

- Workspace layout (header, sidebar, board container)
- Kanban board (columns, task cards, filtering, selection)
- AI tools (assistant, triage, generation helpers)
- Modals (task/project/settings/command interactions)

## Notes

- Styling is primarily Tailwind utility classes.
- The app expects `GEMINI_API_KEY` to be configured at project root (`.env.local`).
- Local app data is persisted through browser storage and seeded from mock data services.
