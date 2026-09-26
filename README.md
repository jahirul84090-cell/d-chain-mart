# D Chin Mart

Online store for Bangladesh built with Next.js 15 (App Router), Prisma (MySQL),
NextAuth, ImageKit and Tailwind CSS. It supports cash on delivery, EMI/loan
applications, an admin dashboard, invoices (PDF), reviews and inventory.

## Requirements

- Node.js 20+
- MySQL 8 (or MariaDB 10.6+)
- An ImageKit account and an SMTP mailbox

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npx prisma migrate deploy
npm run dev
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string |
| `SHADOW_DATABASE_URL` | Scratch database, only needed for `prisma migrate dev` |
| `NEXTAUTH_SECRET` | **Required in production.** Long random string used to sign sessions (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public site URL, e.g. `https://dchinmart.com` |
| `BASE_URL` | Public site URL (used for canonical URLs, sitemap and server fetches) |
| `SITE_NAME` | Store name shown in titles and emails (default `D Chin Mart`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | Image uploads. Loan documents are stored as **private** files and served through signed URLs |
| `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `SMTPEMAIL`, `SMTPASSWORD`, `EMAIL_FROM` | SMTP for OTP, order and invoice emails |
| `ADMIN_EMAIL` | Receives new-order notifications |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY` | Contact details shown on the site |

## Production

```bash
npm run build      # prisma generate + prisma db push + next build
npm run prod       # node server.js (PORT defaults to 30000)
```

The build needs database access: some pages and the sitemap are generated
from the database at build time.

### Deploying this release

This release adds a migration (`20260926000000_security_and_indexes`):
an `otpAttempts` column, a non-unique `otpCode`, and indexes for product
listings. `npm run build` applies it through `prisma db push`; if you deploy
with migrations instead, run `npx prisma migrate deploy` before starting.

After deploying:

1. Make sure `NEXTAUTH_SECRET` is set. There is no fallback secret any more.
2. Submit `https://<your-domain>/sitemap.xml` in Google Search Console.
3. Loan documents uploaded before this release remain public in ImageKit.
   Mark them private in the ImageKit dashboard (folder `/loans`). The app
   already serves them through signed URLs.

## Security notes

- Every `/api/admin/*` write and every admin read requires a `SUPER_ADMIN`
  session (`requireAuthenticatedUser` in `src/lib/authCheck.js`).
- Customers can only read their own orders, invoices and loans.
- OTP codes are random, expire after 10 minutes, lock after 5 wrong
  attempts, and can be re-sent at most once a minute.
- Product cost price (`buyingPrice`) is never returned by the API.

## SEO

- `src/app/sitemap.js`, `src/app/robots.js` and `src/app/manifest.js` generate
  `/sitemap.xml`, `/robots.txt` and `/manifest.webmanifest`.
- Product pages live at `/{slug}` with canonical URLs, Open Graph tags and
  Product/Breadcrumb structured data.
- Private pages (account, cart, checkout, orders, loans, dashboard) are
  `noindex`.
