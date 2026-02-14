# Implementation Plan: Smart Contract Integration & Backend

## 1. Smart Contract Integration (Frontend)

We will integrate the `STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87.escrow-multi-token-v4` contract into the `CreateProjectModal`.

### Contract Functions used:
*   **STX Projects**: `create-project-stx(freelancer principal, m1 uint, m2 uint, m3 uint, m4 uint)`
*   **sBTC Projects**: `create-project-sbtc(freelancer principal, m1 uint, m2 uint, m3 uint, m4 uint, sbtc-token <trait>)`

### Frontend Changes:
1.  **Refactor `CreateProjectModal.tsx`**:
    *   Instead of calling the mock service, use `@stacks/connect`'s `openContractCall`.
    *   Calculate the 4 milestone amounts in MICRO-STX/SATOSHIS (multiply by 1,000,000 for STX, 100,000,000 for sBTC).
    *   Handle the user signing the transaction.
2.  **Handle Transaction Success (`onFinish`)**:
    *   Capture the `txId` returned by the wallet.
    *   **CRITICAL**: Immediately send the project metadata (Title, Description, Category, Files) + `txId` to our Backend API.

## 2. Backend Architecture (Local SQL Database)

Since the frontend is a pure React (Vite) app, it cannot directly talk to a SQL database securely. We will create a **simple local backend server** to handle database operations.

### Local Stack:
*   **Server**: Node.js + Express (running locally on port 3001).
*   **Database**: Local MySQL (or SQLite for easier testing).
*   **ORM/Client**: `mysql2` to connect to your local SQL instance.

### Directory Structure:
We will create a new folder `server/` in the project root:
```
/server
  /package.json
  /server.js (Express app)
  /db.js (Database connection)
  /.env (DB Credentials)
```

### Database Schema (SQL):
You will need to run this SQL in your local database:
```sql
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tx_id VARCHAR(66) UNIQUE NOT NULL,
    client_address VARCHAR(42) NOT NULL,
    freelancer_address VARCHAR(42) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    total_budget DECIMAL(20, 8),
    token_type VARCHAR(10) DEFAULT 'STX',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    title VARCHAR(255),
    amount DECIMAL(20, 8),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### API Endpoints (Local):
1.  **`POST http://localhost:3001/api/projects`**: Saves project metadata.
2.  **`GET http://localhost:3001/api/projects`**: Returns list (for "Browse Gigs").

## 3. Implementation Steps

### Step 1: Frontend Contract Call
*   Create `lib/contracts.ts` with `createProject` function using `@stacks/connect`.
*   On success (`onFinish`), call `http://localhost:3001/api/projects`.

### Step 2: Local Backend Setup
*   Initialize `server/` folder.
*   Install `express`, `mysql2`, `cors`, `dotenv`.
*   Create `server.js` with the API endpoints.
*   **User Action**: You will need to provide your local SQL credentials in `server/.env`.

### Step 3: Integrate with UI
*   Refactor `CreateProjectModal` to call `createProject` (Smart Contract) -> then `API` (Backend).
*   Update "Browse Gigs" to fetch from `http://localhost:3001/api/projects`.

## 4. Verification Plan
1.  **Unit Test**: Verify `projects` table creation SQL works (manual check).
2.  **Manual Test**:
    *   Run `createProject` in frontend.
    *   Sign transaction with Leather/Xverse (Testnet).
    *   Verify `txId` is logged.
    *   Verify data payload is formatted for Backend.
3.  **Visibility**:
    *   Check "Browse Gigs" to see if the new project appears (simulated backend response for now until Hostinger is live).
