
# CloudTasks Backend (Mock)

This directory simulates the data layer for the CloudTasks application.

## Data Schema
- **/data/users.json**: User profiles and authentication identities.
- **/data/tasks.json**: Core task records including metadata, time tracking, and audit logs.
- **/data/projects.json**: Workspace project definitions and membership mappings.

## Persistence
While this environment uses `localStorage` for runtime persistence, these JSON files serve as the "Seed" data for initializing new workspaces.
