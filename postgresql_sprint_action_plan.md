# Sprint Action Plan: PostgreSQL Integration & User Profile Creation

**Project:** Love Thy Neighbor

**Target Branch:** `dev`

**Integration Focus:** Sprint tasks for User Authentication & Metadata Persistence (PostgreSQL temporary setup)

## 1. Overview & Objectives

### Jira Task 1: Link Database to Profile Creation

* **Scope:** Connect `Signup.jsx` to the database through the backend API.

* **Acceptance Criteria:** Account creation establishes end-to-end functionality between front-end and PostgreSQL storage. Plaintext credential persistence is acceptable for this initial functionality milestone.

### Jira Task 2: Store User Metadata

* **Scope:** Persist user metadata associated with platform operations (roles, contact info, physical location, preferences).

* **Acceptance Criteria:**

  * Two-table relational structure: `users` (credentials) and `user_profiles` (domain metadata).

  * Foreign key constraints (`ON DELETE CASCADE`).

  * Non-null constraints, default values, and indexes on role, geocoordinates, and verification flags.

  * Atomic transactions spanning both tables.

## 2. Environment & Configuration

Create or update your `.env` file in the project root:

```
PORT=5000
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=love_thy_neighbor
PGPORT=5432

```

Install the PostgreSQL client driver:

```
npm install pg

```

## 3. Database Migration Script

Save to `migrations/001_postgres_init.sql`:

```
-- Create ENUM types safely
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('donor', 'recipient', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'both', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Base credentials table
CREATE TABLE IF NOT EXISTS users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Metadata table with foreign key constraint
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'donor',
    display_name VARCHAR(100) NOT NULL,
    organization_name VARCHAR(150) DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    address_line VARCHAR(255) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    notification_pref notification_channel NOT NULL DEFAULT 'email',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_user_role ON user_profiles (role);
CREATE INDEX IF NOT EXISTS idx_user_coordinates ON user_profiles (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_verified ON user_profiles (is_verified);

```

## 4. Application Implementation

### A. Database Connection Pool (`config/db.js`)

```
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'love_thy_neighbor',
  port: Number(process.env.PGPORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000
});

export default pool;

```

### B. Express Registration Route (`routes/auth.js`)

```
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const {
    email,
    password,
    role,
    displayName,
    organizationName,
    phoneNumber,
    addressLine
  } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert credentials and retrieve auto-generated ID
    const insertUserQuery = `
      INSERT INTO users (email, password)
      VALUES ($1, $2)
      RETURNING id;
    `;
    const userResult = await client.query(insertUserQuery, [email, password]);
    const newUserId = userResult.rows[0].id;

    // 2. Insert metadata linked to user ID
    const insertProfileQuery = `
      INSERT INTO user_profiles 
        (user_id, role, display_name, organization_name, phone_number, address_line)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await client.query(insertProfileQuery, [
      newUserId,
      role || 'donor',
      displayName,
      organizationName || null,
      phoneNumber || null,
      addressLine || null
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User account and profile created successfully.',
      userId: newUserId
    });
  } catch (error) {
    await client.query('ROLLBACK');

    // Postgres unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during account creation.' });
  } finally {
    client.release();
  }
});

export default router;

