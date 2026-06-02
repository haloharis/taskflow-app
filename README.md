# TaskFlow

A full-stack collaborative project management app with real-time notifications, Kanban boards, file attachments, and team collaboration — built with Next.js, Express, PostgreSQL, Redis, and Socket.io.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

---

## Features

- **Authentication** — JWT-based register/login with secure httpOnly cookies
- **Projects** — Create projects, invite team members, assign roles (Owner/Member)
- **Kanban Board** — Drag tasks across `TODO → IN_PROGRESS → DONE` columns
- **Task Management** — Priorities (Low/Medium/High), due dates, assignees
- **File Attachments** — Upload files directly to AWS S3 via pre-signed URLs
- **Avatar Uploads** — User profile pictures stored on AWS S3
- **Real-time Notifications** — Instant updates via Socket.io + Redis pub/sub
- **Fully Containerized** — One-command Docker Compose setup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Zustand |
| Backend | Express.js 5, Prisma ORM, Zod |
| Database | PostgreSQL |
| Cache / Pub-Sub | Redis |
| Real-time | Socket.io |
| File Storage | AWS S3 |
| Auth | JWT + bcrypt |
| DevOps | Docker, Docker Compose |

---

## Project Structure

```
taskflow-app/
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages (login, register, dashboard, projects)
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth & Notification contexts
│   │   └── lib/             # API client, socket, S3 upload helpers
│   └── Dockerfile
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth middleware
│   │   └── lib/             # Prisma, Redis, S3, Socket.io clients
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/
│   ├── .env.example
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- AWS S3 bucket + credentials (for file uploads)
- A PostgreSQL database (provided via Docker, or external)

---

### Option 1 — Docker Compose (Recommended)

**1. Clone the repo**

```bash
git clone https://github.com/your-username/taskflow-app.git
cd taskflow-app
```

**2. Set up environment variables**

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/taskflow"
REDIS_URL="redis://redis:6379"
JWT_SECRET="your-super-secret-key"

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket-name
```

**3. Start all services**

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

---

### Option 2 — Local Development (without Docker)

You'll need PostgreSQL and Redis running locally.

**Backend**

```bash
cd server
npm install
cp .env.example .env   # fill in your values
npx prisma migrate dev
npm run dev            # http://localhost:5000
```

**Frontend**

```bash
cd client
npm install
npm run dev            # http://localhost:3000
```

---

## API Reference

All protected routes require a valid JWT cookie.

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new account |
| POST | `/login` | Login and receive JWT cookie |
| POST | `/logout` | Clear session |
| GET | `/me` | Get current user |

### Projects — `/api/projects`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List user's projects |
| POST | `/` | Create a project |
| GET | `/:id` | Get project details (with members & tasks) |
| PUT | `/:id` | Update a project |
| DELETE | `/:id` | Delete a project |
| POST | `/:id/members` | Add a team member |

### Tasks — `/api/projects/:projectId/tasks`, `/api/tasks`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects/:projectId/tasks` | List tasks in project |
| POST | `/projects/:projectId/tasks` | Create a task |
| PUT | `/tasks/:id` | Update task (status, priority, assignee) |
| DELETE | `/tasks/:id` | Delete a task |

### Uploads — `/api/upload`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/presigned-url` | Get S3 pre-signed upload URL |
| PATCH | `/avatar` | Update user avatar |
| POST | `/attachment` | Attach a file to a task |

### Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all notifications |
| PATCH | `/:id/read` | Mark one as read |
| PATCH | `/read-all` | Mark all as read |

---

## Database Schema

```
User          — id, name, email, password, avatar
Project       — id, name, description, ownerId
ProjectMember — projectId, userId, role (OWNER | MEMBER)
Task          — id, title, description, status, priority, projectId, assigneeId, dueDate
TaskAttachment— id, taskId, fileUrl, fileName, uploadedBy
Notification  — id, userId, message, read
```

**Enums:**
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `DONE`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`
- `MemberRole`: `OWNER`, `MEMBER`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key |
| `AWS_REGION` | Yes | S3 bucket region |
| `AWS_BUCKET_NAME` | Yes | S3 bucket name |
| `PORT` | No | Server port (default: `5000`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:3000`) |

---

## License

[MIT](LICENSE)
