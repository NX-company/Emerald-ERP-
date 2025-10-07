# Emerald ERP System

## Overview

Emerald ERP is a comprehensive enterprise resource planning system tailored for a furniture manufacturing company. It manages the entire business workflow, from sales and production to warehousing, installation, and financial tracking. The system is a full-stack web application providing role-based access for various team members to collaborate on custom furniture orders, from initial quote to final delivery. Its modular architecture includes dedicated sections for Sales, Projects, Production, Warehouse, Finance, Installation, and supporting modules for tasks, documents, and communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React 18+ with TypeScript (Vite).
**UI/UX**: shadcn/ui (Radix UI) components, Material Design 3 principles, custom Emerald color scheme (HSL 160 85% 40%), light/dark mode support, "New York" style.
**State Management**: TanStack Query for server state; local component state via React hooks.
**Routing**: Wouter.
**Styling**: Tailwind CSS with custom design tokens, 8px grid system, responsive breakpoints.
**Type Safety**: Shared TypeScript types (`shared/schema.ts`) for full-stack consistency.
**Responsive Design**: Mobile-first approach, standard Tailwind breakpoints (mobile, tablet, desktop), responsive layouts for containers, headers, grids, and components. Emphasizes `data-testid` attributes for all interactive elements.

### Backend

**Runtime & Framework**: Node.js with Express.js (ES modules). Serves API and Vite-built frontend.
**Modular Architecture**: 10 independent modules (`server/modules/`) for Sales, Projects, Production, Warehouse, Finance, Installation, Tasks, Documents, Users, and Settings. Each module contains routes, repository (Drizzle ORM), and service logic, ensuring independence and scalability.
**API Design**: RESTful API with module-organized routes, standard HTTP methods, JSON request/response.
**Database Layer**: Drizzle ORM for type-safe queries to PostgreSQL (Neon serverless). Migrations via drizzle-kit.
**Data Validation**: Zod schemas for API boundary validation.
**Authentication**: Bcrypt for password hashing; session management via connect-pg-simple (PostgreSQL-backed sessions).

### Data Storage

**Database**: PostgreSQL (Neon serverless), connection pooling.
**Schema Design**: Core entities (users, deals, projects, etc.) with foreign key relationships, enums for controlled vocabularies, UUID primary keys, and audit timestamps.
**File Storage**: Document management tracks metadata in DB; actual file storage through Replit Object Storage with ACL-based access control.

## External Dependencies

**UI Component Libraries**: @radix-ui/*, class-variance-authority, cmdk, lucide-react.
**Data Fetching & Forms**: @tanstack/react-query, @hookform/resolvers, react-hook-form.
**Database & Backend**: @neondatabase/serverless, drizzle-orm, drizzle-kit, bcrypt, connect-pg-simple, zod, date-fns.
**Development Tools**: Vite, @vitejs/plugin-react, TypeScript, Tailwind CSS, ESBuild, tsx.
**Replit Integration**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner.
**Fonts**: Inter, JetBrains Mono (Google Fonts CDN).