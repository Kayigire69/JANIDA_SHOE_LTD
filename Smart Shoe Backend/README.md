# Smart Shoe Backend

Express and PostgreSQL backend for Smart Shoe Factory registration and authentication.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your PostgreSQL database name, user, password, JWT secret, email, and app password.
3. Install dependencies:

```bash
npm install
```

4. Run the database migration:

```bash
npm run db:migrate
```

5. Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

## Auth API

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/change-password`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify`
- `GET /api/auth/sessions`
- `POST /api/auth/logout`
