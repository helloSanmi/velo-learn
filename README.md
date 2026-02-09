# Velo Learn

Velo Learn is a React + Vite workspace app for project planning, task boards, timelines, analytics, and AI-assisted task workflows.

## Project Layout

- `frontend/`: all frontend app code and frontend runtime files
- `backend/`: mock backend seed data (`backend/data/*.json`)
- Root docs: `README.md`, `PRIVACY_POLICY.md`, `TERMS_OF_SERVICE.md`, `SUPPORT.md`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind (CDN via `frontend/index.html`)
- Google GenAI SDK (`@google/genai`)

## Prerequisites

- Node.js 20+
- npm

## Setup

1. Go to frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create or update `frontend/.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

## Run

From `frontend/`:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

From `frontend/`:

```bash
npm run build
npm run preview
```

## Default App Behavior

- After reload, the default public page is the Home/Landing page.
- Users can then sign in with demo credentials.

## Demo Credentials

- Password for all users: `Password`
- Usernames:
1. `admin` (`admin@velo.ai`)
2. `alex` (`alex@velo.ai`)
3. `sarah` (`sarah@velo.ai`)
4. `mike` (`mike@velo.ai`)

## Legal

- Privacy Policy: `PRIVACY_POLICY.md`
- Terms of Service: `TERMS_OF_SERVICE.md`
- Support: `SUPPORT.md`

## Notes

- AI features need `GEMINI_API_KEY`.
- Data is locally persisted in browser storage and initialized from mock services.
