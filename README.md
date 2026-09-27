# Nihongo Palette

Nihongo Palette is a Next.js + TypeScript MVP for a Japanese learning, experience, and connection platform.

Source of Truth:

- Notion: `Nihongo Palette 企画書`
- Notion: `Nihongo Palette 画面仕様書`
- Notion: `Nihongo Palette DB設計書`
- Google Drive: logo, image, and illustration assets

Figma is intentionally not used as an implementation reference.

## Sprint 1 Scope

- Next.js App Router + TypeScript initialization
- Supabase browser/server client setup with cookie-based SSR support
- Environment variable sample
- Minimal connection confirmation screen
- Google OAuth entry point
- Email/Password auth fallback for Auth -> User -> DB verification
- Initial Supabase SQL schema and RLS policies based on the Notion DB design
- Lint, typecheck, and unit/UI test scripts

## Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Apply the initial database schema in Supabase SQL editor or through Supabase CLI:

```bash
supabase/migrations/0001_initial_schema.sql
```

For Google OAuth, configure the Google provider in Supabase Auth and add this callback URL to the redirect allow list:

```text
http://localhost:3000/auth/callback
```

## Development

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
```
