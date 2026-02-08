
# Backend (Mock Data)

This folder provides mock backend seed data used by the frontend services.

## Purpose

- Simulate backend datasets for local development.
- Provide predictable starter records for users, projects, and tasks.
- Support reset/initialization flows without a real API server.

## Data Files

- `data/users.json`: User identities and profile metadata.
- `data/projects.json`: Project/workspace definitions.
- `data/tasks.json`: Task records, status, priority, assignees, and related metadata.

## How It Is Used

- The running app uses local browser persistence for day-to-day state.
- These files act as seed inputs when mock initialization runs.
- No standalone backend process is required for local development.
