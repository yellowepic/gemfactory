# Project Skills & Capabilities

This document defines specific "skills" or specialized workflows for this project. Reference this file to understand how to perform complex, recurring tasks according to project standards.

## 1. Skill: Component Creation
**Trigger:** "Create a new component..."
**Context:** Frontend / UI
**Steps:**
1. Define the component interface in `types.ts` (if applicable) or inline.
2. Create the component file using the `PascalCase` naming convention.
3. Implement the component using the functional pattern.
4. Add a corresponding test file.
5. Export the component from the `index.ts` barrel file (if applicable).

## 2. Skill: Database Migration
**Trigger:** "Add a field to the user model..."
**Context:** Backend / Database
**Steps:**
1. Modify the ORM model definition.
2. Generate a migration script using the CLI tool.
3. Review the generated SQL/script for safety.
4. Update any related DTOs or API validation schemas.

## 3. Skill: Error Handling Pattern
**Trigger:** "Handle errors for..."
**Context:** General
**Guidelines:**
- Wrap async calls in `try/catch`.
- Log the raw error using the project's logger.
- Throw a standardized `AppError` with a user-friendly message and status code.

## 4. Skill: API Integration
**Trigger:** "Connect to the X API..."
**Context:** Services
**Steps:**
1. Create a service method in the appropriate service class.
2. Use the configured HTTP client (e.g., Axios instance).
3. Type the response data strictly.
4. Handle network errors and non-200 status codes explicitly.
