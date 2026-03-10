# Kosti Revision

Kosti is a Next.js 16 revision app with Supabase Auth and Supabase-backed user persistence for:

- account profiles
- onboarding and focus breakdown
- diagnostic attempts and topic scores
- revision progress
- activity history

The UI is intentionally client-heavy, while user-specific state is protected by Supabase Auth session cookies plus Row Level Security policies.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Framer Motion
- Supabase Auth
- Supabase Postgres + RLS

## Required Environment Variables

Create a local `.env.local` from `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred key name.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still supported as a fallback, but new setups should use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `NEXT_PUBLIC_APP_URL` is strongly recommended for production and email flows. If omitted, browser auth actions fall back to `window.location.origin`.
- `NEXT_PUBLIC_SITE_URL` is also supported as an optional fallback if your hosting platform already provides a canonical public origin.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase, copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Apply the SQL migration in `supabase/migrations/20260310_init.sql`.
4. Confirm the following tables exist:
   - `profiles`
   - `user_onboarding`
   - `focus_breakdown_entries`
   - `diagnostic_attempts`
   - `diagnostic_topic_scores`
   - `revision_progress`
   - `activity_history`

## Required Supabase Auth Configuration

In Supabase Dashboard -> Authentication -> URL Configuration:

- Set **Site URL** to your deployed app origin.
  - Local example: `http://localhost:3000`
  - Production example: `https://your-domain.com`
- Add **Redirect URLs** for every environment that will handle auth links.
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

If you use preview deployments, add each preview domain pattern or origin allowed by your Supabase plan/workflow.

For password recovery:

- Recovery emails must return to `/auth/callback?next=/auth/update-password`
- The app constructs that route automatically, but the base origin must be allowed in Supabase redirect settings.

For email confirmation:

- Confirmation links also return through `/auth/callback`
- After callback/session exchange, routing continues through the normal onboarding gate:
  - no onboarding -> `/onboarding`
  - onboarding incomplete -> `/onboarding/focus`
  - onboarding complete -> `/home`

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Before testing auth locally:

- make sure `.env.local` is populated
- make sure the local callback URL is added to Supabase Auth redirect settings
- make sure the SQL migration has been applied

## Production Deployment Notes

Recommended deployment flow:

1. Deploy the Next.js app to your host.
2. Set the production environment variables there.
3. Set `NEXT_PUBLIC_APP_URL` to the final production origin.
4. Update Supabase **Site URL** and **Redirect URLs** to include the production callback URL.
5. Verify the email templates in Supabase Auth use the correct environment.

Hosting considerations:

- The app relies on `src/proxy.ts` for protected-route session refresh and onboarding redirects.
- Deployment must preserve Next.js proxy/middleware behavior.
- Auth cookies are managed through Supabase SSR helpers and refreshed at the edge/request layer.

## Database / Security Notes

The app currently uses the browser Supabase client for authenticated mutations and reads. Protection depends on:

- Supabase Auth session cookies
- Row Level Security policies in `supabase/migrations/20260310_init.sql`

This means:

- client code can talk directly to Supabase
- user data is still isolated by `auth.uid()`
- deployment must not skip the migration or disable RLS

## Main User Flows

1. New user
   - sign up
   - confirm email if enabled
   - callback exchanges code for a session
   - onboarding -> focus breakdown -> home

2. Returning user
   - existing session restored by proxy + provider bootstrap
   - protected route loads persisted account state

3. Recovery user
   - request reset email
   - open recovery link
   - callback exchanges code for session
   - update password on `/auth/update-password`

4. Settings flow
   - open `/settings`
   - update nickname
   - provider rehydrates from Supabase
   - navbar and app use persisted nickname after refresh

## Verification Commands

```bash
npm run lint
npm run build
```

## Current Architecture Boundary

- Static content remains in source files:
  - topic definitions
  - subtopic trees
  - resource/material catalog definitions
- User-specific overlays are remote:
  - account/profile state
  - onboarding choices
  - focus breakdown
  - diagnostics
  - progress
  - activity history

That boundary should stay intact unless the content model itself is intentionally moved into the database later.
