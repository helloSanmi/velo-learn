# Velo Learn

Velo Learn is a React + Vite task/workspace app with AI-assisted features (task drafting, triage, insights, and image-to-task extraction).

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind (via CDN in `index.html`)
- Google GenAI SDK (`@google/genai`)

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create or update `.env.local` in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

- `http://localhost:3000`

## Available Scripts

- `npm run dev`: Start local development server.
- `npm run build`: Build production assets to `dist/`.
- `npm run preview`: Preview the production build locally.

## Project Structure

- `index.tsx`: App bootstrap and initialization.
- `frontend/`: Main active application code.
- `frontend/components/`: UI components and views.
- `frontend/services/`: Data, AI, and app services.
- `frontend/hooks/`: Custom React hooks.
- `backend/`: Mock backend/data folder used by this project setup.
- `dist/`: Production build output (generated).

## Environment Notes

- AI features require `GEMINI_API_KEY`.
- Vite injects this key as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build/runtime.

## Troubleshooting

- If the app fails to start, run:

```bash
rm -rf node_modules package-lock.json
npm install
```

- If AI features are unavailable, verify `.env.local` exists and `GEMINI_API_KEY` is valid.
