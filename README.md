# Thoughts Whatever

A Bengali literature and documentary publication. Every reel on the Instagram
page has a full written piece behind it, and this site is where that writing
lives — the reel is the trailer, the page is the work.

The interface is in English; everything a reader actually reads is Bengali.

- **`/`** — front page
- **`/writing`** — রচনা, the literary pieces
- **`/blog`** — blog posts
- **`/documentary`** — documentary pieces, in a dark cinematic treatment
- **`/series`** — multi-part works, in order
- **`/authors`** — the writers, with their eras
- **`/archive`** — everything, filterable by kind, author, tag, series, year
- **`/search`** — Bengali-aware search, tolerant of spelling variation
- **`/bookmarks`** — the reader's own saved pieces, kept in the browser
- **`/admin`** — the editor (one account, no public sign-up)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill it in, then:

```bash
npm run db:push     # create the tables
npm run db:seed     # authors, tags, a series, eight pieces
npm run admin:hash -- you@example.com "your password" "আপনার নাম"
npm run dev
```

Sign in at `/admin/login`.

The seed is idempotent — it upserts by slug and never wipes, so running it
again on a database you have been writing to is safe. One of the eight pieces
is left as a `DRAFT` on purpose, so you can see that the published-only filter
is doing its job.

## Environment

Five variables are read anywhere in the code:

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Local, or hosted (Neon / Supabase / Railway). |
| `AUTH_SECRET` | Signs the admin session cookie. Any long random string — `openssl rand -base64 48`. |
| `NEXT_PUBLIC_SITE_URL` | Absolute base for canonical URLs, the sitemap, RSS, and OG images. |
| `NEXT_PUBLIC_SITE_NAME` | Site name in metadata and the feed. |
| `NEXT_PUBLIC_INSTAGRAM` | Linked from the header and footer. |

## Publishing

Writing happens in `/admin`, not in files. A piece is one record: the reel it
came from, the dek, the excerpt, and `bodyBn` — the full written work. Sources
and a timeline can hang off a documentary piece; authors, tags, and series are
managed on their own screens and refuse to delete while pieces still point at
them.

Saving revalidates the paths that piece appears on, including `/archive`,
`/sitemap.xml`, `/rss.xml`, and the search index. A rename revalidates the old
slug too.

There is no sign-up page anywhere on the site, deliberately. A publication with
one writer does not need a registration form, and not having one means the only
way to create an account is `scripts/hash-password.ts` run with database
access:

```bash
npm run admin:hash -- you@example.com "your password" "আপনার নাম"
```

Run it again with the same email to change the password.

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the schema without a migration |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Seed content |
| `npm run db:studio` | Prisma Studio |
| `npm run admin:hash` | Create or update the admin account |

## Building

`npm run build` needs a reachable `DATABASE_URL`. `generateStaticParams` in
`/series/[slug]` and `/authors/[slug]` queries Postgres to enumerate pages, so
without a connection the build fails during page-data collection — after
compiling and type-checking cleanly.

To check types without a database:

```bash
npx tsc --noEmit
```

