# Beaura

Beaura is a beauty-services marketplace that helps brides discover makeup artists, review their work, request bookings, communicate with artists, and manage booking payments. Makeup artists manage their public profiles, services, availability, bookings, messages, and wallet activity. Admin tools support platform operations, finance, artist monitoring, promotions, and customer support.

## Technology

- Next.js 16 (App Router) and React 18
- TypeScript
- Supabase (Authentication, Postgres, Row Level Security, Storage, and Realtime)
- Tailwind CSS
- Resend for transactional email
- WhatsApp Cloud API for configured booking confirmations

## Requirements

- Node.js compatible with the Next.js version in `package.json`
- npm
- A Supabase project
- Resend credentials for transactional email (optional for local work that does not send email)
- WhatsApp Cloud API credentials if WhatsApp confirmations are enabled

## Local setup

1. Clone the repository and check out the active development branch:

   ```bash
   git clone https://github.com/mshahd2410-create/beaura.git
   cd beaura
   git checkout feature/beaura-platform-upgrade
   ```

2. Install the locked dependencies:

   ```bash
   npm ci
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   If the repository does not contain an `.env.example` yet, create `.env.local` manually using the variable names below. Never commit real credentials.

4. Add the environment variables required for the features you are running.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App authentication and database access | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | Public/anon key; database access must still be protected by RLS |
| `RESEND_API_KEY` | Transactional email | Keep server-side; never prefix with `NEXT_PUBLIC_` |
| `EMAIL_FROM` | Custom email sender | Optional; defaults to Beaura's configured sender |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp booking confirmations | Server-side secret |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp booking confirmations | Meta WhatsApp Business phone-number ID |
| `WHATSAPP_API_VERSION` | WhatsApp API requests | Optional; code currently defaults to `v22.0` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | WhatsApp template language | Optional; code currently defaults to `en_US` |

Do not expose service-role keys, Resend keys, or WhatsApp tokens in browser code or variables prefixed with `NEXT_PUBLIC_`. Do not paste secrets into issues, pull requests, or documentation.

## Supabase database and migrations

Database migrations are stored in `supabase/migrations/`. Review each migration and its comments before applying it to a Supabase project. Apply migrations in chronological order using the Supabase SQL Editor or the project's established migration workflow, and keep a record of which migrations have already been applied. Do not blindly rerun migrations against a live database.

Some security migrations have deployment-order requirements:

- **Personal contact privacy – Phase 1:** `20261125000100_protect_personal_contact_details.sql` creates and populates the private artist-contact table and adds restricted RPCs.
- **Personal contact privacy – Phase 2:** `20261125000200_lock_down_public_profile_data.sql` removes public access to bride profile data and removes artist email/phone columns. Run only after Phase 1, the matching application changes have been deployed, and registration, account settings, booking emails, artist dashboards, and admin flows have been verified.
- **Private chat images:** `20261125001000_private_chat_image_storage.sql` makes the chat image bucket private. Deploy the signed-URL chat application changes first, then verify both bride and artist chat flows before applying this migration. The storage policy is intended to allow only participants in the relevant conversation.
- **Notifications:** `20261125000700_notification_security_hardening.sql` restricts direct notification inserts and provides the `create_booking_notification` RPC. The matching application helper must be deployed before relying on notification creation in production.

Security migrations can affect live application flows. Test with separate bride, artist, and admin accounts before applying contract/lockdown migrations. Never make a public bucket private or remove an existing policy until the application code that replaces that access path is live and verified.

## Useful commands

```bash
npm run dev      # Start the local development server
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run start    # Start the production server after a successful build
```

Run lint and build before proposing a release. A successful local build does not replace testing against the configured Supabase project.

## Main application areas

- `app/bride/` – bride discovery, artist profiles, booking, account, messages, and wallet pages
- `app/dashboard/mua/` – artist dashboard, bookings, calendar, services, portfolio, reviews, messages, performance, settings, and wallet
- `app/admin/` – admin operations, finance, artist monitoring, support, promotions, audit logs, and risk tools
- `app/api/` – server-side API routes, including transactional email and admin booking notifications
- `components/` – shared interface components
- `lib/` – Supabase clients, notification helpers, email utilities, and shared logic
- `supabase/migrations/` – database schema and security migrations
- `app/photos/photos/` – local inspiration-gallery photo assets

## Before release

- Verify bride, artist, and admin registration/login flows.
- Test booking creation, confirmation, cancellation, refunds, and payment status transitions.
- Test artist calendar conflict handling and simultaneous booking attempts.
- Test chat text, image upload, signed image viewing, and participant-only access.
- Test in-app notifications and configured email/WhatsApp delivery.
- Verify RLS and storage policies using separate user accounts, not only an admin session.
- Test important pages on real mobile devices.
- Run `npm run lint` and `npm run build`.
- Confirm backups and a tested restore procedure.
- Review environment variables and deployment settings without exposing secrets.

## Branch and release workflow

The active development branch for the current upgrade work is `feature/beaura-platform-upgrade`. Keep changes on that branch unless the project owner explicitly approves a different workflow. Do not merge to `main` or deploy without explicit approval.
