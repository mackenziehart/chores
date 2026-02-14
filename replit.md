# ChoreShare - Chore Sharing Web App

## Overview
A warm, inviting web app for couples to share and manage household chores together. Features include chore creation/editing, partner assignment, recurring chores, due dates, history tracking, email reminders via Resend, and a customizable color theme palette.

## Recent Changes
- 2026-02-14: Added rooms feature - room-based chore organization, collapsible room sections on dashboard, room management in settings
- 2026-02-14: Initial MVP build - schema, frontend, backend, Resend email integration

## Architecture
- **Stack**: Fullstack JavaScript (React + Express + PostgreSQL)
- **Frontend**: React with Shadcn UI, Tailwind CSS, wouter routing, TanStack Query
- **Backend**: Express.js with Drizzle ORM
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Email**: Resend integration for chore reminders
- **Theme**: Dynamic color customization via CSS custom properties

## Project Structure
- `shared/schema.ts` - Data models (partners, chores, rooms, choreHistory, settings)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (DatabaseStorage)
- `server/routes.ts` - API endpoints
- `server/email.ts` - Resend email integration for reminders
- `server/seed.ts` - Seed data
- `client/src/App.tsx` - Main app with sidebar layout
- `client/src/lib/theme.tsx` - Dynamic theme provider
- `client/src/pages/` - Dashboard, Chores, History, Settings pages
- `client/src/components/` - ChoreCard, ChoreFormDialog, AppSidebar, ThemeToggle

## Key Features
- No login required - simple shared access
- Partner management (max 2)
- Chore CRUD with categories, priorities, due dates
- Recurring chores (daily/weekly/biweekly/monthly) with auto-regeneration
- Chore history tracking
- Email reminders via Resend (checks hourly for chores due tomorrow)
- Room-based chore organization with collapsible sections on dashboard
- Customizable rooms (add/edit/delete) in settings with default room presets
- Customizable color palette with presets
- Dark/light mode toggle
