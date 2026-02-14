# Production-Grade Authentication Plan (Backend JWT)

## 1. Executive Summary
This document outlines the implementation plan for a secure, **JWT-based authentication system** for the STXWORX Admin Portal, focusing on **structured, modular backend architecture**. The solution replaces Passport.js with a custom JWT implementation using a **Controller-Service-Repository** pattern for maximum maintainability and testability.

## 2. Architecture Overview

### 2.1 Technology Stack
- **Authentication**: `jsonwebtoken` (JWT).
- **Password Hashing**: Node.js `crypto.scrypt` (Salted, secure).
- **Validation**: `zod` for request validation.
- **State Management**: Stateless server, state held in signed HTTP-Only cookies.

### 2.2 Architectural Pattern
We will use a **Layered Architecture** to ensure clean separation of concerns:
1.  **Routes (`/server/routes/auth.routes.ts`)**: Define endpoints and map them to controllers.
2.  **Controllers (`/server/controllers/auth.controller.ts`)**: Handle HTTP requests/responses, input validation, and cookie management.
3.  **Services (`/server/services/auth.service.ts`)**: Contain business logic (hashing, token signing, user verification).
4.  **Storage (`/server/storage.ts`)**: Direct database access (Repository layer).

### 2.3 Security Features
- **Token Storage**: **HTTP-Only, Secure Cookies**.
    - *Why*: Prevents XSS attacks (JavaScript cannot read the token).
- **CSRF Protection**: `SameSite=Strict` cookie policy.
- **Rate Limiting**: Protection against brute-force (optional enhancement).
- **Algorithm**: `HS256` (HMAC SHA-256) for token signing.

## 3. Implementation Steps

### Phase 1: Infrastructure & Dependencies

#### 1. Dependencies
- Install `cookie-parser` and `jsonwebtoken` (and their types).
- Update `server/index.ts` to use `cookieParser()` middleware.

#### 2. Database Schema
- Modify `shared/schema.ts` to add the `users` table.
    - `id`: UUID
    - `username`: Text (Unique)
    - `password`: Text (Hashed)
    - `role`: Text (Default: "admin")
    - `createdAt`: Timestamp

### Phase 2: Core Logic (The "Clean" Layers)

#### 1. Auth Service (`server/services/auth.service.ts`)
- `registerAdmin(username, password)`: Hashes password, creates user.
- `loginAdmin(username, password)`: Verifies credentials, returns **User + Token**.
- `hashPassword(password)` / `verifyPassword(password, hash)`: Crypto utilities.
- `generateToken(user)`: Signs a JWT payload (`{ id, role }`).

#### 2. Auth Controller (`server/controllers/auth.controller.ts`)
- `register`: Calls service -> Returns 201.
- `login`: Calls service -> Sets **HTTP-Only Cookie** -> Returns 200 + User info.
- `logout`: Clears cookie -> Returns 200.
- `getMe`: Decodes token (from cookie) -> Returns user info.

#### 3. Middleware (`server/middleware/auth.middleware.ts`)
- `verifyToken`: interceptor that checks for the `auth_token` cookie.
    - If valid: attach `req.user`, call `next()`.
    - If invalid: Return 401 Unauthorized.

### Phase 3: Integration

#### 1. Wiring Routes (`server/routes.ts`)
- Import `authRoutes` from `server/routes/auth.routes.ts`.
- Mount them under `/api/auth`.
- Protect `/api/admin/*` routes with `verifyToken`.

#### 2. Seeding
- Ensure default admin exists on startup.

## 4. Verification Plan
- **Automated Testing**:
    - **Unit**: Test `auth.service.ts` (hashing, token generation).
    - **Integration**: Test `auth.controller.ts` endpoints (mock req/res).
- **Manual Verification**:
    - **Login**: Check browser DevTools -> Application -> Cookies for `auth_token` (should be HttpOnly).
    - **Access**: Try to access protected route.
    - **Logout**: Check cookie is removed.
