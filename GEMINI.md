# Project Context for Gemini Code Assist

## 1. Project Overview
<!-- Provide a high-level summary of the application. -->
This project is a **[Application Type, e.g., REST API / React Dashboard]** designed to **[Core Purpose]**. It serves **[Target Audience]** and solves **[Specific Problem]**.

## 2. Technology Stack
<!-- List the core technologies to ensure code generation matches your environment. -->
- **Language:** [e.g., TypeScript 5.x, Python 3.11, Java 17]
- **Frameworks:** [e.g., Next.js 14, FastAPI, Spring Boot 3]
- **Database:** [e.g., PostgreSQL, MongoDB, Redis]
- **ORM/Data Access:** [e.g., Prisma, SQLAlchemy, Hibernate]
- **Testing:** [e.g., Jest, Pytest, JUnit 5]
- **Styling/UI:** [e.g., Tailwind CSS, Material UI]

## 3. Coding Conventions & Style Guide
<!-- Define strict rules for code generation. -->
### General
- **Indentation:** [e.g., 2 spaces, 4 spaces, Tabs]
- **Quotes:** [e.g., Single quotes for JS, Double quotes for HTML]
- **Semicolons:** [e.g., Always, Never]

### Naming Conventions
- **Variables/Functions:** `camelCase` (e.g., `getUserData`)
- **Classes/Components:** `PascalCase` (e.g., `UserProfile`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- **Files:** `kebab-case` (e.g., `user-profile.tsx`)

### Best Practices
- **Type Safety:** No `any` types; use strict interfaces/types.
- **Functions:** Prefer pure functions; keep functions small and single-purpose.
- **Async/Await:** Prefer `async/await` over `.then()` chains.
- **Error Handling:** Use custom error classes located in `src/errors`.

## 4. Architecture & Directory Structure
<!-- Explain how the code is organized. -->
- **Pattern:** [e.g., MVC, Clean Architecture, Feature-based]
- **Key Directories:**
  - `/src/components`: Reusable UI components.
  - `/src/hooks`: Custom hooks.
  - `/src/services`: API integration and business logic.
  - `/src/utils`: Helper functions.

## 5. Documentation Requirements
<!-- Instructions on how code should be documented. -->
- All public functions must have [JSDoc/Docstrings].
- Complex logic requires inline comments explaining *why*, not just *what*.

## 6. Common Tasks / Prompt Shortcuts
<!-- Paste these into Gemini for consistent results. -->
- **Generate Test:** "Create a unit test for this file using [Testing Framework], covering happy paths and edge cases."
- **Refactor:** "Refactor this component to improve performance and readability, adhering to the style guide above."
- **Debug:** "Analyze this error stack trace and suggest a fix based on the project architecture."
