# Emerald ERP System

## Overview

Emerald ERP is a comprehensive enterprise resource planning system designed specifically for a furniture manufacturing company. The system manages the entire business workflow from initial sales contact through production, warehousing, installation, and financial tracking. Built as a full-stack web application, it provides role-based access for different team members (Directors, Sales Managers, Project Managers, Designers, Estimators, Surveyors, Financiers, Procurement Specialists, Warehouse Staff, and Installation Teams) to collaborate on custom furniture orders from quote to delivery.

The application follows a modular architecture with distinct sections for Sales (CRM-style pipeline), Projects (stage-based workflow management), Production (manufacturing task tracking with QR codes), Warehouse (inventory management), Finance (expense and revenue tracking), Installation (field work coordination), and supporting modules for tasks, documents, and mail communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript running on Vite for fast development and optimized production builds.

**UI Component System**: shadcn/ui components built on Radix UI primitives, providing accessible, customizable components following the "New York" style variant. The design system implements Material Design 3 principles with a custom Emerald color scheme (primary emerald green at HSL 160 85% 40%) and supports both light and dark modes.

**State Management**: TanStack Query (React Query) for server state management with optimistic updates and automatic background refetching. No global client state management library is used; component-level state with React hooks is sufficient for UI state.

**Routing**: Wouter for lightweight client-side routing without the overhead of React Router.

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables, enabling theme switching and consistent spacing/typography across the application. The design uses an 8px grid system with defined breakpoints for responsive layouts.

**Type Safety**: Shared TypeScript types between frontend and backend via a `shared/schema.ts` file, ensuring type safety across the full stack.

### Backend Architecture

**Runtime & Framework**: Node.js with Express.js server using ES modules (type: "module"). The server handles both API routes and serves the Vite-built frontend in production.

**Modular Architecture** (Октябрь 2025): Backend организован в виде 10 независимых модулей в `server/modules/`, каждый модуль содержит:
- `routes.ts` - API эндпоинты модуля
- `repository.ts` - работа с базой данных (Drizzle ORM)
- `service.ts` - бизнес-логика (заготовка для будущего развития)

**10 Модулей**:
1. **Sales** (`/api/deals`) - управление сделками и клиентами
2. **Projects** (`/api/projects`) - управление проектами и этапами
3. **Production** (`/api/production`) - производственные заказы
4. **Warehouse** (`/api/warehouse`) - складской учет
5. **Finance** (`/api/finance/transactions`) - финансовые операции
6. **Installation** (`/api/installations`) - установка и монтаж
7. **Tasks** (`/api/tasks`) - задачи и поручения
8. **Documents** (`/api/documents`) - документооборот
9. **Users** (`/api/users`) - пользователи системы
10. **Settings** (`/api/settings/company`) - настройки компании

**Принципы модульной архитектуры**:
- Каждый модуль полностью независим (нет cross-module imports)
- Модули можно разрабатывать параллельно без конфликтов
- Простая масштабируемость - легко добавлять новые модули
- `server/routes.ts` (33 строки) - только монтирование модульных роутеров
- `server/storage.ts` (12 строк) - экспорт модульных репозиториев

**API Design**: RESTful API с routes, организованными по модулям. Эндпоинты следуют стандартным HTTP методам (GET, POST, PUT, DELETE) с JSON request/response.

**Database Layer**: Drizzle ORM для type-safe запросов к PostgreSQL (via Neon serverless). Схемы в `shared/schema.ts`, миграции через drizzle-kit.

**Data Validation**: Zod schemas (via drizzle-zod's createInsertSchema) валидируют данные на границах API, ошибки преобразуются в понятные сообщения через zod-validation-error.

**Authentication**: Bcrypt для хеширования паролей. Session management через connect-pg-simple для PostgreSQL-backed sessions.

### Data Storage

**Database**: PostgreSQL (via Neon serverless with WebSocket support for serverless environments). Connection pooling via @neondatabase/serverless Pool.

**Schema Design**: 
- Core entities: users, deals, projects, project_stages, production_tasks, production_stages, warehouse_items, warehouse_transactions, financial_transactions, installations, tasks, documents, company_settings
- Relationships modeled via foreign keys (e.g., deals reference users as managers, projects reference deals)
- Enums for controlled vocabularies (deal_stage, status, priority, document_type, etc.)
- Timestamps (created_at, updated_at) for audit trails
- UUID primary keys (gen_random_uuid()) for all entities

**File Storage**: Document management system tracks file metadata in the database; actual file storage mechanism not evident in provided code (likely filesystem or cloud storage integration to be implemented).

### External Dependencies

**UI Component Libraries**:
- @radix-ui/* family (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, toast, tooltip, etc.) - 20+ component primitives
- class-variance-authority for component variant styling
- cmdk for command palette interfaces
- lucide-react for icons

**Data Fetching & Forms**:
- @tanstack/react-query for server state
- @hookform/resolvers for form validation integration
- react-hook-form (implied by resolvers package)

**Database & Backend**:
- @neondatabase/serverless for PostgreSQL connectivity
- drizzle-orm and drizzle-kit for ORM and migrations
- bcrypt for password hashing
- connect-pg-simple for session storage
- zod for runtime validation
- date-fns for date manipulation

**Development Tools**:
- Vite with @vitejs/plugin-react for frontend tooling
- TypeScript for type safety
- Tailwind CSS with PostCSS for styling
- ESBuild for backend bundling in production
- tsx for TypeScript execution in development

**Replit Integration**:
- @replit/vite-plugin-runtime-error-modal for development error overlays
- @replit/vite-plugin-cartographer and @replit/vite-plugin-dev-banner for Replit-specific features (only in development)

**Fonts**: 
- Inter (400, 500, 600, 700) for UI text with Cyrillic support
- JetBrains Mono (400, 500, 600) for code/ID display
- Loaded via Google Fonts CDN

**Notable Design Decisions**:
- Monorepo structure with shared types between client and server
- Russian language UI (ru locale throughout)
- Material Design 3 principles adapted for ERP use case prioritizing information density
- Module-based navigation reflecting business workflow stages
- QR code integration for warehouse/production tracking (barcode system for physical inventory)