<div align="center">

  <img src="./client/public/favicon.svg" alt="Mansooba Logo" width="56" height="56" />
  <h1>Mansooba (منصوبہ)</h1>
  <p><strong>Enterprise-Grade Multi-Tenant Project Management & Collaboration Platform</strong></p>

  <p>
    <a href="https://codealpha.tech/" target="_blank">
      <img src="https://img.shields.io/badge/CodeAlpha-Full_Stack_Internship-blueviolet?style=for-the-badge&logo=codecademy&logoColor=white" alt="CodeAlpha Internship" />
    </a>
    <img src="https://img.shields.io/badge/Task-Task_2:_Project_Management_Tool-4f46e5?style=for-the-badge" alt="Task 2" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>

</div>

---

## 📸 Product Preview

<div align="center">
  <img src="./client/public/preview.PNG" alt="Mansooba Enterprise Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />
</div>

---

## 🎓 CodeAlpha Internship — Task 2 Showcase

> **Organization:** [CodeAlpha](https://codealpha.tech/)  
> **Internship Track:** Full Stack Web Development  
> **Task Number:** Task 2 — Collaborative Project Management System  
> **Project Title:** Mansooba (منصوبہ)

### 🏆 Engineering Beyond Conventional Standards
While typical internship deliverables implement basic CRUD operations, **Mansooba** was conceptualized, architected, and built to enterprise SaaS standards:

- **Multi-Tenant Workspace Segregation:** Rather than a simple single-organization database, Mansooba provides dynamic multi-tenancy with unique slug routing, instant active workspace switching, and isolated project environments.
- **Database-Level Ownership Invariant:** Engineered strict RBAC hierarchy rules where workspace creators are guaranteed permanent `👑 OWNER` status, completely shielding them from unauthorized demotions or expulsions by invited administrators.
- **Two-Way Invitation & Consent Flow:** Implemented user consent architecture where invited members receive real-time action banners to explicitly accept or decline workspace invites.
- **Full-Duplex WebSockets (Socket.io):** Real-time invalidations across team members and administrators eliminating the need for manual page reloads.
- **Custom Geometric Identity:** Native vector SVG brand monogram crafted specifically for the product rather than generic library icons.

---

## 🌟 Overview

**Mansooba** (*منصوبہ — The Blueprint/Plan*) is a high-performance, enterprise-grade multi-tenant project management platform crafted for modern engineering, product, and cross-functional teams. Inspired by Linear and modern dark-mode software design, Mansooba pairs geometric minimalism with an ironclad role hierarchy, real-time collaboration, and multi-organization tenant switching.

---

## 🚀 Key Enterprise Features

### 🏢 Multi-Tenant Workspace Architecture
- **Tenant Isolation:** Organizations operate in segregated data silos identified by unique slugs and identifiers.
- **Instant Workspace Switcher:** Users belonging to multiple companies or departments can switch active workspaces on the fly without logging out.
- **Zero-Workspace State:** Users removed from workspaces or joining without an organization are provided a dedicated onboarding dashboard to either spin up a new organization or accept invitations.
- **Multi-Tenant Creation:** Existing users can create additional organizations directly from the workspace dropdown.

### 🛡️ Ironclad Owner Protection & RBAC
- **`👑 OWNER` Guarantee:** The creator of an organization is permanently designated as its Owner and Administrator.
- **Hierarchy Security:** Invited Administrators are blocked at both API and UI levels from modifying the Owner's role, demoting them, or kicking them out of their own workspace.
- **Workspace Member Management:** Full team CRUD controls allowing Admins to safely adjust member roles or remove users from the workspace without destroying user accounts.

### 📩 Invitation & Consent Workflow
- **Two-Way Consent:** Users cannot be forcefully added into an organization without their explicit permission.
- **Real-Time Banners:** Invited users receive an instant interactive banner with **Accept & Join** or **Decline** options.
- **Socket Invalidation:** Instant notification delivery to workspace admins when an invitation is accepted or rejected without requiring manual page reloads.

### 📋 Project & Task Management
- **Interactive Project Dashboards:** Kanban boards, task status tracking, priorities, deadlines, and workload distribution.
- **Activity & Comments:** Real-time task discussions and live updates across team members.
- **Project-Level Access Control:** Distinct roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) scoped within each project.

### 🎨 Enterprise Brand Identity
- **Custom Geometric Monogram:** Custom SVG brand mark engineered with luminous isometric gradients and precision geometry.
- **Consistent Dark Design System:** Crafted with Tailwind CSS and Radix-inspired aesthetics.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | High-performance SPA with client-side routing |
| **Styling** | Tailwind CSS, Lucide Icons | Dark-mode enterprise UI and responsive layout |
| **State & Cache** | TanStack Query v5, Redux Toolkit | Optimistic updates, background invalidation, and auth state |
| **Backend** | Node.js, Express.js, TypeScript | RESTful API with structured MVC architecture |
| **Database** | PostgreSQL, Prisma ORM | Relational schema with migrations, foreign keys, and indexes |
| **Real-Time** | Socket.io | Full-duplex WebSocket communication for live notifications |
| **Security** | JWT, Bcrypt.js, Zod | Token authentication, password hashing, and input validation |

---

## 📂 Project Structure

```bash
CodeAlpha_Mansooba/
├── client/                     # Frontend Application
│   ├── public/
│   │   ├── favicon.svg         # Mansooba Brand Favicon
│   │   └── preview.PNG         # Application Preview Screenshot
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/
│   │   │   ├── common/         # MansoobaLogo & reusable UI elements
│   │   │   ├── layout/         # Header, Sidebar, ProtectedLayout
│   │   │   └── projects/       # ProjectCard, Modals
│   │   ├── pages/
│   │   │   ├── auth/           # Login & 2-Step Workspace Registration
│   │   │   ├── dashboard/      # Projects Dashboard & Workspace Switcher
│   │   │   ├── members/        # Team Members CRUD & Owner Protection
│   │   │   └── tasks/          # Task Management & Kanban Board
│   │   ├── store/              # Redux slices (auth, ui)
│   │   └── types/              # TypeScript interfaces
│   └── package.json
│
├── server/                     # Backend API & WebSocket Engine
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & relations
│   │   └── migrations/         # Prisma database migrations
│   ├── src/
│   │   ├── config/             # DB & Environment configuration
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Authentication & error middlewares
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Core business logic & database queries
│   │   ├── lib/socket.ts       # Socket.io event emitter & listeners
│   │   └── index.ts            # Server entry point
│   └── package.json
│
└── README.md                   # Enterprise Documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** instance (local or hosted e.g., Supabase / Neon / Docker)
- **npm** or **pnpm**

---

### 1. Database Configuration
Create a PostgreSQL database and configure your connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mansooba?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

Save this as `.env` inside the `server/` directory.

---

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Run Prisma migrations & generate client
npx prisma migrate dev
npx prisma generate

# Start the development server
npm run dev
```

The backend server will spin up on `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

---

## 🔐 Environment Variables Summary

### `server/.env`
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-secret-key` |
| `PORT` | API Server port | `5000` |
| `CLIENT_URL` | Allowed CORS origin for frontend | `http://localhost:5173` |

### `client/.env`
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for backend REST API | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

---

## 👨‍💻 Internship & Author Information

- **Internship Program:** [CodeAlpha](https://codealpha.tech/)
- **Domain:** Full Stack Web Development
- **Assigned Task:** Task 2 — Project Management / Team Collaboration Platform
- **Project Name:** Mansooba (منصوبہ)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Developed with precision as part of the <strong>CodeAlpha Full Stack Development Internship (Task 2)</strong></p>
</div>
