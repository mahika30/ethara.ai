📌 ETHARE TEAM TASK MANAGER README

Ethare is a modern, responsive, full-stack collaborative project management platform built to help teams organize, assign, and track task progress. It features a dark-themed visual workspace, role-based access controls, interactive Kanban boards, and a centralized statistics dashboard.

--------------------------------------------------------------------------------
🚀 KEY FEATURES

* Secure Authentication (Signup/Login): Custom JWT session-based auth stored in HttpOnly cookies, featuring password hashing with bcryptjs.
* Role-Based Access Control (RBAC):
  - System Role (Admin/Member): Configured at signup.
  - Project Role (Admin/Member): Manage granular project-level rights. Project creators and project Admins can manage team members, invite new users by email, toggle member roles, edit project settings, or delete projects.
* Project & Team Management: Create projects, assign roles, view teammates, and collaborate in real time.
* Interactive Task Board (Kanban):
  - Columns: To Do, In Progress, In Review, and Done.
  - Task attributes: Title, Description, Priority (Low/Medium/High), Due Date, and Assignee.
  - Quick actions to transition task status, edit details, or delete.
* Personalized Analytics Dashboard:
  - Overview metrics cards (Assigned Tasks, Pending, Completed, Overdue).
  - Overdue & Urgent Tasks list: Highlights tasks with past due dates in red.
  - Workspace project grid: Displays active projects, task counts, and teammate list.

--------------------------------------------------------------------------------
🛠️ TECH STACK & ARCHITECTURE

* Frontend & Backend (Full-Stack): Next.js (App Router, Server Components + Client Components).
* Styling: Premium, responsive, custom Vanilla CSS. Dark-mode first design with glassmorphic cards, Outfit typography, HSL variables, and smooth micro-animations. No TailwindCSS.
* Icons: lucide-react.
* Database: Prisma ORM supporting dual databases:
  - SQLite locally (Zero-setup development).
  - PostgreSQL in production (Railway).
* Database Schema Automatic Conversion: A helper build-script (scripts/prepare-db.js) detects the presence of a PostgreSQL DATABASE_URL in production (e.g. on Railway) and automatically updates the Prisma provider from sqlite to postgresql before compiling.

--------------------------------------------------------------------------------
⚙️ ENVIRONMENT VARIABLES

Create a .env file in the root folder with the following variables:

DATABASE_URL="file:./dev.db"
JWT_SECRET="generate-a-secure-random-secret-key"
PORT=3000

*For local SQLite setup, keep DATABASE_URL as "file:./dev.db". When deploying to Railway, Railway will inject its own PostgreSQL database connection string automatically.*

--------------------------------------------------------------------------------
💻 LOCAL SETUP & INSTALLATION

1. Clone the repository:
   git clone <your-repo-url>
   cd ethare

2. Install dependencies:
   npm install

3. Initialize Database Tables:
   This script runs the local database sync and generates the Prisma client.
   npx prisma db push

4. Run the development server:
   npm run dev

Open http://localhost:3000 in your web browser.

--------------------------------------------------------------------------------
🌐 DEPLOYMENT TO RAILWAY (MANDATORY STEP-BY-STEP)

The project is fully pre-configured to run out of the box on Railway with a PostgreSQL database.

Step 1: Provision a PostgreSQL Database on Railway
1. Go to your Railway Dashboard (https://railway.app) and create a New Project.
2. Select Provision PostgreSQL from the catalog list.
3. Wait for the database to spin up.

Step 2: Deploy your Application Service
1. In the same Railway project, click New -> GitHub Repo (authorize and select your pushed repo).
2. Or use the Railway CLI to deploy directly by running:
   railway link
   railway up

Step 3: Configure environment variables in Railway
In your application service's Variables tab, add:
1. DATABASE_URL: Click Add Reference -> Select the Reference to your Postgres Database's Connection URL (${{Postgres.DATABASE_URL}}).
2. JWT_SECRET: Input a long random string (e.g., 4c11b089c250b86a04dfdf4...).
3. PORT: 3000

Step 4: Automagic Build Process
Railway will execute our configured build pipeline:
* Downloads dependencies.
* Runs npm run build which triggers:
  1. scripts/prepare-db.js: Rewrites Prisma provider in schema.prisma to postgresql using the DATABASE_URL.
  2. npx prisma generate: Generates PostgreSQL-typed Prisma Client.
  3. next build: Compiles the Next.js production build.
  4. npx prisma db push --accept-data-loss: Configures database tables directly on the live PostgreSQL instance.

--------------------------------------------------------------------------------
📝 REST API ENDPOINTS

Authentication
* POST /api/auth/signup: Create a new user account. First registered user becomes ADMIN system-wide.
* POST /api/auth/login: Validate credentials, sign JWT and set cookie.
* POST /api/auth/logout: Expire session cookie.
* GET /api/auth/me: Fetch authenticated user profile data.

Workspace Users
* GET /api/users: Fetch list of all registered team members.

Projects
* GET /api/projects: Get all projects the user is a creator or member of.
* POST /api/projects: Create a new project workspace.
* GET /api/projects/[id]: Get details, tasks, and team list of a project.
* PUT /api/projects/[id]: Edit project name or description (Admins only).
* DELETE /api/projects/[id]: Delete project workspace and tasks (Creator/System Admin only).

Project Members
* POST /api/projects/[id]/members: Add a teammate by email (Admins only).
* PUT /api/projects/[id]/members/[memberId]: Toggle membership role between ADMIN and MEMBER.
* DELETE /api/projects/[id]/members/[memberId]: Remove member from project.

Tasks
* GET /api/projects/[id]/tasks: Get tasks list.
* POST /api/projects/[id]/tasks: Create task under project.
* GET /api/tasks/[taskId]: Get single task details.
* PUT /api/tasks/[taskId]: Edit task fields (status, assignee, priority, title, desc, due date).
* DELETE /api/tasks/[taskId]: Edit task fields (status, assignee, priority, title, desc, due date).
* DELETE /api/tasks/[taskId]: Delete task (Admins/Task Creator only).

Dashboard Stats
* GET /api/dashboard: Compute and fetch summary statistics, overdue counts, and upcoming tasks.