```

### C. Client Registration Form (`src/components/Signup.jsx`)

```
import React, { useState } from 'react';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'donor',
    organizationName: '',
    phoneNumber: '',
    addressLine: ''
  });

  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      setStatus({ loading: false, error: null, success: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Love Thy Neighbor - Sign Up</h2>
      {status.error && (
        <div style={{ padding: '0.75rem', background: '#ffebee', color: '#c62828', marginBottom: '1rem' }}>
          {status.error}
        </div>
      )}
      {status.success && (
        <div style={{ padding: '0.75rem', background: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem' }}>
          Account created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>Email *</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Password *</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />

        <label>Full Name / Contact Person *</label>
        <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} required />

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="donor">Food Donor</option>
          <option value="recipient">Recipient / Organization</option>
        </select>

        <label>Organization Name (optional)</label>
        <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} />

        <label>Phone Number</label>
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />

        <label>Address</label>
        <input type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} />

        <button type="submit" disabled={status.loading} style={{ padding: '0.75rem', marginTop: '1rem' }}>
          {status.loading ? 'Creating...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

```

## 5. CLI Automation Script

Save this script as `scripts/sprint_deploy.sh` and make it executable (`chmod +x scripts/sprint_deploy.sh`). It automates schema creation, health verification, API smoke testing, and Git commits.

```
#!/usr/bin/env bash
set -e

# --- Configuration & Defaults ---
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-love_thy_neighbor}"
API_URL="${API_URL:-http://localhost:5000/api/auth/signup}"
MIGRATION_FILE="migrations/001_postgres_init.sql"

echo "===================================================="
echo "  Love Thy Neighbor: PostgreSQL Sprint Runner       "
echo "===================================================="

# 1. Check PostgreSQL Connectivity
echo "--> Checking PostgreSQL connection..."
if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
    echo "ERROR: PostgreSQL is not reachable at $PGHOST:$PGPORT."
    exit 1
fi
echo "    PostgreSQL is active."

# 2. Apply Database Migration
echo "--> Running schema migration: $MIGRATION_FILE..."
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$MIGRATION_FILE"
echo "    Migration successfully applied."

# 3. Verify Table Creation
echo "--> Verifying database tables..."
TABLE_COUNT=$(PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -A -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_name IN ('users', 'user_profiles');")

if [ "$TABLE_COUNT" -ne 2 ]; then
    echo "ERROR: Expected 2 tables ('users', 'user_profiles'), found $TABLE_COUNT."
    exit 1
fi
echo "    Tables 'users' and 'user_profiles' confirmed."

# 4. End-to-End API Smoke Test (Optional: requires backend running)
read -p "--> Is the backend server running and ready for an API test? (y/N): " RUN_API_TEST
if [[ "$RUN_API_TEST" =~ ^[Yy]$ ]]; then
    TEST_EMAIL="smoke_test_$(date +%s)@example.com"
    echo "--> Testing signup route with $TEST_EMAIL..."
    
    PAYLOAD=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "testpassword123",
  "displayName": "Smoke Test User",
  "role": "donor",
  "organizationName": "Community Food Share"
}
EOF
)

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD")

    HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_STATUS" -eq 201 ]; then
        echo "    API Test PASSED: HTTP $HTTP_STATUS"
        echo "    Response: $BODY"
    else
        echo "    API Test FAILED: HTTP $HTTP_STATUS"
        echo "    Response: $BODY"
        exit 1
    fi

    # Duplicate entry test
    echo "--> Verifying 409 Conflict rejection for duplicate emails..."
    DUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD")
    DUP_STATUS=$(echo "$DUP_RESPONSE" | tail -n1)

    if [ "$DUP_STATUS" -eq 409 ]; then
        echo "    Conflict validation PASSED: HTTP 409 received."
    else
        echo "    Conflict validation FAILED: Received HTTP $DUP_STATUS instead of 409."
        exit 1
    fi
fi

# 5. Git Commit & Preparation for Main
read -p "--> Do you want to stage and commit these sprint changes now? (y/N): " CONFIRM_GIT
if [[ "$CONFIRM_GIT" =~ ^[Yy]$ ]]; then
    BRANCH_NAME="feat/postgres-user-signup"
    echo "--> Switching to branch: $BRANCH_NAME..."
    git checkout -B "$BRANCH_NAME"

    echo "--> Staging changes..."
    git add package.json package-lock.json migrations/ config/ routes/ src/ components/ scripts/

    echo "--> Committing..."
    git commit -m "feat: link user registration to PostgreSQL with metadata schema"

    echo "--> Fetching and rebasing against origin/main..."
    git fetch origin main || true
    git rebase origin/main || true

    echo ""
    echo "===================================================="
    echo "  Sprint build complete! Push with:                 "
    echo "  git push origin $BRANCH_NAME                     "
    echo "===================================================="
fi

```

## 6. Manual CLI Execution Commands

If executing commands manually step-by-step:

### Run the Migration

```
psql -U postgres -d love_thy_neighbor -f migrations/001_postgres_init.sql

```

### Inspect PostgreSQL Schema

```
psql -U postgres -d love_thy_neighbor -c "\d users"
psql -U postgres -d love_thy_neighbor -c "\d user_profiles"

```

### Execute Manual Curl Test

```
curl -i -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "neighbor@example.com",
    "password": "temporary_plain_pass",
    "displayName": "Alex Green",
    "role": "donor",
    "organizationName": "Harvest Pantry",
    "phoneNumber": "555-0199",
    "addressLine": "123 Main St"
  }'

```

### Query Linked Data

```
psql -U postgres -d love_thy_neighbor -c "
SELECT 
    u.id, 
    u.email, 
    p.role, 
    p.display_name, 
    p.organization_name, 
    p.created_at
FROM users u
JOIN user_profiles p ON u.id = p.user_id;"

```

## 7. Git Merge & Release Checklist

1. Checkout feature branch:

   ```
   git checkout -b feat/postgres-user-signup
   
   ```

2. Verify all files staged:

   * `package.json` (`pg` driver included)

   * `migrations/001_postgres_init.sql`

   * `config/db.js`

   * `routes/auth.js`

   * `src/components/Signup.jsx`

   * `scripts/sprint_deploy.sh`

3. Push upstream and open Pull Request:

   ```
   git push -u origin feat/postgres-user-signup
   
   ```

4. Merge into `main` after CI/peer sign-off.

5. Move Jira tickets **"Link MySQL database to profile creation"** and **"Store user metadata"** to **Done**.