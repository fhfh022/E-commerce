---
name: nextjs-development
description: Guidelines and best practices for developing in the Next.js 15, Tailwind v4, Redux, Supabase, and Clerk stack.
---

# Next.js Development Skill Guide

This guide defines the coding style, structural rules, and best practices for this project.

## Tech Stack Overview
- **Framework**: Next.js 15 (App Router)
- **State Management**: Redux Toolkit & React Redux
- **Styling**: Tailwind CSS v4
- **Database / Backend**: Supabase Client & Prisma with PostgreSQL
- **Authentication**: Clerk

---

## 1. Directory Structure Conventions
- **App Router (`/app`)**:
  - Keep layout structure clean.
  - Page-specific logic should live in subfolders.
  - Non-page routing files (like utilities, hooks, or components) should NOT be kept in `/app` folders unless specifically co-located as private folders starting with an underscore (e.g. `_components`).
- **Components (`/components`)**:
  - Organize into feature subfolders (e.g., `components/blog`, `components/product`, `components/layout`).
  - Keep styling consistent using Tailwind CSS v4.

---

## 2. Redux State Management
- Use `StoreProvider` (defined in `app/StoreProvider.js` or `components/providers`) when client state access is needed.
- Avoid passing state props through too many component levels; instead, select state fields using `useSelector` and dispatch actions using `useDispatch`.

---

## 3. Tailwind CSS v4 Styling
- Use native Tailwind v4 features.
- Build clean, responsive layouts using utility classes.
- Ensure all interactive elements have hover effects, transitions, and active styles to keep a high-quality feel.

---

## 4. API & Backend Security
- Ensure Clerk authentication is verified in API endpoints under `app/api/` or dynamic server pages.
- Handle database transactions safely and use proper typescript definitions when communicating with Supabase.
