
# CloudTasks Frontend

This directory contains the high-performance React UI for the CloudTasks Enterprise application.

## Structure
- **/components**: Highly modular UI components decomposed to avoid the "God Component" pattern.
- **/hooks**: Custom React hooks for encapsulating complex state logic (e.g., `useTasks`).
- **/services**: Business logic and API client abstractions (AI, Auth, Projects, Tasks).
- **/types.ts**: Global TypeScript interfaces ensuring type safety across the application.

## Key Features
- **Kanban Board**: Real-time drag-and-drop task management.
- **AI Integration**: Gemini-powered task breakdown and risk assessment.
- **PWA Ready**: Offline resilience and installable application shell.
