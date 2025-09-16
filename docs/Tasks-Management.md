## Tasks Management

This document describes the data model, API endpoints, and role-based access rules for Tasks.

### Data Model (Prisma / MariaDB)

Tables and enums are defined in `server/prisma/schema.prisma`:

- Task
  - id (Int, PK)
  - title (String)
  - description (String)
  - deadline (DateTime)
  - priority (enum: high | medium | low)
  - status (enum: todo | in_progress | completed)
  - createdAt (DateTime)
  - updatedAt (DateTime)
  - createdById (Int, FK -> User.id)
  - departmentId (Int?, FK -> Department.id)
  - parentId (Int?, FK -> Task.id) — subtask support

Related additions:

- User.tasksCreated (back-relation)
- Department.tasks (back-relation)
- Task.subtasks self-relation under name "TaskSubtasks"

### API Endpoints

Base path: `/api/tasks` (see `server/src/routes/tasks.ts`). All endpoints require Authorization bearer token.

- GET `/api/tasks`
  - Query params: `status`, `priority`, `q`, `departmentId`, `createdById`, `parentId`
  - Use `parentId=null` to list only top-level tasks; otherwise pass a numeric `parentId` to list subtasks for a task.

- POST `/api/tasks`
  - Body: `{ title, description, deadline, priority, status?, departmentId?, createdById?, parentId? }`
  - When `parentId` is provided, a subtask is created under that task.

- PATCH `/api/tasks/:id`
  - Body: any subset of `{ title, description, deadline, priority, status }`
  - Edits a task or subtask. RBAC rules apply.

- PATCH `/api/tasks/:id/status`
  - Body: `{ status }`
  - Updates only the status.

All responses are wrapped as `{ data: ... }` or `{ error: string }` on failure.

### RBAC Visibility Rules

- Admin: full access to list and create tasks.
- Manager: list tasks in their department; can create tasks limited to their department.
- Employee: list only their own tasks; can create tasks for themselves; can update status of their tasks only.

### Frontend Integration

- `src/context/TaskContext.tsx`
  - Loads top-level tasks via `/api/tasks?parentId=null` including `subtasks`.
  - `addTask` creates a top-level task; `addSubtask` creates with `parentId`.
  - `updateTaskStatus` and a generic update endpoint are supported via API.
  - Existing list/detail components can render `subtasks` if desired.

### Migration & Generation

Run these in `server/`:

```bash
npx prisma migrate dev --name add_subtasks --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

If you encounter Windows DLL lock issues, stop running servers first.

### Environment

- `DATABASE_URL` in `server/.env` should point to your MariaDB instance.
- Ensure `JWT_SECRET` is set for auth.


